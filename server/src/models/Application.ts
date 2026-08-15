import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  gig?: mongoose.Types.ObjectId;
  restaurant?: mongoose.Types.ObjectId;
  performer: mongoose.Types.ObjectId;
  initiator: 'performer' | 'restaurant';
  coverNote?: string;
  expectedPrice?: string;
  proposedDate?: Date;
  proposedTime?: string;
  proposedTitle?: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig' },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  performer: { type: Schema.Types.ObjectId, ref: 'Performer', required: true },
  initiator: { type: String, enum: ['performer', 'restaurant'], default: 'performer' },
  coverNote: { type: String },
  expectedPrice: { type: String },
  proposedDate: { type: Date },
  proposedTime: { type: String },
  proposedTitle: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'shortlisted', 'accepted', 'rejected'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
