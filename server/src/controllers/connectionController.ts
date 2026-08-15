import { Request, Response, NextFunction } from 'express';
import * as connectionService from '../services/connectionService';
import { AuthRequest } from '../middleware/authMiddleware';

export const sendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { recipientId, message } = req.body;
    const request = await connectionService.sendConnectionRequest(req.user._id.toString(), recipientId, message);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { requesterId } = req.body;
    const connection = await connectionService.acceptConnectionRequest(requesterId, req.user._id.toString());
    res.json(connection);
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const { requesterId } = req.body;
    const request = await connectionService.rejectConnectionRequest(requesterId, req.user._id.toString());
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const getPending = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const requests = await connectionService.getPendingRequests(req.user._id.toString());
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getSent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const requests = await connectionService.getSentRequests(req.user._id.toString());
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getConnections = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const connections = await connectionService.getUserConnections(req.user._id.toString());
    res.json(connections);
  } catch (error) {
    next(error);
  }
};
