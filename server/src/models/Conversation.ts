import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  conversationType: 'direct' | 'group' | 'gig' | 'event';
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: mongoose.Types.ObjectId;
  unreadCount: Map<string, number>;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  conversationType: {
    type: String,
    enum: ['direct', 'group', 'gig', 'event'],
    default: 'direct'
  },
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  lastMessageSender: { type: Schema.Types.ObjectId, ref: 'User' },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
