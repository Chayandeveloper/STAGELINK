import mongoose, { Document, Schema } from 'mongoose';

export interface IConnection extends Document {
  users: mongoose.Types.ObjectId[];
  connectedAt: Date;
}

const connectionSchema = new Schema<IConnection>({
  users: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  connectedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

connectionSchema.index({ users: 1 });

export const Connection = mongoose.model<IConnection>('Connection', connectionSchema);
