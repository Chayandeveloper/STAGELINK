import { Server, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ChatService } from '../services/chatService';

// In-memory Map to track connected users: userId -> socketId
const connectedUsers = new Map<string, string>();

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

let io: Server;

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Should be restricted in production
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string };
      const user = await User.findById(decoded.id).select('_id role');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = { id: user._id.toString(), role: user.role || 'customer' };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    if (!userId) return socket.disconnect();

    console.log(`User connected to socket: ${socket.id}, UserID: ${userId}`);

    // Update presence
    connectedUsers.set(userId, socket.id);
    
    // Broadcast user online to everyone (or restrict to contacts later)
    socket.broadcast.emit('user_online', userId);

    // Join conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation ${conversationId}`);
      
      // Mark messages as delivered when joining
      ChatService.markAsDelivered(conversationId, userId).catch(console.error);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(conversationId);
    });

    // Handle typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(conversationId).emit('display_typing', { conversationId, userId, isTyping: true });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(conversationId).emit('display_typing', { conversationId, userId, isTyping: false });
    });

    // Send messages
    socket.on('send_message', async (data: { conversationId: string, content: string, messageType?: any }) => {
      try {
        const message = await ChatService.saveMessage(
          data.conversationId, 
          userId, 
          data.content, 
          data.messageType || 'text'
        );
        
        // Emit the fully persisted message to everyone in the room (including sender to confirm)
        io.to(data.conversationId).emit('receive_message', message);
      } catch (err) {
        console.error('Error saving message via socket:', err);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Read receipts
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await ChatService.markAsRead(conversationId, userId);
        socket.to(conversationId).emit('messages_read', { conversationId, readBy: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // Join personal room for user-specific events
    socket.join(userId);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}, UserID: ${userId}`);
      connectedUsers.delete(userId);
      io.emit('user_offline', userId);
    });
  });

  return io;
};
