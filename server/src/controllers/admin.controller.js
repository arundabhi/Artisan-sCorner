import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { VendorApplication } from "../models/vendorApplication.model.js";
import { Store } from "../models/store.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../constants.js";

/**
 * @desc Get high-level dashboard statistics
 * @route GET /api/v1/admin/dashboard
 * @access Private (admin only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalUsers, totalVendors, totalProducts, totalOrders, pendingVendors, revenueResult, dailyRevenue] =
    await Promise.all([
      User.countDocuments({ role: ROLES.BUYER }),
      User.countDocuments({ role: ROLES.VENDOR }),
      Product.countDocuments({}),
      Order.countDocuments({}),
      VendorApplication.countDocuments({ status: "pending" }),
      Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalPlatformFee: { $sum: "$platformFee" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "PAID",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
            earnings: { $sum: "$platformFee" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const revenue = revenueResult[0] || { totalRevenue: 0, totalPlatformFee: 0 };
  const grossSales = revenue.totalRevenue || 0;
  const platformEarnings = revenue.totalPlatformFee || 0;
  const vendorPayouts = grossSales - platformEarnings;

  const revenueOverTime = dailyRevenue.map((item) => ({
    date: item._id,
    revenue: Number(item.revenue.toFixed(2)),
    earnings: Number(item.earnings.toFixed(2)),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        overview: {
          grossSales,
          platformEarnings,
          vendorPayouts,
          orderCount: totalOrders,
          totalUsers,
          totalVendors,
          totalProducts,
          pendingVendors,
        },
        revenueOverTime,
      },
      "Dashboard statistics fetched successfully"
    )
  );
});

/**
 * @desc Get all users with pagination
 * @route GET /api/v1/admin/users
 * @access Private (admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpiry")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Users fetched successfully"
    )
  );
});

/**
 * @desc Get a single user by ID
 * @route GET /api/v1/admin/users/:userId
 * @access Private (admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpiry"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * @desc Activate a user account
 * @route PATCH /api/v1/admin/users/:userId/activate
 * @access Private (admin only)
 */
const activateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isActive: true } },
    { new: true }
  ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpiry");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User activated successfully"));
});

/**
 * @desc Deactivate a user account
 * @route PATCH /api/v1/admin/users/:userId/deactivate
 * @access Private (admin only)
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot deactivate your own admin account");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isActive: false }, $unset: { refreshToken: 1 } },
    { new: true }
  ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpiry");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User deactivated successfully"));
});

/**
 * @desc Get all approved vendors (as stores)
 * @route GET /api/v1/admin/vendors
 * @access Private (admin only)
 */
const getVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [stores, total] = await Promise.all([
    Store.find({})
      .populate("owner", "name email isActive")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Store.countDocuments({}),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vendors: stores,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Vendors fetched successfully"
    )
  );
});

/**
 * @desc Approve a vendor application (admin shortcut, mirrors vendor.controller)
 * @route PATCH /api/v1/admin/vendors/:applicationId/approve
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

  if (application.user.toString() === req.user._id.toString()) {
    throw new ApiError(403, "You cannot approve your own vendor application");
  }

  application.status = "approved";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  await User.findByIdAndUpdate(application.user, {
    $set: { role: ROLES.VENDOR },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, application, "Vendor approved successfully"));
});

/**
 * @desc Reject a vendor application (admin shortcut, mirrors vendor.controller)
 * @route PATCH /api/v1/admin/vendors/:applicationId/reject
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

/**
 * @desc Delete any product on the platform
 * @route DELETE /api/v1/admin/products/:productId
 * @access Private (admin only)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/**
 * @desc Get all products on the platform (admin view)
 * @route GET /api/v1/admin/products
 * @access Private (admin only)
 */
const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find({})
      .populate("vendor", "name email")
      .populate("store", "name slug")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments({}),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Products fetched successfully"
    )
  );
});

/**
 * @desc Get all orders on the platform (admin view)
 * @route GET /api/v1/admin/orders
 * @access Private (admin only)
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.orderStatus = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Orders fetched successfully"
    )
  );
});

/**
 * @desc Update the platform-wide commission percentage
 * @route PATCH /api/v1/admin/commission
 * @access Private (admin only)
 *
 * NOTE: process.env values cannot be persisted at runtime in most deployments.
 * This assumes a PlatformSettings-style persistence layer; adjust the import
 * if a dedicated settings model/service already exists in the project.
 */
const updateCommission = asyncHandler(async (req, res) => {
  const { commissionPercent } = req.body;

  const numericCommission = Number(commissionPercent);

  if (
    Number.isNaN(numericCommission) ||
    numericCommission < 0 ||
    numericCommission > 100
  ) {
    throw new ApiError(400, "Commission percent must be a number between 0 and 100");
  }

  // Persisted via a dynamic settings store since process.env cannot be
  // safely mutated across server instances. Replace with the project's
  // actual settings model/service if one already exists.
  const { PlatformSetting } = await import("../models/platformSetting.model.js");

  const setting = await PlatformSetting.findOneAndUpdate(
    { key: "PLATFORM_COMMISSION_PERCENT" },
    { $set: { value: numericCommission, updatedBy: req.user._id } },
    { new: true, upsert: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, setting, "Platform commission updated successfully")
    );
});

export {
  getDashboardStats,
  getUsers,
  getUserById,
  activateUser,
  deactivateUser,
  getVendors,
  approveVendor,
  rejectVendor,
  deleteProduct,
  getProducts,
  getOrders,
  updateCommission,
};
