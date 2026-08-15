import express from 'express';
import { getDashboard, completeMission, getNearbyPeople } from '../controllers/engagementController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.post('/missions/:missionId/complete', completeMission);
router.get('/nearby', getNearbyPeople);

export default router;
