import express from 'express';
import { 
  getActiveAd, 
  getAds, 
  createAd, 
  updateAd, 
  deleteAd 
} from '../controllers/adController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Public route for the frontend component to fetch the ad
router.get('/active', getActiveAd);

// Admin only routes
router.use(protect, admin);

router.route('/')
  .get(getAds)
  .post(createAd);

router.route('/:id')
  .put(updateAd)
  .delete(deleteAd);

export default router;
