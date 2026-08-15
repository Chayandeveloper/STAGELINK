import express from 'express';
import { 
  getConversations, 
  getMessages, 
  createDirectConversation, 
  markMessagesAsRead 
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All chat routes require auth

router.get('/conversations', getConversations);
router.post('/conversations', createDirectConversation); // Create direct conversation
router.get('/conversations/:id/messages', getMessages);
router.patch('/conversations/:id/read', markMessagesAsRead);

export default router;
