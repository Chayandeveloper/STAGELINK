import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSwipe extends Document {
  swiper: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  action: 'like' | 'dislike';
  dateStr: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const userSwipeSchema = new Schema<IUserSwipe>({
  swiper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['like', 'dislike'], required: true },
  dateStr: { type: String, required: true }
}, {
  timestamps: true
});

userSwipeSchema.index({ swiper: 1, dateStr: 1 });
userSwipeSchema.index({ swiper: 1, target: 1 }, { unique: true });

export const UserSwipe = mongoose.model<IUserSwipe>('UserSwipe', userSwipeSchema);
