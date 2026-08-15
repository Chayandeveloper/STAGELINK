import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformer extends Document {
  user: mongoose.Types.ObjectId;
  displayName: string;
  bio?: string;
  category: string;
  skills: string[];
  genres?: string[];
  languages?: string[];
  experience?: string;
  city: string;
  location?: {
    lat: number;
    lng: number;
  };
  availability?: string; // e.g. "Weekends", "Available Today"
  pricing?: string;
  portfolioVideos?: string[];
  images?: string[];
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  profilePicture?: string;
  totalGigs?: number;
  lastPerformed?: string;
  ticketsSold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const performerSchema = new Schema<IPerformer>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  displayName: { type: String, required: true },
  bio: { type: String },
  category: { type: String, required: true },
  skills: [{ type: String }],
  genres: [{ type: String }],
  languages: [{ type: String }],
  experience: { type: String },
  city: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  availability: { type: String },
  pricing: { type: String },
  portfolioVideos: [{ type: String }],
  images: [{ type: String }],
  socialLinks: {
    instagram: { type: String },
    youtube: { type: String },
    website: { type: String }
  },
  profilePicture: { type: String },
  totalGigs: { type: Number, default: 0 },
  lastPerformed: { type: String },
  ticketsSold: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Performer = mongoose.model<IPerformer>('Performer', performerSchema);
