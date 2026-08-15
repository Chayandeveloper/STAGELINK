import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/reviewService';
import { AuthRequest } from '../middleware/authMiddleware';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.createReview(req.user?._id as unknown as string, req.body);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { revieweeId } = req.params;
    const reviews = await reviewService.getReviewsForReviewee(revieweeId as string);
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};
