import { Request, Response } from 'express';
import { Reservation } from '../models/Reservation';

export const createReservation = async (req: Request, res: Response) => {
  try {
    const reservation = new Reservation({
      ...req.body,
      customer: (req as any).user._id
    });
    const createdReservation = await reservation.save();
    res.status(201).json(createdReservation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReservationsByRestaurant = async (req: Request, res: Response) => {
  try {
    const reservations = await Reservation.find({ restaurant: req.params.restaurantId })
      .populate('customer', 'name email profileImage')
      .populate('event', 'title date time')
      .populate('table', 'tableNumber capacity tableType');
    res.json(reservations);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getReservationsByCustomer = async (req: Request, res: Response) => {
  try {
    const reservations = await Reservation.find({ customer: (req as any).user._id })
      .populate('restaurant', 'restaurantName address')
      .populate('event', 'title date time')
      .populate('table', 'tableNumber capacity tableType');
    res.json(reservations);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, verificationNote } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    
    if (reservation) {
      if (status) reservation.reservationStatus = status;
      if (paymentStatus) reservation.paymentStatus = paymentStatus;
      if (verificationNote) reservation.verificationNote = verificationNote;
      
      reservation.approvedBy = (req as any).user._id;
      reservation.approvedAt = new Date();

      // If confirmed, update table status here if needed, or handle it via webhooks/other logic

      const updatedReservation = await reservation.save();
      res.json(updatedReservation);
    } else {
      res.status(404).json({ message: 'Reservation not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReservationScreenshot = async (req: Request, res: Response) => {
  try {
    const { paymentScreenshot, transactionId } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    
    if (reservation) {
      if (paymentScreenshot) reservation.paymentScreenshot = paymentScreenshot;
      if (transactionId) reservation.transactionId = transactionId;
      reservation.paymentStatus = 'pending';
      reservation.reservationStatus = 'pending';
      reservation.verificationNote = undefined;
      
      const updatedReservation = await reservation.save();
      res.json(updatedReservation);
    } else {
      res.status(404).json({ message: 'Reservation not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAttendeesByEvent = async (req: Request, res: Response) => {
  try {
    const reservations = await Reservation.find({ event: req.params.eventId, reservationStatus: { $in: ['pending', 'confirmed', 'completed'] } })
      .populate('customer', 'name profileImage city lookingFor');
    
    // Extract unique customers
    const attendeesMap = new Map();
    reservations.forEach(res => {
      if (res.customer && !attendeesMap.has(res.customer._id.toString())) {
        attendeesMap.set(res.customer._id.toString(), res.customer);
      }
    });

    res.json(Array.from(attendeesMap.values()));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
