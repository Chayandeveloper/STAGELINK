import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import mongoose from 'mongoose';

export class ChatService {
  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string) {
    const objectId = new mongoose.Types.ObjectId(userId);
    return await Conversation.find({ participants: objectId })
      .populate('participants', 'name email') // adjust based on what user info is needed
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  /**
   * Get messages for a specific conversation
   */
  static async getMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name')
      .lean();
    
    // Reverse to send oldest first for UI if needed, or handle in frontend
    return messages; 
  }

  /**
   * Create or find a direct conversation
   */
  static async getOrCreateDirectConversation(user1Id: string, user2Id: string) {
    const u1 = new mongoose.Types.ObjectId(user1Id);
    const u2 = new mongoose.Types.ObjectId(user2Id);

    let conversation = await Conversation.findOne({
      conversationType: 'direct',
      participants: { $all: [u1, u2], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [u1, u2],
        conversationType: 'direct',
        unreadCount: new Map([[user1Id, 0], [user2Id, 0]])
      });
      await conversation.save();
    }

    return conversation;
  }

  /**
   * Save a new message
   */
  static async saveMessage(
    conversationId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'voice' | 'file' | 'audio' = 'text'
  ) {
    const message = new Message({
      conversationId,
      sender: senderId,
      content,
      messageType,
      status: 'sent'
    });

    await message.save();

    // Update conversation metadata
    const conv = await Conversation.findById(conversationId);
    if (conv) {
      conv.lastMessage = content.substring(0, 50); // Preview
      conv.lastMessageAt = message.createdAt;
      conv.lastMessageSender = new mongoose.Types.ObjectId(senderId);
      
      // Increment unread count for other participants
      conv.participants.forEach(p => {
        const pIdStr = p.toString();
        if (pIdStr !== senderId) {
          const currentCount = conv.unreadCount.get(pIdStr) || 0;
          conv.unreadCount.set(pIdStr, currentCount + 1);
        }
      });
      await conv.save();
    }
    await message.populate('sender', 'name');

    return message;
  }

  /**
   * Mark messages as read in a conversation for a specific user
   */
  static async markAsRead(conversationId: string, userId: string) {
    // Update all unread messages in this conversation where the user is NOT the sender
    await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: new mongoose.Types.ObjectId(userId) }, 
        status: { $in: ['sent', 'delivered'] } 
      },
      { $set: { status: 'read' } }
    );

    // Reset unread count for this user in the conversation
    const conv = await Conversation.findById(conversationId);
    if (conv) {
      conv.unreadCount.set(userId, 0);
      await conv.save();
    }
  }

  /**
   * Mark messages as delivered (e.g. when user comes online)
   */
  static async markAsDelivered(conversationId: string, userId: string) {
    await Message.updateMany(
      { 
        conversationId, 
        sender: { $ne: new mongoose.Types.ObjectId(userId) }, 
        status: 'sent'
      },
      { $set: { status: 'delivered' } }
    );
  }
}
