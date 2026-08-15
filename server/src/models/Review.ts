import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewerModel: 'User' | 'Restaurant' | 'Performer';
  reviewee: mongoose.Types.ObjectId;
  revieweeModel: 'User' | 'Restaurant' | 'Performer';
  event?: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  reviewer: { type: Schema.Types.ObjectId, required: true, refPath: 'reviewerModel' },
  reviewerModel: { type: String, required: true, enum: ['User', 'Restaurant', 'Performer'] },
  reviewee: { type: Schema.Types.ObjectId, required: true, refPath: 'revieweeModel' },
  revieweeModel: { type: String, required: true, enum: ['User', 'Restaurant', 'Performer'] },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, {
  timestamps: true
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
