import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, googleId, role, gender } = req.body;
    const userData = await authService.registerUser(name, email, password, phone, googleId, role, gender);
    res.status(201).json(userData);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('---------------------');
    const { email, password, googleId } = req.body;
    const userData = await authService.loginUser(email, password, googleId);
    res.status(200).json(userData);
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      res.status(401);
    }
    next(error);
  }
};
