import express from 'express';
import { createReview, getReviews } from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/:revieweeId', getReviews);

export default router;
