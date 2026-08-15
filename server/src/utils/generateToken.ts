import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const generateToken = (userId: mongoose.Types.ObjectId): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};
