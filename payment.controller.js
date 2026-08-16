import mongoose from "mongoose";
import Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  await order.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { clientSecret: paymentIntent.client_secret },
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
    event = stripe.webhooks.constructEvent(
      req.body, // raw body - route must use express.raw() for this endpoint
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    throw new ApiError(400, `Webhook signature verification failed: ${error.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId && mongoose.isValidObjectId(orderId)) {
        const order = await Order.findById(orderId);

        // Idempotency: only update if not already marked as paid
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.orderStatus =
            order.orderStatus === "pending" ? "processing" : order.orderStatus;
          order.stripePaymentIntentId = paymentIntent.id;
          await order.save();
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

export { createPaymentIntent, getPaymentStatus, stripeWebhook };
