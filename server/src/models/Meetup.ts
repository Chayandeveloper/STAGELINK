import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetup extends Document {
  participants: mongoose.Types.ObjectId[];
  venueId?: mongoose.Types.ObjectId; // Suggested StageLink venue
  dateTime: Date;
  purpose: string;
  status: 'scheduled' | 'verified' | 'completed' | 'cancelled';
  verificationStatus: 'pending' | 'started' | 'scanned' | 'verified';
  verificationStartedAt?: Date;
  verificationCompletedAt?: Date;
  completedAt?: Date;
  confirmations: {
    user: mongoose.Types.ObjectId;
    confirmedMet: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const meetupSchema = new Schema<IMeetup>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  venueId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  dateTime: { type: Date, required: true },
  purpose: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'verified', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'started', 'scanned', 'verified'],
    default: 'pending'
  },
  verificationStartedAt: { type: Date },
  verificationCompletedAt: { type: Date },
  completedAt: { type: Date },
  confirmations: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedMet: { type: Boolean }
  }]
}, {
  timestamps: true
});

export const Meetup = mongoose.model<IMeetup>('Meetup', meetupSchema);
