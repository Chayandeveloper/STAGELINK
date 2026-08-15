import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'restaurant') {
      res.status(403);
      throw new Error('Only restaurants can create events');
    }
    
    const event = await eventService.createEvent(req.user?._id as unknown as string, req.body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query; // basic filter passing for MVP
    const events = await eventService.getEvents(filters);
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getEventById(req.params.id as string);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'restaurant') {
      res.status(403);
      throw new Error('Only restaurants can update events');
    }
    
    const event = await eventService.updateEvent(req.params.id as string, req.body);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

export const saveEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const eventId = req.params.id;
    if (!userId) { res.status(401); throw new Error('Not authorized'); }
    const user = await User.findById(userId);
    if (!user) { res.status(404); throw new Error('User not found'); }
    const alreadySaved = user.savedEvents?.some((id) => id.toString() === eventId);
    if (!alreadySaved) {
      user.savedEvents = [...(user.savedEvents || []), eventId as any];
      await user.save();
    }
    res.status(200).json({ message: 'Event saved', savedEvents: user.savedEvents });
  } catch (error) {
    next(error);
  }
};

export const unsaveEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const eventId = req.params.id;
    if (!userId) { res.status(401); throw new Error('Not authorized'); }
    const user = await User.findById(userId);
    if (!user) { res.status(404); throw new Error('User not found'); }
    user.savedEvents = (user.savedEvents || []).filter((id) => id.toString() !== eventId);
    await user.save();
    res.status(200).json({ message: 'Event unsaved', savedEvents: user.savedEvents });
  } catch (error) {
    next(error);
  }
};

export const getSavedEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) { res.status(401); throw new Error('Not authorized'); }
    const user = await User.findById(userId).populate({
      path: 'savedEvents',
      populate: [
        { path: 'restaurant', select: 'restaurantName location' },
        { path: 'performer', select: 'displayName category' }
      ]
    });
    res.status(200).json(user?.savedEvents || []);
  } catch (error) {
    next(error);
  }
};
