import { Request, Response, NextFunction } from 'express';
import * as engagementService from '../services/engagementService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const dashboard = await engagementService.getDashboardInfo(req.user._id.toString());
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};

export const completeMission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { missionId } = req.params;
    const engagement = await engagementService.completeMission(req.user._id.toString(), missionId as string);
    res.json(engagement);
  } catch (error) {
    next(error);
  }
};

export const getNearbyPeople = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const city = req.query.city as string || req.user.city;
    const people = await engagementService.getNearbyPeople(req.user._id.toString(), city);
    res.json({ people });
  } catch (error) {
    next(error);
  }
};
