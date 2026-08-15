import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/bookingService';
import { AuthRequest } from '../middleware/authMiddleware';

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId, seats } = req.body;
    const booking = await bookingService.createBooking(req.user?._id as unknown as string, eventId, seats);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id as string, req.user?._id as unknown as string);
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user?._id as unknown as string);
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};
