import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatService } from '../services/chatService';
import { User } from '../models/User';
import { Connection } from '../models/Connection';

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const conversations = await ChatService.getUserConversations(req.user._id.toString());
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { id } = req.params; // conversationId
    const page = parseInt(req.query.page as string) || 1;
    
    const messages = await ChatService.getMessages(id as string, page);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};
export const createDirectConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: 'receiverId is required' });

    // Privacy Check: If both users are customers, they must have an accepted Connection
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(receiverId);

    if (sender?.role === 'customer' && receiver?.role === 'customer') {
      const isConnected = await Connection.findOne({
        users: { $all: [req.user._id, receiverId] }
      });
      if (!isConnected) {
        return res.status(403).json({ message: 'You must connect with this user first before messaging.' });
      }
    }

    const conversation = await ChatService.getOrCreateDirectConversation(req.user._id.toString(), receiverId);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { id } = req.params; // conversationId
    await ChatService.markAsRead(id as string, req.user._id.toString());
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
