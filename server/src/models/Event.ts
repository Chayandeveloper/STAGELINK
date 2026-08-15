import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  restaurant: mongoose.Types.ObjectId;
  performer?: mongoose.Types.ObjectId;
  gig?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  time: string;
  coverImage?: string;
  category: string;
  ticketPrice?: number;
  totalSeats?: number;
  bookedSeats: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  // Table Reservation Settings
  enableReservation?: boolean;
  enableAdvancePayment?: boolean;
  reservationLimit?: number; // max guests
  reservationClosingTime?: string;
  createdAt: Date;
  updatedAt: Date;
  interestedCount?: number;
}

const eventSchema = new Schema<IEvent>({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  performer: { type: Schema.Types.ObjectId, ref: 'Performer' },
  gig: { type: Schema.Types.ObjectId, ref: 'Gig' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  coverImage: { type: String },
  category: { type: String, required: true },
  ticketPrice: { type: Number, default: 0 },
  totalSeats: { type: Number },
  bookedSeats: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  interestedCount: { type: Number, default: 0 },
  
  // Table Reservation Settings
  enableReservation: { type: Boolean, default: false },
  enableAdvancePayment: { type: Boolean, default: false },
  reservationLimit: { type: Number },
  reservationClosingTime: { type: String }
}, {
  timestamps: true
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
