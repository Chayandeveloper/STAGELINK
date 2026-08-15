import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
  badgeName: string;
  description: string;
  icon: string;
  requirementType: string;
  requirementValue: number;
}

const badgeSchema = new Schema<IBadge>({
  badgeName: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  requirementType: { type: String, required: true }, // e.g., 'meetups', 'reviews', 'level', 'events_attended'
  requirementValue: { type: Number, required: true }
}, {
  timestamps: true
});

export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
