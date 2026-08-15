import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Performer } from '../models/Performer';
import { Event } from '../models/Event';
import { AuthRequest } from '../middleware/authMiddleware';

export const getVenuesByCity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userCity = req.query.city as string;
    
    // Find all users who are restaurants, optionally filter by city
    let query: any = { role: 'restaurant' };
    if (userCity) {
      query.city = new RegExp(userCity, 'i');
    }

    const restaurantUsers = await User.find(query).select('-password');
    const userIds = restaurantUsers.map(u => u._id);

    // Get their restaurant profiles
    const venues = await Restaurant.find({ user: { $in: userIds } }).populate('user', 'name email city');

    res.status(200).json({ venues });
  } catch (error) {
    next(error);
  }
};

export const getPerformersByCity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userCity = req.query.city as string;
    
    // Find all users who are performers, optionally filter by city
    let query: any = { role: 'performer' };
    if (userCity) {
      query.city = new RegExp(userCity, 'i');
    }

    const performerUsers = await User.find(query).select('-password');
    const userIds = performerUsers.map(u => u._id);

    // Get their performer profiles
    const performers = await Performer.find({ user: { $in: userIds } }).populate('user', 'name email city phone');

    // Dynamically compute totalGigs and lastPerformed for each performer
    const now = new Date();
    const performerIds = performers.map(p => p._id);
    const statsMap: Record<string, { totalGigs: number; lastPerformed: string | null }> = {};

    await Promise.all(performerIds.map(async (performerId) => {
      const pastGigs = await Event.find({
        performer: performerId,
        $or: [{ date: { $lt: now } }, { status: 'completed' }]
      })
        .sort({ date: -1 })
        .populate('restaurant', 'restaurantName');

      const lastEvent = pastGigs[0] as any;
      statsMap[performerId.toString()] = {
        totalGigs: pastGigs.length,
        lastPerformed: lastEvent?.restaurant?.restaurantName || null
      };
    }));

    const enrichedPerformers = performers.map(performer => {
      const performerObj = performer.toObject();
      const stats = statsMap[performerObj._id.toString()];
      if (stats) {
        performerObj.totalGigs = stats.totalGigs;
        performerObj.lastPerformed = stats.lastPerformed || undefined;
      }
      return performerObj;
    });

    res.status(200).json({ performers: enrichedPerformers });
  } catch (error) {
    next(error);
  }
};
