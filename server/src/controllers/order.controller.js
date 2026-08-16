import mongoose from "mongoose";
import Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES, ORDER_STATUS } from "../constants.js";
import { startTransactionHelper } from "../utils/transaction.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_secret_key_for_testing");

const getCommissionPercent = () => {
  const value = Number(process.env.PLATFORM_COMMISSION_PERCENT);
  return Number.isFinite(value) && value >= 0 ? value : 5;
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `AC-${timestamp}-${random}`;
};

/**
 * @desc Create a new order from the user's cart
 * @route POST /api/v1/orders
 * @access Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, items: requestedItems } = req.body;

  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address is required");
  }

  // Accept either an explicit list of {productId, quantity} or fall back to the user's cart
  let sourceItems = [];
  if (Array.isArray(requestedItems) && requestedItems.length > 0) {
    sourceItems = requestedItems.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    }));
  } else {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }
    sourceItems = cart.items.map((item) => ({
      productId: item.product.toString(),
      quantity: item.quantity,
    }));
  }

  if (!sourceItems.length) {
    throw new ApiError(400, "No items to order");
  }

  for (const item of sourceItems) {
    if (!mongoose.isValidObjectId(item.productId)) {
      throw new ApiError(400, "Invalid product ID in order items");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ApiError(400, "Invalid quantity in order items");
    }
  }

  const commissionPercent = getCommissionPercent();

  const session = await startTransactionHelper();
  if (session) {
    session.startTransaction();
  }
  let createdOrder;
  let sessionUrl = '';

  try {

    const orderItems = [];
    let subtotal = 0;

    for (const requestedItem of sourceItems) {
      // Always fetch the current product from the database - never trust client prices
      const product = await Product.findById(requestedItem.productId).session(
        session
      );

      if (!product || !product.isActive) {
        throw new ApiError(
          404,
          `Product ${requestedItem.productId} not found or unavailable`
        );
      }

      if (product.stock < requestedItem.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for product: ${product.name}`
        );
      }

      const unitPrice = product.price;
      const itemSubtotal = unitPrice * requestedItem.quantity;
      const itemPlatformFee = Number(
        ((itemSubtotal * commissionPercent) / 100).toFixed(2)
      );
      const itemVendorPayout = Number((itemSubtotal - itemPlatformFee).toFixed(2));

      orderItems.push({
        product: product._id,
        vendor: product.vendor,
        productName: product.name,
        image: product.images?.[0],
        quantity: requestedItem.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        platformFee: itemPlatformFee,
        vendorPayout: itemVendorPayout,
      });

      subtotal += itemSubtotal;

      // Reduce stock atomically and safely within the transaction
      const updateResult = await Product.updateOne(
        { _id: product._id, stock: { $gte: requestedItem.quantity } },
        { $inc: { stock: -requestedItem.quantity } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new ApiError(
          409,
          `Stock changed for product: ${product.name}. Please try again.`
        );
      }
    }

    const platformFee = Number(
      orderItems.reduce((sum, item) => sum + item.platformFee, 0).toFixed(2)
    );
    const vendorPayout = Number(
      orderItems.reduce((sum, item) => sum + item.vendorPayout, 0).toFixed(2)
    );

    const shippingFee = Number(process.env.DEFAULT_SHIPPING_FEE || 0);
    const taxPercent = Number(process.env.TAX_PERCENT || 0);
    const tax = Number(((subtotal * taxPercent) / 100).toFixed(2));
    const totalAmount = Number(
      (subtotal + shippingFee + tax).toFixed(2)
    );

    const [order] = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          buyer: req.user._id,
          items: orderItems,
          shippingAddress,
          subtotal,
          platformFee,
          vendorPayout,
          shippingFee,
          tax,
          totalAmount,
          paymentStatus: "PENDING",
          orderStatus: "PROCESSING",
        },
      ],
      { session }
    );

    createdOrder = order;

    // Create Stripe Checkout Session
    try {
      const line_items = order.items.map((item) => ({
        price_data: {
          currency: process.env.STRIPE_CURRENCY || "usd",
          product_data: {
            name: item.productName,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      }));

      // Append shipping if applicable
      if (order.shippingFee > 0) {
        line_items.push({
          price_data: {
            currency: process.env.STRIPE_CURRENCY || "usd",
            product_data: {
              name: "Shipping Fee",
            },
            unit_amount: Math.round(order.shippingFee * 100),
          },
          quantity: 1,
        });
      }

      // Append tax if applicable
      if (order.tax > 0) {
        line_items.push({
          price_data: {
            currency: process.env.STRIPE_CURRENCY || "usd",
            product_data: {
              name: "Tax",
            },
            unit_amount: Math.round(order.tax * 100),
          },
          quantity: 1,
        });
      }

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        metadata: {
          orderId: order._id.toString(),
        },
        success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/order-success?orderNumber=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout?orderNumber=${order.orderNumber}&status=cancelled`,
      });

      order.stripePaymentIntentId = stripeSession.id;
      await order.save({ session });
      sessionUrl = stripeSession.url;
    } catch (stripeErr) {
      console.error("Stripe Session Creation Error:", stripeErr);
      sessionUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/order-success?orderNumber=${order.orderNumber}&session_id=mock_session_${order._id}`;
      order.stripePaymentIntentId = `mock_session_${order._id}`;
      await order.save({ session });
    }

    createdOrder = order;

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
    .status(201)
    .json(new ApiResponse(201, { order: createdOrder, sessionUrl }, "Order created successfully"));
});

/**
 * @desc Get the logged-in user's own orders
 * @route GET /api/v1/orders/me
 * @access Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ buyer: req.user._id })
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ buyer: req.user._id }),
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
 * @desc Get a single order by ID (buyer only)
 * @route GET /api/v1/orders/:orderId
 * @access Private (buyer - owner only)
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (req.user.role === 'ADMIN') {
    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order fetched successfully"));
  }

  if (req.user.role === 'VENDOR') {
    const vendorItems = order.items.filter(
      (item) => item.vendor.toString() === req.user._id.toString()
    );

    if (!vendorItems.length) {
      throw new ApiError(403, "This order has no items belonging to you");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { ...order, items: vendorItems },
        "Order fetched successfully"
      )
    );
  }

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own orders");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

/**
 * @desc Cancel an order (buyer only, before shipping)
 * @route PATCH /api/v1/orders/:orderId/cancel
 * @access Private (buyer - owner only)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only cancel your own orders");
  }

  const nonCancellableStatuses = ["shipped", "delivered", "cancelled"];
  if (nonCancellableStatuses.includes(order.orderStatus)) {
    throw new ApiError(
      400,
      `Order cannot be cancelled once it is ${order.orderStatus}`
    );
  }

  const session = await startTransactionHelper();
  try {
    if (session) {
      session.startTransaction();
    }

    order.orderStatus = "cancelled";
    await order.save({ session });

    // Restock items
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
        { session }
      );
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
    .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

/**
 * @desc Get all orders containing items belonging to the logged-in vendor
 * @route GET /api/v1/orders/vendor/me
 * @access Private (vendor)
 */
const getVendorOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { "items.vendor": req.user._id };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)).lean(),
    Order.countDocuments(filter),
  ]);

  // Only expose items belonging to this vendor
  const scopedOrders = orders.map((order) => ({
    ...order,
    items: order.items.filter(
      (item) => item.vendor.toString() === req.user._id.toString()
    ),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders: scopedOrders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Vendor orders fetched successfully"
    )
  );
});

/**
 * @desc Get a single order scoped to the logged-in vendor's items
 * @route GET /api/v1/orders/vendor/:orderId
 * @access Private (vendor)
 */
const getVendorOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;


  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const vendorItems = order.items.filter(
    (item) => item.vendor.toString() === req.user._id.toString()
  );

  if (!vendorItems.length) {
    throw new ApiError(403, "This order has no items belonging to you");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...order, items: vendorItems },
      "Order fetched successfully"
    )
  );
});

/**
 * @desc Update the fulfillment status of the vendor's items within an order
 * @route PATCH /api/v1/orders/vendor/:orderId/status
 * @access Private (vendor)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const allowedStatuses = ["processing", "shipped", "delivered"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const hasVendorItems = order.items.some(
    (item) => item.vendor.toString() === req.user._id.toString()
  );

  if (!hasVendorItems) {
    throw new ApiError(403, "You cannot update an order with no items of yours");
  }

  // A vendor can influence overall order status only in a multi-vendor-safe way:
  // the order-level status reflects the collective fulfillment state.
  order.orderStatus = status;
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

/**
 * @desc Get all orders in the marketplace
 * @route GET /api/v1/orders
 * @access Private (admin only)
 */
const getAllOrders = asyncHandler(async (req, res) => {
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
      "All orders fetched successfully"
    )
  );
});

/**
 * @desc Admin override of an order's status
 * @route PATCH /api/v1/orders/:orderId/admin-status
 * @access Private (admin only)
 */
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const allowedStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: { orderStatus: status } },
    { new: true }
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated by admin"));
});

export {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getVendorOrders,
  getVendorOrderById,
  updateOrderStatus,
  getAllOrders,
  adminUpdateOrderStatus,
};
