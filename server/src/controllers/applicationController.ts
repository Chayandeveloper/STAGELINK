import { Request, Response, NextFunction } from 'express';
import * as applicationService from '../services/applicationService';
import { AuthRequest } from '../middleware/authMiddleware';

export const applyForGig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'performer') {
      res.status(403);
      throw new Error('Only performers can apply for gigs');
    }
    
    const { gigId } = req.params;
    const application = await applicationService.applyForGig(req.user?._id as unknown as string, gigId as string, req.body);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const createDirectRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { targetId, initiatorRole } = req.body;
    const application = await applicationService.createDirectRequest(
      req.user?._id as unknown as string,
      targetId,
      initiatorRole,
      req.body
    );
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const getPerformerApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await applicationService.getApplicationsForPerformer(req.user?._id as unknown as string);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

export const getVenueApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await applicationService.getApplicationsForVenue(req.user?._id as unknown as string);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

export const getGigApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { gigId } = req.params;
    const applications = await applicationService.getApplicationsForGig(gigId as string, req.user?._id as unknown as string);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const application = await applicationService.updateApplicationStatus(applicationId as string, status, req.user?._id as unknown as string);
    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};
