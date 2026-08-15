import express from 'express';
import { getVenuesByCity, getPerformersByCity } from '../controllers/discoveryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/venues', protect, getVenuesByCity);
router.get('/performers', protect, getPerformersByCity);

export default router;
