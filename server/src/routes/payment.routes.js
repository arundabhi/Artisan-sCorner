import express from 'express';
import { stripeWebhook, getPaymentConfig, verifyStripePayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', protect, getPaymentConfig);
router.get('/verify', protect, verifyStripePayment);

// Public Stripe Webhook (No JSON middleware parsing is applied, raw parsing handled in app.js)
router.post('/webhook', stripeWebhook);

export default router;
