import express from 'express';
import { createBooking, getBookingById, getUserBookings } from '../controllers/bookingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All booking routes require auth

router.route('/')
  .post(createBooking)
  .get(getUserBookings);

router.route('/:id')
  .get(getBookingById);

export default router;
