import express from 'express';
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getOrderById,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { Order } from '../models/order.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/vendor', authorize('VENDOR', 'ADMIN'), getVendorOrders);
router.get('/:orderId', authorize('VENDOR', 'ADMIN', 'BUYER'), getOrderById);

// Multi-vendor item status updates wrapper
router.patch('/:id/item-status', authorize('VENDOR', 'ADMIN'), async (req, res, next) => {
  try {
    const { itemId, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in order' });
    }

    // Verify ownership
    if (req.user.role !== 'ADMIN' && item.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
    }

    item.deliveryStatus = status;

    // Recalculate overall order status based on item statuses
    const statuses = order.items.map(i => i.deliveryStatus);
    if (statuses.every(s => s === 'DELIVERED')) {
      order.orderStatus = 'DELIVERED';
    } else if (statuses.some(s => s === 'SHIPPED' || s === 'DELIVERED')) {
      order.orderStatus = 'SHIPPED';
    } else if (statuses.every(s => s === 'CANCELLED')) {
      order.orderStatus = 'CANCELLED';
    } else {
      order.orderStatus = 'PROCESSING';
    }

    await order.save();
    return res.status(200).json(new ApiResponse(200, order, 'Item status updated successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;
