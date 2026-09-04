import mongoose, { Document, Schema } from 'mongoose';

export interface ILikeRewardTier {
  minBill: number;
  maxBill: number;
  extraLikes: number;
  durationDays: number;
}

export interface ISystemSettings extends Document {
  key: string;
  maxDailyLikes: number;
  maxDailySwipes: number;
  likeRewardTiers: ILikeRewardTier[];
  createdAt: Date;
  updatedAt: Date;
}

const defaultRewardTiers: ILikeRewardTier[] = [
  { minBill: 100, maxBill: 500, extraLikes: 5, durationDays: 3 },
  { minBill: 501, maxBill: 1500, extraLikes: 15, durationDays: 7 },
  { minBill: 1501, maxBill: 3000, extraLikes: 30, durationDays: 14 },
  { minBill: 3001, maxBill: 100000, extraLikes: 50, durationDays: 30 }
];

const systemSettingsSchema = new Schema<ISystemSettings>({
  key: { type: String, default: 'global_settings', unique: true },
  maxDailyLikes: { type: Number, default: 15 },
  maxDailySwipes: { type: Number, default: 50 },
  likeRewardTiers: {
    type: [{
      minBill: { type: Number, required: true },
      maxBill: { type: Number, required: true },
      extraLikes: { type: Number, required: true },
      durationDays: { type: Number, default: 7, min: 1 }
    }],
    default: defaultRewardTiers
  }
}, {
  timestamps: true
});

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
