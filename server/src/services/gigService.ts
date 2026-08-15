import { Gig } from '../models/Gig';
import { Restaurant } from '../models/Restaurant';
import mongoose from 'mongoose';

export const createGig = async (userId: string, data: any) => {
  const restaurant = await Restaurant.findOne({ user: userId });
  if (!restaurant) {
    throw new Error('Restaurant profile not found');
  }

  const gig = await Gig.create({
    ...data,
    restaurant: restaurant._id
  });

  return gig;
};

export const getGigs = async (filters: any) => {
  return await Gig.find(filters).populate('restaurant', 'restaurantName location');
};

export const getGigById = async (gigId: string) => {
  return await Gig.findById(gigId).populate('restaurant', 'restaurantName location address');
};
