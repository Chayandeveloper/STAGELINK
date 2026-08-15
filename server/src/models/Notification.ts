import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'gig_accepted' | 'gig_rejected' | 'event_reminder' | 'payment' | 'general';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['gig_accepted', 'gig_rejected', 'event_reminder', 'payment', 'general'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String }
}, {
  timestamps: true
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
