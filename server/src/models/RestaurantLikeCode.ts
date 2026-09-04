import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurantLikeCode extends Document {
  code: string;
  restaurant: mongoose.Types.ObjectId;
  restaurantUser: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  customerPhone: string;
  customerName: string;
  billAmount: number;
  likesAwarded: number;
  durationDays: number;
  dateStr: string;
  status: 'active' | 'redeemed' | 'expired';
  redeemedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantLikeCodeSchema = new Schema<IRestaurantLikeCode>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  restaurantUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String, required: true },
  billAmount: { type: Number, required: true, min: 0 },
  likesAwarded: { type: Number, required: true, min: 1 },
  durationDays: { type: Number, default: 7, min: 1 },
  dateStr: { type: String, required: true },
  status: { type: String, enum: ['active', 'redeemed', 'expired'], default: 'active' },
  redeemedAt: { type: Date },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

restaurantLikeCodeSchema.index({ code: 1 });
restaurantLikeCodeSchema.index({ customer: 1, status: 1 });
restaurantLikeCodeSchema.index({ restaurantUser: 1, createdAt: -1 });

export const RestaurantLikeCode = mongoose.model<IRestaurantLikeCode>('RestaurantLikeCode', restaurantLikeCodeSchema);
