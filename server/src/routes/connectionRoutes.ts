import express from 'express';
import { sendRequest, acceptRequest, rejectRequest, getPending, getSent, getConnections } from '../controllers/connectionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/request', sendRequest);
router.post('/accept', acceptRequest);
router.post('/reject', rejectRequest);
router.get('/pending', getPending);
router.get('/sent', getSent);
router.get('/', getConnections);

export default router;
