import express from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { createReviewSchema } from '../validators/review.validator.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, validate(createReviewSchema), createReview);

export default router;
