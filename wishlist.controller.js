import mongoose from "mongoose";
import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

/**
 * @desc Get the logged-in user's wishlist
 * @route GET /api/v1/wishlist
 * @access Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    select: "name images price stock isActive rating",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        wishlist || { user: req.user._id, products: [] },
        "Wishlist fetched successfully"
      )
    );
});

/**
 * @desc Add a product to the wishlist
 * @route POST /api/v1/wishlist/:productId
 * @access Private
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const wishlist = await getOrCreateWishlist(req.user._id);

  const alreadyExists = wishlist.products.some(
    (id) => id.toString() === productId
  );

  if (alreadyExists) {
    throw new ApiError(409, "Product is already in your wishlist");
  }

  wishlist.products.push(product._id);
  await wishlist.save();

  const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
    path: "products",
    select: "name images price stock isActive rating",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, populatedWishlist, "Product added to wishlist"));
});

/**
 * @desc Remove a product from the wishlist
 * @route DELETE /api/v1/wishlist/:productId
 * @access Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  const initialLength = wishlist.products.length;
  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId
  );

  if (wishlist.products.length === initialLength) {
    throw new ApiError(404, "Product not found in wishlist");
  }

  await wishlist.save();

  const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
    path: "products",
    select: "name images price stock isActive rating",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedWishlist, "Product removed from wishlist")
    );
});

/**
 * @desc Clear the entire wishlist
 * @route DELETE /api/v1/wishlist
 * @access Private
 */
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $set: { products: [] } },
    { new: true, upsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist cleared successfully"));
});

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
