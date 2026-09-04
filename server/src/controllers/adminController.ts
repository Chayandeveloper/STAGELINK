import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Performer } from '../models/Performer';
import { Event } from '../models/Event';
import bcrypt from 'bcrypt';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleFilter = req.query.role as string;
    const query: any = roleFilter ? { role: roleFilter } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.phone = req.body.phone || user.phone;
      user.city = req.body.city || user.city;

      // Reset password if provided
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        city: updatedUser.city,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Cascade delete profiles based on role
      if (user.role === 'restaurant') {
        await Restaurant.findOneAndDelete({ user: user._id });
        // Optionally delete events created by this restaurant
        await Event.deleteMany({ restaurant: user._id });
      } else if (user.role === 'performer') {
        await Performer.findOneAndDelete({ user: user._id });
        // Optionally handle gigs booked by this performer?
      }

      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User removed' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

import { getSystemSettings, updateSystemSettings } from '../services/connectionService';

// @desc    Get global stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await User.countDocuments({ role: 'restaurant' });
    const totalPerformers = await User.countDocuments({ role: 'performer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    res.json({
      totalUsers,
      totalRestaurants,
      totalPerformers,
      totalCustomers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getAdminSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSystemSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateAdminSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxDailyLikes, maxDailySwipes, likeRewardTiers } = req.body;
    const likesNum = parseInt(maxDailyLikes);
    const swipesNum = parseInt(maxDailySwipes);

    if (isNaN(likesNum) || likesNum < 1 || isNaN(swipesNum) || swipesNum < 1) {
      return res.status(400).json({ message: 'Max daily likes and swipes must be positive numbers' });
    }

    if (likesNum > swipesNum) {
      return res.status(400).json({ message: 'Max daily likes cannot exceed max daily swipes' });
    }

    let validatedTiers = undefined;
    if (Array.isArray(likeRewardTiers)) {
      validatedTiers = likeRewardTiers.map((tier: any) => ({
        minBill: Math.max(0, Number(tier.minBill) || 0),
        maxBill: Math.max(1, Number(tier.maxBill) || 1),
        extraLikes: Math.max(1, Number(tier.extraLikes) || 1),
        durationDays: Math.max(1, Number(tier.durationDays) || 7)
      }));
    }

    const settings = await updateSystemSettings(likesNum, swipesNum, validatedTiers);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};
