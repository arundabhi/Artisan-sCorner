import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  toggleWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWishlist)
  .delete(clearWishlist);

router.route('/:productId')
  .post(toggleWishlist)
  .delete(removeFromWishlist);

export default router;
