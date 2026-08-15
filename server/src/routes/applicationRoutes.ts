import express from 'express';
import { applyForGig, getGigApplications, updateApplicationStatus, createDirectRequest, getPerformerApplications, getVenueApplications } from '../controllers/applicationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/gig/:gigId', protect, applyForGig);
router.post('/direct', protect, createDirectRequest);
router.get('/gig/:gigId', protect, getGigApplications);
router.get('/performer', protect, getPerformerApplications);
router.get('/venue', protect, getVenueApplications);
router.put('/:applicationId/status', protect, updateApplicationStatus);

export default router;
