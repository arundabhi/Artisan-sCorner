import express from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  getUserById,
  deactivateAccount,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/avatar', upload.single('avatar'), updateAvatar);
router.patch('/deactivate', deactivateAccount);
router.get('/:userId', getUserById);

export default router;
