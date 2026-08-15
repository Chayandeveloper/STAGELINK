import { Request, Response, NextFunction } from 'express';
import * as gigService from '../services/gigService';
import { AuthRequest } from '../middleware/authMiddleware';

export const createGig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'restaurant') {
      res.status(403);
      throw new Error('Only restaurants can post gigs');
    }
    
    const gig = await gigService.createGig(req.user?._id as unknown as string, req.body);
    res.status(201).json(gig);
  } catch (error) {
    next(error);
  }
};

export const getGigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query; // basic filter passing for MVP
    const gigs = await gigService.getGigs(filters);
    res.status(200).json(gigs);
  } catch (error) {
    next(error);
  }
};

export const getGigById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gig = await gigService.getGigById(req.params.id as string);
    if (!gig) {
      res.status(404);
      throw new Error('Gig not found');
    }
    res.status(200).json(gig);
  } catch (error) {
    next(error);
  }
};
