import mongoose, { Document, Schema } from 'mongoose';

export interface IMission {
  missionId: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

export interface IUserEngagement extends Document {
  user: mongoose.Types.ObjectId;
  level: number;
  xp: number;
  dailyMissions: IMission[];
  lastMissionDate: Date;
  isPrivate: boolean; // For "Nearby People" opt-out
  createdAt: Date;
  updatedAt: Date;
}

const userEngagementSchema = new Schema<IUserEngagement>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  dailyMissions: [{
    missionId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    xpReward: { type: Number, required: true },
    completed: { type: Boolean, default: false }
  }],
  lastMissionDate: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const UserEngagement = mongoose.model<IUserEngagement>('UserEngagement', userEngagementSchema);
