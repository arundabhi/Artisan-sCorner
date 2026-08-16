import express from 'express';
import {
  createStore,
  getStore,
  getStoreBySlug,
  updateStore,
  updateStoreLogo,
} from '../controllers/store.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/slug/:slug', getStoreBySlug);

// Protected routes
router.use(protect);

router.post('/', upload.single('logo'), createStore);
router.get('/me', getStore);
router.patch('/me', updateStore);
router.patch('/me/logo', upload.single('logo'), updateStoreLogo);

export default router;
