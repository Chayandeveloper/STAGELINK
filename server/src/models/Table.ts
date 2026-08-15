import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  restaurant: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  tableType: 'VIP' | 'Normal';
  status: 'Available' | 'Reserved' | 'Occupied' | 'Disabled';
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>({
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  tableType: { type: String, enum: ['VIP', 'Normal'], default: 'Normal' },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Occupied', 'Disabled'], 
    default: 'Available' 
  }
}, {
  timestamps: true
});

// Compound index to ensure table numbers are unique per restaurant
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

export const Table = mongoose.model<ITable>('Table', tableSchema);
