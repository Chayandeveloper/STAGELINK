import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { propose, getMeetups, confirm, generateQR, scanQR, confirmQR } from '../controllers/meetupController';

const router = express.Router();

router.use(protect);

router.post('/', propose);
router.get('/', getMeetups);
router.post('/:meetupId/confirm', confirm);

router.post('/:meetupId/qr/generate', generateQR);
router.post('/:meetupId/qr/scan', scanQR);
router.post('/:meetupId/qr/confirm', confirmQR);

export default router;
