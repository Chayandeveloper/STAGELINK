import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  saveFcmToken,
  removeFcmToken,
  testPushNotification,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/fcm-token', protect, saveFcmToken);
router.delete('/fcm-token', protect, removeFcmToken);
router.post('/test-push', protect, testPushNotification);

export default router;
