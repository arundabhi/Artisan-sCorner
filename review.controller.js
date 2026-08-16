import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  const { averageRating = 0, numReviews = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    rating: Number(averageRating.toFixed(2)),
    numReviews,
  });
};

/**
 * @desc Create a review for a purchased product
 * @route POST /api/v1/reviews
 * @access Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid product or order ID");
  }

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  const order = await Order.findOne({
    _id: orderId,
    buyer: req.user._id,
    orderStatus: "delivered",
    "items.product": productId,
  });

  if (!order) {
    throw new ApiError(
      403,
      "You can only review products you have purchased and received"
    );
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
    order: orderId,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product for this order");
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: orderId,
    rating: numericRating,
    comment,
    isVerifiedPurchase: true,
  });

  await recalculateProductRating(productId);

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully"));
});

/**
 * @desc Get all reviews for a product
 * @route GET /api/v1/reviews/product/:productId
 * @access Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate("user", "name avatar")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Product reviews fetched successfully"
    )
  );
});

/**
 * @desc Update the logged-in user's own review
 * @route PATCH /api/v1/reviews/:reviewId
 * @access Private (review owner only)
 */
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.isValidObjectId(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own review");
  }

  if (rating !== undefined) {
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new ApiError(400, "Rating must be an integer between 1 and 5");
    }
    review.rating = numericRating;
  }

  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();
  await recalculateProductRating(review.product);

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

/**
 * @desc Delete the logged-in user's own review
 * @route DELETE /api/v1/reviews/:reviewId
 * @access Private (review owner only)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.isValidObjectId(reviewId)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own review");
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export { createReview, getProductReviews, updateReview, deleteReview };
