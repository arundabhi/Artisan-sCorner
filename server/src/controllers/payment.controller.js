import mongoose from "mongoose";
import Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_secret_key");

/**
 * @desc Create a Stripe PaymentIntent for an existing order
 * @route POST /api/v1/payments/create-intent
 * @access Private
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only pay for your own orders");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(409, "This order has already been paid");
  }

  // Amount is always derived from the order stored server-side, never from the client
  const amountInSmallestUnit = Math.round(order.totalAmount * 100);

  const isStripeConfigured = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
  let clientSecret;
  if (isStripeConfigured) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: process.env.STRIPE_CURRENCY || "usd",
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString(),
          orderNumber: order.orderNumber,
        },
        automatic_payment_methods: { enabled: true },
      });
      order.stripePaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    } catch (stripeErr) {
      if (process.env.NODE_ENV !== 'production') {
        order.stripePaymentIntentId = `mock_intent_${order._id}`;
        clientSecret = `mock_secret_for_order_${order._id}`;
      } else {
        throw stripeErr;
      }
    }
  } else {
    order.stripePaymentIntentId = `mock_intent_${order._id}`;
    clientSecret = `mock_secret_for_order_${order._id}`;
  }
  await order.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { clientSecret },
      "Payment intent created successfully"
    )
  );
});

/**
 * @desc Get the payment status of an order
 * @route GET /api/v1/payments/status/:orderId
 * @access Private
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId).select(
    "buyer paymentStatus stripePaymentIntentId totalAmount"
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own order's payment status");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
      },
      "Payment status fetched successfully"
    )
  );
});

/**
 * @desc Handle Stripe webhook events
 * @route POST /api/v1/payments/webhook
 * @access Public (Stripe signature verified)
 */
const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    if (process.env.NODE_ENV !== 'production' && (!signature || !process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET.includes('placeholder'))) {
      // In development/test mode without valid signature or webhook secret, fallback to direct JSON parsing for simulation
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(
        req.body, // raw body - route must use express.raw() for this endpoint
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        event = JSON.parse(req.body.toString());
      } catch (parseErr) {
        throw new ApiError(400, `Webhook signature verification failed: ${error.message}. Fallback parsing failed: ${parseErr.message}`);
      }
    } else {
      throw new ApiError(400, `Webhook signature verification failed: ${error.message}`);
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId && mongoose.isValidObjectId(orderId)) {
        const order = await Order.findById(orderId);

        // Idempotency: only update if not already marked as paid
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.orderStatus =
            order.orderStatus === "pending" ? "processing" : order.orderStatus;
          order.stripePaymentIntentId = session.id;
          await order.save();

          // Clear user's cart in database since payment succeeded
          await Cart.findOneAndUpdate(
            { user: order.buyer },
            { $set: { items: [] } }
          );
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId && mongoose.isValidObjectId(orderId)) {
        const order = await Order.findById(orderId);

        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "failed";
          await order.save();
        }
      }
      break;
    }

    default:
      // Unhandled event types are acknowledged but ignored
      break;
  }

  // Always acknowledge receipt so Stripe does not retry unnecessarily
  return res.status(200).json({ received: true });
});

/**
 * @desc Get Stripe public configurations (Publishable Key)
 * @route GET /api/v1/payments/config
 * @access Private
 */
const getPaymentConfig = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      },
      "Stripe config fetched successfully"
    )
  );
});

/**
 * @desc Verify Stripe Checkout Session payment status
 * @route GET /api/v1/payments/verify
 * @access Private
 */
const verifyStripePayment = asyncHandler(async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    throw new ApiError(400, "session_id is required");
  }

  // Handle local simulation verification
  if (session_id.startsWith('mock_session_')) {
    const orderId = session_id.replace('mock_session_', '');
    if (!mongoose.isValidObjectId(orderId)) {
      throw new ApiError(400, "Invalid mock session order ID");
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.orderStatus =
        order.orderStatus === "pending" ? "processing" : order.orderStatus;
      await order.save();

      // Clear user's cart in database since payment succeeded
      await Cart.findOneAndUpdate(
        { user: order.buyer },
        { $set: { items: [] } }
      );
    }

    return res.status(200).json(
      new ApiResponse(200, { order }, "Mock payment verified successfully")
    );
  }

  // Real Stripe session verification
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    throw new ApiError(400, "Payment not completed");
  }

  const orderId = session.metadata?.orderId;
  if (!orderId || !mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid orderId in session metadata");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.orderStatus =
      order.orderStatus === "pending" ? "processing" : order.orderStatus;
    order.stripePaymentIntentId = session.id;
    await order.save();

    // Clear user's cart in database since payment succeeded
    await Cart.findOneAndUpdate(
      { user: order.buyer },
      { $set: { items: [] } }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { order }, "Payment verified successfully")
  );
});

export { createPaymentIntent, getPaymentStatus, stripeWebhook, getPaymentConfig, verifyStripePayment };
