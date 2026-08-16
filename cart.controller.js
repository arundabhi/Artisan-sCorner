import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const computeSubtotal = (cart) =>
  cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name images price stock isActive vendor",
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

/**
 * @desc Get the logged-in user's cart
 * @route GET /api/v1/cart
 * @access Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  const subtotal = computeSubtotal(cart);

  return res
    .status(200)
    .json(new ApiResponse(200, { cart, subtotal }, "Cart fetched successfully"));
});

/**
 * @desc Add a product to the cart
 * @route POST /api/v1/cart/items
 * @access Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const numericQuantity = Number(quantity);
  if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or unavailable");
  }

  if (numericQuantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + numericQuantity;
    if (newQuantity > product.stock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }
    existingItem.quantity = newQuantity;
    existingItem.price = product.price;
  } else {
    cart.items.push({
      product: product._id,
      vendor: product.vendor,
      quantity: numericQuantity,
      price: product.price,
    });
  }

  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);
  const subtotal = computeSubtotal(populatedCart);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cart: populatedCart, subtotal },
        "Item added to cart"
      )
    );
});

/**
 * @desc Update the quantity of a cart item
 * @route PATCH /api/v1/cart/items/:productId
 * @access Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const numericQuantity = Number(quantity);
  if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or unavailable");
  }

  if (numericQuantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    throw new ApiError(404, "Item not found in cart");
  }

  item.quantity = numericQuantity;
  item.price = product.price;
  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);
  const subtotal = computeSubtotal(populatedCart);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { cart: populatedCart, subtotal }, "Cart item updated")
    );
});

/**
 * @desc Remove an item from the cart
 * @route DELETE /api/v1/cart/items/:productId
 * @access Private
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);

  if (cart.items.length === initialLength) {
    throw new ApiError(404, "Item not found in cart");
  }

  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);
  const subtotal = computeSubtotal(populatedCart);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cart: populatedCart, subtotal },
        "Item removed from cart"
      )
    );
});

/**
 * @desc Clear all items from the cart
 * @route DELETE /api/v1/cart
 * @access Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { new: true, upsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { cart, subtotal: 0 }, "Cart cleared successfully"));
});

export { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
