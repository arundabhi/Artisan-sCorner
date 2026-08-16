import mongoose from "mongoose";
import { Store } from "../models/store.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import { ROLES } from "../constants.js";

const generateUniqueSlug = async (name, excludeStoreId = null) => {
  const baseSlug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const query = { slug };
    if (excludeStoreId) {
      query._id = { $ne: excludeStoreId };
    }
    const existing = await Store.findOne(query);
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  return slug;
};

/**
 * @desc Create a store for an approved vendor
 * @route POST /api/v1/stores
 * @access Private (approved vendor only)
 */
const createStore = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VENDOR) {
    throw new ApiError(403, "Only approved vendors can create a store");
  }

  const { name, description, phone, address } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Store name is required");
  }

  const existingStore = await Store.findOne({ owner: req.user._id });
  if (existingStore) {
    throw new ApiError(409, "You already have a store");
  }

  const slug = await generateUniqueSlug(name);

  const store = await Store.create({
    owner: req.user._id,
    name: name.trim(),
    slug,
    description,
    phone,
    address,
    isApproved: true,
    status: "active",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, store, "Store created successfully"));
});

/**
 * @desc Get the logged-in vendor's own store
 * @route GET /api/v1/stores/me
 * @access Private (vendor)
 */
const getStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, store, "Store fetched successfully"));
});

/**
 * @desc Get a public store by its slug
 * @route GET /api/v1/stores/slug/:slug
 * @access Public
 */
const getStoreBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug?.trim()) {
    throw new ApiError(400, "Store slug is required");
  }

  const store = await Store.findOne({
    slug,
    isApproved: true,
    status: "active",
  })
    .populate("owner", "name avatar")
    .lean();

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, store, "Store fetched successfully"));
});

/**
 * @desc Update the logged-in vendor's own store
 * @route PATCH /api/v1/stores/me
 * @access Private (vendor - store owner only)
 */
const updateStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const allowedFields = ["name", "description", "phone", "address"];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      store[field] = req.body[field];
    }
  }

  if (req.body.name && req.body.name.trim() !== store.name) {
    store.slug = await generateUniqueSlug(req.body.name, store._id);
  }

  await store.save();

  return res
    .status(200)
    .json(new ApiResponse(200, store, "Store updated successfully"));
});

/**
 * @desc Update the logged-in vendor's store logo
 * @route PATCH /api/v1/stores/me/logo
 * @access Private (vendor - store owner only)
 */
const updateStoreLogo = asyncHandler(async (req, res) => {
  const logoLocalPath = req.file?.path;

  if (!logoLocalPath) {
    throw new ApiError(400, "Logo image file is required");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const uploadedLogo = await uploadOnCloudinary(logoLocalPath);
  if (!uploadedLogo?.url) {
    throw new ApiError(500, "Failed to upload store logo");
  }

  const previousLogoUrl = store.logo;

  store.logo = uploadedLogo.url;
  await store.save();

  if (previousLogoUrl) {
    try {
      await deleteFromCloudinary(previousLogoUrl);
    } catch (error) {
      // Non-fatal: old logo cleanup failure should not break the request
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, store, "Store logo updated successfully"));
});

export {
  createStore,
  getStore,
  getStoreBySlug,
  updateStore,
  updateStoreLogo,
};
