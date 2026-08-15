import express, { Request, Response, NextFunction } from 'express';
import { selectRole, createProfile, getCustomerDashboard, updatePerformerPortfolio, getPerformerPortfolio, getMyProfile, updateMyProfile } from '../controllers/profileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// 🔍 Debug: log every request that hits the profile router
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[PROFILE ROUTER] ${req.method} ${req.path} | Auth: ${req.headers.authorization ? 'present' : 'MISSING'}`);
  next();
});

router.post('/role', protect, selectRole);
router.post('/create', protect, createProfile);
router.get('/customer/dashboard', protect, getCustomerDashboard);

// Performer Portfolio Routes
router.get('/performer/portfolio', protect, getPerformerPortfolio);
router.put('/performer/portfolio', protect, updatePerformerPortfolio);

// Generic Profile Routes
router.get('/me', protect, getMyProfile);
router.put('/update', protect, updateMyProfile);

export default router;
