import mongoose, { Document, Schema } from 'mongoose';

export interface IConnectionRequest extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'ignored';
  isViewed: boolean;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const connectionRequestSchema = new Schema<IConnectionRequest>({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  isViewed: { type: Boolean, default: false },
  message: { type: String, maxlength: 500 }
}, {
  timestamps: true
});

// Ensure a user can only have one active request to another user
connectionRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const ConnectionRequest = mongoose.model<IConnectionRequest>('ConnectionRequest', connectionRequestSchema);
