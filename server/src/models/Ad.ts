import mongoose, { Document, Schema } from 'mongoose';

export interface IAd extends Document {
  title: string;
  imageUrl: string;
  targets: { role: string; module: string }[];
  durationMs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adSchema = new Schema<IAd>({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  targets: [{
    role: { type: String, required: true },
    module: { type: String, required: true }
  }],
  durationMs: { type: Number, default: 5000 }, // 5 seconds default
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Ad = mongoose.model<IAd>('Ad', adSchema);
