import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBadge extends Document {
  user: mongoose.Types.ObjectId;
  badge: mongoose.Types.ObjectId;
  earnedAt: Date;
}

const userBadgeSchema = new Schema<IUserBadge>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
