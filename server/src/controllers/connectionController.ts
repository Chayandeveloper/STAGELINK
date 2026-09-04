import { Request, Response, NextFunction } from 'express';
import * as connectionService from '../services/connectionService';
import { AuthRequest } from '../middleware/authMiddleware';

export const sendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { recipientId, message } = req.body;
    const request = await connectionService.sendConnectionRequest(req.user._id.toString(), recipientId, message);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { requesterId } = req.body;
    const connection = await connectionService.acceptConnectionRequest(requesterId, req.user._id.toString());
    res.json(connection);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { requesterId } = req.body;
    const request = await connectionService.rejectConnectionRequest(requesterId, req.user._id.toString());
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const getPending = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const requests = await connectionService.getPendingRequests(req.user._id.toString());
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getSent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const requests = await connectionService.getSentRequests(req.user._id.toString());
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getConnections = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const connections = await connectionService.getUserConnections(req.user._id.toString());
    res.json(connections);
  } catch (error) {
    next(error);
  }
};

export const getSwipeStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const stats = await connectionService.getUserSwipeStats(req.user._id.toString());
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const swipeAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { targetId, action } = req.body;
    if (!targetId || !['like', 'dislike'].includes(action)) {
      return res.status(400).json({ message: 'Target ID and valid action (like or dislike) required' });
    }
    const result = await connectionService.recordSwipe(req.user._id.toString(), targetId, action);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

import { Restaurant } from '../models/Restaurant';
import { User } from '../models/User';
import { RestaurantLikeCode } from '../models/RestaurantLikeCode';

// @desc    Generate customer like code by restaurant
// @route   POST /api/connections/restaurant/generate-code
// @access  Private (Restaurant only)
export const generateRestaurantLikeCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Only restaurant accounts can generate customer like codes' });
    }

    const { phone, billAmount } = req.body;

    if (!phone || !billAmount) {
      return res.status(400).json({ message: 'Customer phone number and bill amount are required' });
    }

    const numBill = Number(billAmount);
    if (isNaN(numBill) || numBill <= 0) {
      return res.status(400).json({ message: 'Valid positive bill amount is required' });
    }

    const restaurant = await Restaurant.findOne({ user: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant profile not found for this account' });
    }

    const rawPhone = String(phone).trim();
    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);

    // Look up registered customer in StageLink
    const customer = await User.findOne({
      $or: [
        { phone: rawPhone },
        { phone: cleanDigits },
        ...(last10 ? [{ phone: { $regex: new RegExp(`${last10}$`) } }] : [])
      ]
    });

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found. The entered phone number is not registered in StageLink.'
      });
    }

    const settings = await connectionService.getSystemSettings();
    const tierResult = connectionService.calculateLikesForBill(numBill, settings.likeRewardTiers || []);
    const likesAwarded = tierResult.extraLikes;
    const durationDays = tierResult.durationDays || 7;

    if (likesAwarded <= 0) {
      return res.status(400).json({
        message: 'Bill amount does not qualify for extra likes under the current reward tiers.'
      });
    }

    // Format code: STG-{phoneLast4}-{MMDD}-{billAmount}-{salt}
    const todayStr = new Date().toISOString().split('T')[0];
    const mmdd = todayStr.replace(/-/g, '').slice(4);
    const phoneSuffix = (customer.phone || cleanDigits).replace(/[^0-9]/g, '').slice(-4) || '7777';
    const salt = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `STG-${phoneSuffix}-${mmdd}-${Math.round(numBill)}-${salt}`;

    const newCode = await RestaurantLikeCode.create({
      code,
      restaurant: restaurant._id,
      restaurantUser: req.user._id,
      customer: customer._id,
      customerPhone: customer.phone || rawPhone,
      customerName: customer.name,
      billAmount: numBill,
      likesAwarded,
      durationDays,
      dateStr: todayStr,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      code: newCode.code,
      customerName: customer.name,
      customerPhone: newCode.customerPhone,
      billAmount: newCode.billAmount,
      likesAwarded: newCode.likesAwarded,
      durationDays: newCode.durationDays,
      dateStr: newCode.dateStr
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get issued codes for restaurant
// @route   GET /api/connections/restaurant/codes
// @access  Private (Restaurant only)
export const getRestaurantLikeCodes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const codes = await RestaurantLikeCode.find({ restaurantUser: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(codes);
  } catch (error) {
    next(error);
  }
};

// @desc    Customer redeem like code
// @route   POST /api/connections/redeem-code
// @access  Private (Customer)
export const redeemCustomerLikeCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Please enter the code to redeem' });
    }

    const formattedCode = String(code).trim().toUpperCase();
    const voucher = await RestaurantLikeCode.findOne({ code: formattedCode }).populate('restaurant', 'restaurantName address');

    if (!voucher) {
      return res.status(404).json({ message: 'Invalid like code. Please check the code and try again.' });
    }

    if (voucher.status === 'redeemed') {
      return res.status(400).json({ message: 'This code has already been redeemed.' });
    }

    if (voucher.status !== 'active') {
      return res.status(400).json({ message: `This code is ${voucher.status} and cannot be redeemed.` });
    }

    // Verify customer ownership
    const isCustomerMatch = voucher.customer.toString() === req.user._id.toString();
    const userPhoneClean = (req.user.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const voucherPhoneClean = voucher.customerPhone.replace(/[^0-9]/g, '').slice(-10);
    const isPhoneMatch = userPhoneClean && voucherPhoneClean && userPhoneClean === voucherPhoneClean;

    if (!isCustomerMatch && !isPhoneMatch) {
      return res.status(403).json({
        message: 'This code was generated specifically for another customer phone number and cannot be redeemed on this account.'
      });
    }

    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();
    // Expiry date: durationDays from now at 23:59:59
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (voucher.durationDays || 7));
    expiry.setHours(23, 59, 59, 999);
    voucher.expiresAt = expiry;
    await voucher.save();

    const updatedStats = await connectionService.getUserSwipeStats(req.user._id.toString());

    res.json({
      success: true,
      likesAwarded: voucher.likesAwarded,
      durationDays: voucher.durationDays || 7,
      expiresAt: voucher.expiresAt,
      stats: updatedStats,
      restaurantName: (voucher.restaurant as any)?.restaurantName || 'Restaurant',
      message: `Successfully redeemed! You've received +${voucher.likesAwarded} extra likes every day for ${voucher.durationDays || 7} days!`
    });
  } catch (error) {
    next(error);
  }
};
