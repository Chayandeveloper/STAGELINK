import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Performer } from '../models/Performer';
import { AuthRequest } from '../middleware/authMiddleware';
import { Booking } from '../models/Booking';
import { Event } from '../models/Event';
export const selectRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    
    if (!['customer', 'restaurant', 'performer'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role selected');
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role && user.role !== role) {
      res.status(400);
      throw new Error('Role already assigned');
    }

    // Allow setting/confirming role if not yet set or same role

    user.role = role as any;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted
    });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.role) {
      res.status(400);
      throw new Error('Please select a role first');
    }

    if (user.profileCompleted) {
      // Already completed — just redirect, don't error out
      return res.status(200).json({ message: 'Profile already completed', role: user.role });
    }

    if (user.role === 'restaurant') {
      const { restaurantName, address, stageAvailable, cuisine } = req.body;
      await Restaurant.create({
        user: user._id,
        restaurantName,
        address,
        stageAvailable,
        cuisine
      });
    } else if (user.role === 'performer') {
      const { displayName, category, city, skills } = req.body;
      await Performer.create({
        user: user._id,
        displayName,
        category,
        city,
        skills
      });
    }

    // Customer might not need a separate profile document for Phase 1, or we can just mark completed
    
    if (req.body.city) {
      user.city = req.body.city;
    }
    user.profileCompleted = true;
    await user.save();

    res.status(201).json({
      message: 'Profile created successfully',
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findById(userId);
    const savedEventsCount = user?.savedEvents?.length || 0;

    // Fetch bookings with populated events to separate upcoming from attended
    const bookings = await Booking.find({ customer: userId, bookingStatus: 'confirmed' }).populate('event');
    
    const now = new Date();
    let upcomingReservations = 0;
    let eventsAttended = 0;

    bookings.forEach((booking: any) => {
      if (booking.event) {
        if (new Date(booking.event.date) >= now) {
          upcomingReservations++;
        } else {
          eventsAttended++;
        }
      }
    });

    const trendingEvents = await Event.find({ status: 'upcoming' })
      .sort({ interestedCount: -1, date: 1 })
      .limit(3)
      .populate('restaurant', 'restaurantName')
      .populate('performer', 'displayName');

    res.status(200).json({
      upcomingReservations,
      savedEvents: savedEventsCount,
      eventsAttended,
      trendingEvents
    });
  } catch (error) {
    next(error);
  }
};

export const updatePerformerPortfolio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const { profilePicture, bio, totalGigs, lastPerformed, ticketsSold, instagram, youtube } = req.body;

    const performer = await Performer.findOne({ user: userId });
    if (!performer) {
      res.status(404);
      throw new Error('Performer profile not found');
    }

    if (profilePicture !== undefined) performer.profilePicture = profilePicture;
    if (bio !== undefined) performer.bio = bio;
    if (totalGigs !== undefined) performer.totalGigs = totalGigs;
    if (lastPerformed !== undefined) performer.lastPerformed = lastPerformed;
    if (ticketsSold !== undefined) performer.ticketsSold = ticketsSold;
    
    if (instagram !== undefined || youtube !== undefined) {
      performer.socialLinks = {
        ...performer.socialLinks,
        instagram: instagram !== undefined ? instagram : performer.socialLinks?.instagram,
        youtube: youtube !== undefined ? youtube : performer.socialLinks?.youtube
      };
    }

    await performer.save();
    
    res.status(200).json({ message: 'Portfolio updated successfully', performer });
  } catch (error) {
    next(error);
  }
};

export const getPerformerPortfolio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const performer = await Performer.findOne({ user: userId });
    if (!performer) {
      res.status(404);
      throw new Error('Performer profile not found');
    }

    res.status(200).json({ performer });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ user: userId });
      res.status(200).json(restaurant);
    } else if (user.role === 'performer') {
      const performer = await Performer.findOne({ user: userId }).populate('user', 'phone email');
      if (!performer) { return res.status(200).json({}); }

      // Compute stats dynamically from the events collection
      const now = new Date();
      const pastEvents = await Event.find({
        performer: performer._id,
        $or: [{ date: { $lt: now } }, { status: 'completed' }]
      })
        .sort({ date: -1 })
        .populate('restaurant', 'restaurantName');

      const totalGigs = pastEvents.length;
      const lastEvent = pastEvents[0] as any;
      const lastPerformed = lastEvent?.restaurant?.restaurantName || null;

      res.status(200).json({
        ...performer.toObject(),
        totalGigs,
        lastPerformed
      });
    } else {
      res.status(200).json(user);
    }
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    console.log('updateMyProfile called, userId:', userId, 'body:', JSON.stringify(req.body));

    if (!userId) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    console.log('updateMyProfile user.role:', user.role);

    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ user: userId });
      if (restaurant) {
        Object.assign(restaurant, req.body);
        const updated = await restaurant.save();

        if (req.body.phone !== undefined) {
           user.phone = req.body.phone;
        }
        if (req.body.city !== undefined) {
           user.city = req.body.city;
        }
        await user.save();

        return res.status(200).json(updated);
      } else {
        const newRestaurant = await Restaurant.create({ 
          user: userId, 
          restaurantName: req.body.restaurantName || user.name || 'Unknown Restaurant',
          address: req.body.address || 'Not Specified',
          ...req.body 
        });

        if (req.body.phone !== undefined) {
           user.phone = req.body.phone;
        }
        if (req.body.city !== undefined) {
           user.city = req.body.city;
        }
        await user.save();
        return res.status(200).json(newRestaurant);
      }
    } else if (user.role === 'performer') {
      const performer = await Performer.findOne({ user: userId });
      if (performer) {
        if (req.body.socialLinks) {
          req.body.socialLinks = { ...performer.socialLinks, ...req.body.socialLinks };
        }
        Object.assign(performer, req.body);
        const updated = await performer.save();
        
        if (req.body.phone !== undefined) {
           user.phone = req.body.phone;
        }
        if (req.body.city !== undefined) {
           user.city = req.body.city;
        }
        await user.save();

        return res.status(200).json(updated);
      } else {
        const newPerformer = await Performer.create({ 
          user: userId,
          displayName: req.body.displayName || user.name || 'Unknown Performer',
          category: req.body.category || 'Other',
          city: req.body.city || 'Not Specified',
          ...req.body
        });
        if (req.body.phone !== undefined) {
           user.phone = req.body.phone;
        }
        if (req.body.city !== undefined) {
           user.city = req.body.city;
        }
        await user.save();

        return res.status(200).json(newPerformer);
      }
    } else if (user.role === 'customer' || !user.role) {
      console.log('Updating customer profile with:', req.body);
      const updateFields: any = {};
      if (req.body.interests !== undefined) updateFields.interests = req.body.interests;
      if (req.body.lookingFor !== undefined) updateFields.lookingFor = req.body.lookingFor;
      if (req.body.privacySettings !== undefined) updateFields.privacySettings = req.body.privacySettings;
      if (req.body.city !== undefined) updateFields.city = req.body.city;
      if (req.body.name !== undefined) updateFields.name = req.body.name;
      if (req.body.phone !== undefined) updateFields.phone = req.body.phone;
      if (req.body.gender !== undefined) updateFields.gender = req.body.gender;
      
      const updated = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: false }
      );
      console.log('Customer profile updated successfully');
      return res.status(200).json(updated);
    } else {
      console.log('Unknown role, returning 400. Role was:', user.role);
      res.status(400);
      throw new Error('Generic update only supported for restaurants, performers, and customers currently');
    }
  } catch (error) {
    console.error('updateMyProfile error:', error);
    next(error);
  }
};

