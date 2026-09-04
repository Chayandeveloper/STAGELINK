import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: 'customer' | 'restaurant' | 'performer' | 'admin' | null;
  phone?: string;
  city?: string;
  location?: { type: string; coordinates: number[] };
  savedEvents?: mongoose.Types.ObjectId[];
  profileCompleted: boolean;
  interests?: string[];
  lookingFor?: string[];
  gender?: 'male' | 'female' | 'other';
  privacySettings?: {
    visibility: 'invisible' | 'nearby' | 'everyone';
  };
  isEmailVerified: boolean;
  emailOtp?: string;
  emailOtpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'performer', 'admin', null],
    default: null 
  },
  phone: { type: String },
  city: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  savedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  profileCompleted: { type: Boolean, default: false },
  interests: [{ type: String }],
  lookingFor: [{ type: String }],
  gender: { type: String, enum: ['male', 'female', 'other'] },
  privacySettings: {
    visibility: { 
      type: String, 
      enum: ['invisible', 'nearby', 'everyone'],
      default: 'nearby' 
    }
  },
  isEmailVerified: { type: Boolean, default: false },
  emailOtp: { type: String },
  emailOtpExpires: { type: Date },
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpires: { type: Date }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
