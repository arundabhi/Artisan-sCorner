import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getFeaturedProducts,
  searchProducts,
  getProductsByCategory,
  toggleProductStatus,
} from '../controllers/product.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:productId', getProductById);

// Protected routes
router.use(protect);

// Vendor routes
router.get('/vendor/me', getVendorProducts);
router.post('/', upload.array('images', 5), createProduct);
router.patch('/:productId', upload.array('images', 5), updateProduct);
router.patch('/:productId/toggle', toggleProductStatus);
router.delete('/:productId', deleteProduct);

export default router;
