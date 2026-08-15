import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  event: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  seats: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  bookingStatus: 'confirmed' | 'cancelled';
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // assuming customer is just a User without a specific profile for now
  seats: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  bookingStatus: { 
    type: String, 
    enum: ['confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  qrCode: { type: String }
}, {
  timestamps: true
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
