import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  customer: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  table: mongoose.Types.ObjectId;
  guestCount: number;
  reservationDate: Date;
  reservationTime: string;
  bookingAmount: number;
  advanceAmount: number;
  paymentMethod: string;
  paymentScreenshot?: string;
  transactionId?: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  reservationStatus: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  verificationNote?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  table: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  guestCount: { type: Number, required: true, min: 1 },
  reservationDate: { type: Date, required: true },
  reservationTime: { type: String, required: true },
  bookingAmount: { type: Number, required: true },
  advanceAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'UPI' },
  paymentScreenshot: { type: String },
  transactionId: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  reservationStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  verificationNote: { type: String },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, {
  timestamps: true
});

export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
