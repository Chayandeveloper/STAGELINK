import { Booking } from '../models/Booking';
import { Event } from '../models/Event';

export const createBooking = async (userId: string, eventId: string, seats: number) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.totalSeats && event.bookedSeats + seats > event.totalSeats) {
    throw new Error('Not enough seats available');
  }

  const totalAmount = (event.ticketPrice || 0) * seats;

  const booking = await Booking.create({
    event: eventId,
    customer: userId,
    seats,
    totalAmount
  });

  // Update event seats
  event.bookedSeats += seats;
  await event.save();

  return booking;
};

export const getBookingById = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId).populate('event');
  if (!booking) throw new Error('Booking not found');

  // Verify ownership
  if (booking.customer.toString() !== userId.toString()) {
    throw new Error('Not authorized to view this booking');
  }

  return booking;
};

export const getUserBookings = async (userId: string) => {
  return await Booking.find({ customer: userId }).populate('event');
};
