import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  user: mongoose.Types.ObjectId;
  restaurantName: string;
  logo?: string;
  coverImage?: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  capacity?: number;
  cuisine?: string[];
  stageAvailable: boolean;
  budget?: string;
  contactDetails?: string;
  timing?: string;
  // UPI Payment Settings
  upiId?: string;
  accountHolderName?: string;
  upiQrImage?: string;
  advancePaymentType?: 'fixed' | 'percentage';
  advanceAmount?: number;
  advancePercentage?: number;
  paymentInstructions?: string;
  advanceBookingEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  restaurantName: { type: String, required: true },
  logo: { type: String },
  coverImage: { type: String },
  address: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  capacity: { type: Number },
  cuisine: [{ type: String }],
  stageAvailable: { type: Boolean, default: false },
  budget: { type: String },
  contactDetails: { type: String },
  timing: { type: String },
  
  // UPI Payment Settings
  upiId: { type: String },
  accountHolderName: { type: String },
  upiQrImage: { type: String },
  advancePaymentType: { type: String, enum: ['fixed', 'percentage'] },
  advanceAmount: { type: Number },
  advancePercentage: { type: Number, min: 0, max: 100 },
  paymentInstructions: { type: String },
  advanceBookingEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
