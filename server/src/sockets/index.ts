import { Server, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Conversation } from '../models/Conversation';
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

export const isUserActiveInConversation = (userId: string, conversationId: string): boolean => {
  if (!io) return false;
  const socketId = connectedUsers.get(userId);
  if (!socketId) return false;
  const room = io.sockets.adapter.rooms.get(conversationId);
  return room ? room.has(socketId) : false;
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

    // Join personal room for user-specific events
    socket.join(userId);

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
    socket.on('typing_start', async ({ conversationId }: { conversationId: string }) => {
      try {
        const conv = await Conversation.findById(conversationId).select('participants').lean();
        const targetRooms = new Set<string>();
        targetRooms.add(conversationId);
        if (conv?.participants) {
          conv.participants.forEach((p: any) => {
            const pStr = p.toString();
            if (pStr !== userId) targetRooms.add(pStr);
          });
        }
        socket.to(Array.from(targetRooms)).emit('display_typing', { conversationId, userId, isTyping: true });
      } catch (err) {
        socket.to(conversationId).emit('display_typing', { conversationId, userId, isTyping: true });
      }
    });

    socket.on('typing_stop', async ({ conversationId }: { conversationId: string }) => {
      try {
        const conv = await Conversation.findById(conversationId).select('participants').lean();
        const targetRooms = new Set<string>();
        targetRooms.add(conversationId);
        if (conv?.participants) {
          conv.participants.forEach((p: any) => {
            const pStr = p.toString();
            if (pStr !== userId) targetRooms.add(pStr);
          });
        }
        socket.to(Array.from(targetRooms)).emit('display_typing', { conversationId, userId, isTyping: false });
      } catch (err) {
        socket.to(conversationId).emit('display_typing', { conversationId, userId, isTyping: false });
      }
    });

    // Send messages
    socket.on('send_message', async (data: { conversationId: string, content: string, messageType?: any, tempId?: string }) => {
      try {
        const message = await ChatService.saveMessage(
          data.conversationId, 
          userId, 
          data.content, 
          data.messageType || 'text'
        );

        const conv = await Conversation.findById(data.conversationId).select('participants').lean();
        const messageObj: any = (message as any).toObject ? (message as any).toObject() : { ...message };
        if (data.tempId) {
          messageObj.tempId = data.tempId;
        }

        const targetRooms = new Set<string>();
        targetRooms.add(data.conversationId);
        if (conv?.participants) {
          conv.participants.forEach((p: any) => targetRooms.add(p.toString()));
        }

        // Emit the fully persisted message to conversation room and participants
        io.to(Array.from(targetRooms)).emit('receive_message', messageObj);
      } catch (err) {
        console.error('Error saving message via socket:', err);
        socket.emit('message_error', { error: 'Failed to send message', tempId: data.tempId });
      }
    });

    // Read receipts
    socket.on('mark_read', async ({ conversationId }: { conversationId: string }) => {
      try {
        await ChatService.markAsRead(conversationId, userId);
        const conv = await Conversation.findById(conversationId).select('participants').lean();
        const targetRooms = new Set<string>();
        targetRooms.add(conversationId);
        if (conv?.participants) {
          conv.participants.forEach((p: any) => targetRooms.add(p.toString()));
        }
        io.to(Array.from(targetRooms)).emit('messages_read', { conversationId, readBy: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}, UserID: ${userId}`);
      connectedUsers.delete(userId);
      io.emit('user_offline', userId);
    });
  });

  return io;
};
