import express from 'express';
import { 
  createReservation, 
  getReservationsByRestaurant, 
  getReservationsByCustomer, 
  updateReservationStatus, 
  updateReservationScreenshot,
  getAttendeesByEvent
} from '../controllers/reservationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createReservation);

router.route('/restaurant/:restaurantId')
  .get(protect, getReservationsByRestaurant);

router.route('/customer')
  .get(protect, getReservationsByCustomer);

router.route('/event/:eventId/attendees')
  .get(protect, getAttendeesByEvent);

router.route('/:id/status')
  .put(protect, updateReservationStatus);

router.route('/:id/screenshot')
  .put(protect, updateReservationScreenshot);

export default router;
