import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetupVerification extends Document {
  meetupId: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  scannedBy?: mongoose.Types.ObjectId;
  qrToken: string;
  expiresAt: Date;
  scannedAt?: Date;
  confirmedAt?: Date;
  status: 'pending' | 'scanned' | 'confirmed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const meetupVerificationSchema = new Schema<IMeetupVerification>({
  meetupId: { type: Schema.Types.ObjectId, ref: 'Meetup', required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  qrToken: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  scannedAt: { type: Date },
  confirmedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'scanned', 'confirmed', 'expired'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// TTL index to automatically remove expired un-scanned tokens after a bit, though not strictly required
meetupVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const MeetupVerification = mongoose.model<IMeetupVerification>('MeetupVerification', meetupVerificationSchema);
