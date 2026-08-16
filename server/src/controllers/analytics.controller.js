import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../constants.js";

const RANGE_TO_DAYS = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

const resolveDateRange = (range) => {
  const days = RANGE_TO_DAYS[range] || RANGE_TO_DAYS["30d"];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return startDate;
};

/**
 * @desc Get a summary overview of the logged-in vendor's performance
 * @route GET /api/v1/analytics/vendor/overview
 * @access Private (vendor)
 */
const getVendorOverview = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);
  const vendorId = req.user._id;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$items" },
    { $match: { "items.vendor": vendorId } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$items.subtotal" },
        totalOrders: { $addToSet: "$_id" },
        totalEarnings: { $sum: "$items.subtotal" },
        platformCommission: { $sum: "$items.platformFee" },
        vendorPayout: { $sum: "$items.vendorPayout" },
        totalUnitsSold: { $sum: "$items.quantity" },
      },
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalOrders: { $size: "$totalOrders" },
        totalEarnings: 1,
        platformCommission: 1,
        vendorPayout: 1,
        totalUnitsSold: 1,
      },
    },
  ]);

  const overview = result[0] || {
    totalSales: 0,
    totalOrders: 0,
    totalEarnings: 0,
    platformCommission: 0,
    vendorPayout: 0,
    totalUnitsSold: 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, overview, "Vendor overview fetched successfully"));
});

/**
 * @desc Get the logged-in vendor's sales history over time
 * @route GET /api/v1/analytics/vendor/sales-history
 * @access Private (vendor)
 */
const getVendorSalesHistory = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);
  const vendorId = req.user._id;

  const salesHistory = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$items" },
    { $match: { "items.vendor": vendorId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sales: { $sum: "$items.subtotal" },
        orders: { $addToSet: "$_id" },
        vendorPayout: { $sum: "$items.vendorPayout" },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        sales: 1,
        orders: { $size: "$orders" },
        vendorPayout: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, salesHistory, "Vendor sales history fetched successfully")
    );
});

/**
 * @desc Get the logged-in vendor's top-selling products
 * @route GET /api/v1/analytics/vendor/top-products
 * @access Private (vendor)
 */
const getVendorTopProducts = asyncHandler(async (req, res) => {
  const { range = "30d", limit = 5 } = req.query;
  const startDate = resolveDateRange(range);
  const vendorId = req.user._id;

  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$items" },
    { $match: { "items.vendor": vendorId } },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: Number(limit) },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, topProducts, "Vendor top products fetched successfully")
    );
});

/**
 * @desc Get the logged-in vendor's revenue breakdown
 * @route GET /api/v1/analytics/vendor/revenue
 * @access Private (vendor)
 */
const getVendorRevenue = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);
  const vendorId = req.user._id;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, paymentStatus: "paid" } },
    { $unwind: "$items" },
    { $match: { "items.vendor": vendorId } },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: "$items.subtotal" },
        platformCommission: { $sum: "$items.platformFee" },
        netPayout: { $sum: "$items.vendorPayout" },
      },
    },
    { $project: { _id: 0, grossRevenue: 1, platformCommission: 1, netPayout: 1 } },
  ]);

  const revenue = result[0] || {
    grossRevenue: 0,
    platformCommission: 0,
    netPayout: 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, revenue, "Vendor revenue fetched successfully"));
});

/**
 * @desc Get marketplace-wide overview for admins
 * @route GET /api/v1/analytics/admin/overview
 * @access Private (admin only)
 */
const getAdminOverview = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);

  const [orderStats, userCount, vendorCount, productCount] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalPlatformFee: { $sum: "$platformFee" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    User.countDocuments({ role: ROLES.USER }),
    User.countDocuments({ role: ROLES.VENDOR }),
    Product.countDocuments({}),
  ]);

  const stats = orderStats[0] || {
    totalRevenue: 0,
    totalPlatformFee: 0,
    totalOrders: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...stats,
        totalUsers: userCount,
        totalVendors: vendorCount,
        totalProducts: productCount,
      },
      "Admin overview fetched successfully"
    )
  );
});

/**
 * @desc Get marketplace-wide revenue breakdown for admins
 * @route GET /api/v1/analytics/admin/revenue
 * @access Private (admin only)
 */
const getAdminRevenue = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);

  const revenueHistory = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, paymentStatus: "paid" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        platformFee: { $sum: "$platformFee" },
        vendorPayout: { $sum: "$vendorPayout" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: 1,
        platformFee: 1,
        vendorPayout: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, revenueHistory, "Admin revenue fetched successfully"));
});

/**
 * @desc Get marketplace-wide order statistics for admins
 * @route GET /api/v1/analytics/admin/orders
 * @access Private (admin only)
 */
const getAdminOrderStatistics = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);

  const statusBreakdown = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        statusBreakdown,
        "Admin order statistics fetched successfully"
      )
    );
});

/**
 * @desc Get marketplace-wide user statistics for admins
 * @route GET /api/v1/analytics/admin/users
 * @access Private (admin only)
 */
const getAdminUserStatistics = asyncHandler(async (req, res) => {
  const { range = "30d" } = req.query;
  const startDate = resolveDateRange(range);

  const [newUsers, roleBreakdown] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: startDate } }),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { _id: 0, role: "$_id", count: 1 } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { newUsers, roleBreakdown },
      "Admin user statistics fetched successfully"
    )
  );
});

export {
  getVendorOverview,
  getVendorSalesHistory,
  getVendorTopProducts,
  getVendorRevenue,
  getAdminOverview,
  getAdminRevenue,
  getAdminOrderStatistics,
  getAdminUserStatistics,
};
