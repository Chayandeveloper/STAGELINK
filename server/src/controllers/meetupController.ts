import { Request, Response, NextFunction } from 'express';
import * as meetupService from '../services/meetupService';
import { AuthRequest } from '../middleware/authMiddleware';

export const propose = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { recipientId, venueId, dateTime, purpose } = req.body;
    const meetup = await meetupService.proposeMeetup(req.user._id.toString(), recipientId, venueId, new Date(dateTime), purpose);
    res.status(201).json(meetup);
  } catch (error) {
    next(error);
  }
};

export const confirm = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { meetupId } = req.params;
    const { didMeet } = req.body;
    const meetup = await meetupService.confirmMeetup(req.user._id.toString(), meetupId as string, didMeet);
    res.json(meetup);
  } catch (error) {
    next(error);
  }
};

export const getMeetups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const meetups = await meetupService.getUserMeetups(req.user._id.toString());
    res.json(meetups);
  } catch (error) {
    next(error);
  }
};

export const generateQR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const verification = await meetupService.generateVerificationToken(req.params.meetupId as string, req.user._id.toString());
    res.json(verification);
  } catch (error) {
    next(error);
  }
};

export const scanQR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { token } = req.body;
    const verification = await meetupService.scanVerificationToken(req.params.meetupId as string, req.user._id.toString(), token);
    res.json(verification);
  } catch (error) {
    next(error);
  }
};

export const confirmQR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const meetup = await meetupService.confirmVerification(req.params.meetupId as string, req.user._id.toString());
    res.json(meetup);
  } catch (error) {
    next(error);
  }
};
