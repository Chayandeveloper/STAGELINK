import express from 'express';
import { 
  sendRequest, acceptRequest, rejectRequest, 
  getPending, getSent, getConnections, 
  getSwipeStats, swipeAccount,
  generateRestaurantLikeCode,
  getRestaurantLikeCodes,
  redeemCustomerLikeCode
} from '../controllers/connectionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/request', sendRequest);
router.post('/accept', acceptRequest);
router.post('/reject', rejectRequest);
router.get('/pending', getPending);
router.get('/sent', getSent);
router.get('/swipe-stats', getSwipeStats);
router.post('/swipe', swipeAccount);
router.post('/restaurant/generate-code', generateRestaurantLikeCode);
router.get('/restaurant/codes', getRestaurantLikeCodes);
router.post('/redeem-code', redeemCustomerLikeCode);
router.get('/', getConnections);

export default router;
