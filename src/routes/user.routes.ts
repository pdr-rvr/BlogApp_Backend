import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/profile', authenticate, userController.getUserProfile);

router.put(
  '/profile',
  authenticate,
  userController.uploadProfileImage.single('profile_picture'),
  userController.updateProfile
);

export default router;