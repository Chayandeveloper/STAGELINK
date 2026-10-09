import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, googleId, role, gender } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const result = await authService.registerUser(name, email, password, phone, googleId, role, gender);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    const result = await authService.verifyEmailOtp(email, otp);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Verification failed' });
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const result = await authService.resendVerificationOtp(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to resend code' });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, googleId } = req.body;
    const userData = await authService.loginUser(email, password, googleId);
    res.status(200).json(userData);
  } catch (error: any) {
    if (error.requiresVerification) {
      return res.status(403).json({
        requiresVerification: true,
        email: error.email,
        message: error.message,
      });
    }
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to process forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }
    const result = await authService.resetPasswordWithOtp(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to reset password' });
  }
};

export const saveFcmToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { User } = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token },
    });

    res.status(200).json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const removeFcmToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { User } = require('../models/User');
    if (token) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: token },
      });
    }

    res.status(200).json({ success: true, message: 'FCM token removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const testPushNotification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { User } = require('../models/User');
    const { getFirebaseApp } = require('../config/firebase');
    const { getMessaging } = require('firebase-admin/messaging');

    const user = await User.findById(userId).select('fcmTokens name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No registered device tokens found for your account. Please click "Enable Notifications" first.',
      });
    }

    const app = getFirebaseApp();
    if (!app) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin is not configured on the server.',
      });
    }

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast({
      tokens: user.fcmTokens,
      notification: {
        title: 'StageLink Push Notification 🎉',
        body: 'Push notifications are working perfectly on this device!',
      },
      data: {
        type: 'test_notification',
        click_action: '/dashboard/messages',
      },
      webpush: {
        notification: {
          title: 'StageLink Push Notification 🎉',
          body: 'Push notifications are working perfectly on this device!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: 'stagelink_test_push',
        },
        fcmOptions: {
          link: '/dashboard/messages',
        },
      },
    });

    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      tokensCount: user.fcmTokens.length,
      message: `Successfully sent test notification to ${response.successCount} of ${user.fcmTokens.length} device(s)!`,
    });
  } catch (error: any) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send test push' });
  }
};

