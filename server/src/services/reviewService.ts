import { Review } from '../models/Review';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Performer } from '../models/Performer';

export const createReview = async (userId: string, data: any) => {
  const { reviewerModel, reviewee, revieweeModel, event, rating, comment } = data;

  // Determine actual reviewer ObjectId if they are a Restaurant/Performer
  let reviewerId = userId;
  if (reviewerModel === 'Restaurant') {
    const r = await Restaurant.findOne({ user: userId });
    if (!r) throw new Error('Restaurant not found');
    reviewerId = r._id as unknown as string;
  } else if (reviewerModel === 'Performer') {
    const p = await Performer.findOne({ user: userId });
    if (!p) throw new Error('Performer not found');
    reviewerId = p._id as unknown as string;
  }

  const review = await Review.create({
    reviewer: reviewerId,
    reviewerModel,
    reviewee,
    revieweeModel,
    event,
    rating,
    comment
  });

  return review;
};

export const getReviewsForReviewee = async (revieweeId: string) => {
  return await Review.find({ reviewee: revieweeId }).populate('reviewer');
};
