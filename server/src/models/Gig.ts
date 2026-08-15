import mongoose, { Document, Schema } from 'mongoose';

export interface IGig extends Document {
  restaurant: mongoose.Types.ObjectId;
  title: string;
  description: string;
  budget: string;
  date: Date;
  time: string;
  duration: string;
  requiredSkill?: string;
  requiredExperience?: string;
  audienceSize?: number;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const gigSchema = new Schema<IGig>({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: String, required: true },
  requiredSkill: { type: String },
  requiredExperience: { type: String },
  audienceSize: { type: Number },
  status: { 
    type: String, 
    enum: ['open', 'closed', 'completed', 'cancelled'], 
    default: 'open' 
  }
}, {
  timestamps: true
});

export const Gig = mongoose.model<IGig>('Gig', gigSchema);
