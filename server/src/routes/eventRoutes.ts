import express from 'express';
import { createEvent, getEvents, getEventById, updateEvent, saveEvent, unsaveEvent, getSavedEvents } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEventById)
  .put(protect, updateEvent);

router.get('/saved/me', protect, getSavedEvents);
router.post('/:id/save', protect, saveEvent);
router.delete('/:id/save', protect, unsaveEvent);

export default router;
