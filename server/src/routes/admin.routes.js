import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  activateUser,
  deactivateUser,
  getVendors,
  approveVendor,
  rejectVendor,
  deleteProduct,
  getProducts,
  getOrders,
  updateCommission,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { VendorApplication } from '../models/vendorApplication.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

// Dashboards
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getDashboardStats); // Client calls /analytics

// Users Management
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:id/status', async (req, res, next) => {
  req.params.userId = req.params.id;
  if (req.body.isActive) {
    return activateUser(req, res, next);
  } else {
    return deactivateUser(req, res, next);
  }
});

// Products & Orders
router.get('/products', getProducts);
router.delete('/products/:productId', deleteProduct);
router.get('/orders', getOrders);

// Commission Rate
router.put('/settings', (req, res, next) => {
  req.body.commissionPercent = req.body.commissionPercent;
  return updateCommission(req, res, next);
});
router.get('/settings', async (req, res) => {
  // Read dynamic setting or default to 5
  const { PlatformSetting } = await import('../models/platformSetting.model.js');
  const setting = await PlatformSetting.findOne({ key: 'PLATFORM_COMMISSION_PERCENT' });
  const commissionPercent = setting ? Number(setting.value) : 5;
  
  return res.status(200).json(
    new ApiResponse(200, {
      commissionPercent,
      taxPercent: 0,
      shippingFee: 0,
    }, "Settings fetched successfully")
  );
});

// Vendor applications / Stores mapping
router.get('/stores', async (req, res, next) => {
  try {
    const apps = await VendorApplication.find({})
      .populate('user', 'name email')
      .sort('-createdAt')
      .lean();

    // Map to client layout schema
    const mappedStores = apps.map((app) => ({
      _id: app._id,
      name: app.storeName,
      logo: { url: 'https://res.cloudinary.com/demo/image/upload/v1502432214/store-placeholder.png' },
      phone: app.phone,
      owner: app.user ? { name: app.user.name, email: app.user.email } : null,
      description: app.businessDescription,
      isApproved: app.status === 'approved',
    }));

    return res.status(200).json(
      new ApiResponse(200, mappedStores, "Stores fetched successfully")
    );
  } catch (error) {
    next(error);
  }
});

router.patch('/stores/:id/approve', async (req, res, next) => {
  req.params.applicationId = req.params.id;
  if (req.body.isApproved) {
    return approveVendor(req, res, next);
  } else {
    return rejectVendor(req, res, next);
  }
});

export default router;
