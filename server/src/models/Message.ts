import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId; // Optional for group chats
  gig?: mongoose.Types.ObjectId; // Keeping for backward compatibility
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'file' | 'audio';
  image?: string;
  file?: string;
  audio?: string;
  status: 'sent' | 'delivered' | 'read';
  deleted: boolean;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User' },
  gig: { type: Schema.Types.ObjectId, ref: 'Gig' },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'voice', 'file', 'audio'], 
    default: 'text' 
  },
  image: { type: String },
  file: { type: String },
  audio: { type: String },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  deleted: { type: Boolean, default: false },
  edited: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for fast message retrieval by conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
