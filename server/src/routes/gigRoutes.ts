import express from 'express';
import { createGig, getGigs, getGigById } from '../controllers/gigController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createGig)
  .get(getGigs);

router.route('/:id')
  .get(getGigById);

export default router;
