import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCart)
  .post(syncCart)
  .delete(clearCart);

router.post('/items', addToCart);
router.route('/items/:productId')
  .patch(updateCartItem)
  .delete(removeCartItem);

export default router;
