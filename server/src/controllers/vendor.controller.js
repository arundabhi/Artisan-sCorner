import mongoose from "mongoose";
import { VendorApplication } from "../models/vendorApplication.model.js";
import { Store } from "../models/store.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../constants.js";
import { startTransactionHelper } from "../utils/transaction.js";

/**
 * @desc Apply to become a vendor
 * @route POST /api/v1/vendors/apply
 * @access Private (authenticated user)
 */
const applyForVendor = asyncHandler(async (req, res) => {
  const { storeName, businessDescription, businessAddress, phone } = req.body;

  if (!storeName?.trim()) {
    throw new ApiError(400, "Store name is required");
  }

  if (req.user.role === ROLES.VENDOR) {
    throw new ApiError(409, "You are already an approved vendor");
  }

  const existingApplication = await VendorApplication.findOne({
    user: req.user._id,
    status: { $in: ["pending", "approved"] },
  });

  if (existingApplication) {
    throw new ApiError(
      409,
      "You already have a pending or approved vendor application"
    );
  }

  const application = await VendorApplication.create({
    user: req.user._id,
    storeName: storeName.trim(),
    businessDescription,
    businessAddress,
    phone,
    status: "pending",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, application, "Vendor application submitted successfully")
    );
});

/**
 * @desc Get the logged-in user's own vendor application
 * @route GET /api/v1/vendors/application
 * @access Private
 */
const getVendorApplication = asyncHandler(async (req, res) => {
  const application = await VendorApplication.findOne({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  if (!application) {
    throw new ApiError(404, "No vendor application found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, application, "Vendor application fetched"));
});

/**
 * @desc Update the logged-in user's own pending vendor application
 * @route PATCH /api/v1/vendors/application
 * @access Private
 */
const updateVendorApplication = asyncHandler(async (req, res) => {
  const application = await VendorApplication.findOne({
    user: req.user._id,
    status: "pending",
  });

  if (!application) {
    throw new ApiError(404, "No pending vendor application found to update");
  }

  const allowedFields = [
    "storeName",
    "businessDescription",
    "businessAddress",
    "phone",
  ];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      application[field] = req.body[field];
    }
  }

  await application.save();

  return res
    .status(200)
    .json(new ApiResponse(200, application, "Vendor application updated"));
});

/**
 * @desc Get all vendor applications (optionally filtered by status)
 * @route GET /api/v1/vendors/applications
 * @access Private (admin only)
 */
const getAllVendorApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    VendorApplication.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    VendorApplication.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Vendor applications fetched successfully"
    )
  );
});

/**
 * @desc Approve a vendor application
 * @route PATCH /api/v1/vendors/applications/:applicationId/approve
 * @access Private (admin only)
 */
const approveVendor = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const application = await VendorApplication.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Vendor application not found");
  }

  if (application.status === "approved") {
    throw new ApiError(409, "This application has already been approved");
  }

  if (application.user.toString() === req.user._id.toString()) {
    throw new ApiError(403, "You cannot approve your own vendor application");
  }

  const session = await startTransactionHelper();
  try {
    if (session) {
      session.startTransaction();
    }

    application.status = "approved";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save({ session });

    await User.findByIdAndUpdate(
      application.user,
      { $set: { role: ROLES.VENDOR } },
      { session }
    );

    let store = await Store.findOne({ owner: application.user }).session(
      session
    );

    if (!store) {
      const baseSlug = application.storeName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      let slug = baseSlug;
      let suffix = 1;
      while (await Store.findOne({ slug }).session(session)) {
        slug = `${baseSlug}-${suffix++}`;
      }

      store = await Store.create(
        [
          {
            owner: application.user,
            name: application.storeName,
            slug,
            description: application.businessDescription,
            phone: application.phone,
            address: application.businessAddress,
            isApproved: true,
            status: "active",
          },
        ],
        { session }
      );
    } else {
      store.isApproved = true;
      store.status = "active";
      await store.save({ session });
    }

    if (session) {
      await session.commitTransaction();
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, application, "Vendor application approved"));
});

/**
 * @desc Reject a vendor application
 * @route PATCH /api/v1/vendors/applications/:applicationId/reject
 * @access Private (admin only)
 */
const rejectVendor = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { rejectionReason } = req.body;

  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const application = await VendorApplication.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "Vendor application not found");
  }

  if (application.status === "approved") {
    throw new ApiError(409, "Cannot reject an already approved application");
  }

  if (application.user.toString() === req.user._id.toString()) {
    throw new ApiError(403, "You cannot reject your own vendor application");
  }

  application.status = "rejected";
  application.rejectionReason = rejectionReason || "Not specified";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  return res
    .status(200)
    .json(new ApiResponse(200, application, "Vendor application rejected"));
});

export {
  applyForVendor,
  getVendorApplication,
  updateVendorApplication,
  getAllVendorApplications,
  approveVendor,
  rejectVendor,
};
