import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

router.use(protect);

router.get('/vendor', authorize('VENDOR', 'ADMIN'), async (req, res, next) => {
  try {
    const range = req.query.range || '30';
    const days = parseInt(range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vendorId = req.user._id;

    // 1. Overview Statistics
    const overviewStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$items.subtotal' },
          totalEarnings: { $sum: '$items.vendorPayout' },
          platformCommission: { $sum: '$items.platformFee' },
          orderCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalEarnings: 1,
          platformCommission: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
    ]);

    const productCount = await Product.countDocuments({ vendor: vendorId });

    const overview = overviewStats[0] || {
      totalSales: 0,
      totalEarnings: 0,
      platformCommission: 0,
      orderCount: 0,
    };
    overview.productCount = productCount;

    // 2. Sales Over Time (Line Chart)
    const salesOverTime = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$items.subtotal' },
          earnings: { $sum: '$items.vendorPayout' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sales: 1,
          earnings: 1,
        },
      },
    ]);

    // 3. Top Products (Bar Chart)
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          sales: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1,
        },
      },
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        overview,
        salesOverTime,
        topProducts,
      }, "Vendor analytics fetched successfully")
    );
  } catch (error) {
    next(error);
  }
});

export default router;
