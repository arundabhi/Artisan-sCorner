import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";

/**
 * @desc Get the logged-in user's own profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpiry"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Profile fetched successfully"));
});

/**
 * @desc Update the logged-in user's own profile
 * @route PATCH /api/v1/users/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "address"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.body.email || req.body.role || req.body.password) {
    throw new ApiError(
      400,
      "Email, role and password cannot be updated through this endpoint"
    );
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided to update");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpiry");

  return res
    .status(200)
    .json(new ApiResponse(200, { user: updatedUser }, "Profile updated successfully"));
});

/**
 * @desc Update the logged-in user's avatar
 * @route PATCH /api/v1/users/avatar
 * @access Private
 */
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image file is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadedAvatar?.url) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  const previousAvatarUrl = user.avatar;

  user.avatar = uploadedAvatar.url;
  await user.save({ validateBeforeSave: false });

  if (previousAvatarUrl) {
    try {
      await deleteFromCloudinary(previousAvatarUrl);
    } catch (error) {
      // Non-fatal: old image cleanup failure should not break the request
    }
  }

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpiry"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

/**
 * @desc Get a user's public profile by ID
 * @route GET /api/v1/users/:userId
 * @access Private
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId).select(
    "name avatar role createdAt"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * @desc Deactivate the logged-in user's own account
 * @route PATCH /api/v1/users/deactivate
 * @access Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { isActive: false }, $unset: { refreshToken: 1 } },
    { new: true }
  ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpiry");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, user, "Account deactivated successfully"));
});

export {
  getProfile,
  updateProfile,
  updateAvatar,
  getUserById,
  deactivateAccount,
};
