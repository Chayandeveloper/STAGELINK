import { Event } from '../models/Event';
import { Restaurant } from '../models/Restaurant';
import { User } from '../models/User';

export const createEvent = async (userId: string, data: any) => {
  const restaurant = await Restaurant.findOne({ user: userId });
  if (!restaurant) {
    throw new Error('Restaurant profile not found');
  }

  const event = await Event.create({
    ...data,
    restaurant: restaurant._id
  });

  return event;
};

export const getEvents = async (filters: any) => {
  let query: any = { ...filters };

  if (filters.city) {
    // Find restaurant users in the city
    const restaurantUsers = await User.find({ 
      role: 'restaurant', 
      city: new RegExp(filters.city, 'i') 
    });
    
    if (restaurantUsers.length > 0) {
      const userIds = restaurantUsers.map(u => u._id);
      const restaurants = await Restaurant.find({ user: { $in: userIds } });
      const restaurantIds = restaurants.map(r => r._id);
      
      query.restaurant = { $in: restaurantIds };
    } else {
      // If no restaurants found in the city, return no events
      query.restaurant = null;
    }
    
    delete query.city; // Remove city from query as Event model doesn't have it
  }
  if (filters.status === 'upcoming') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // If there's already a date filter, we might need to merge it, but for now this is safe
    query.date = { ...query.date, $gte: today };
  }

  const events = await Event.find(query)
    .populate('restaurant', 'restaurantName location')
    .populate({
      path: 'performer',
      select: 'displayName category bio profilePicture genres ticketsSold socialLinks user',
      populate: { path: 'user', select: 'phone' }
    });

  // Dynamically compute totalGigs and lastPerformed for each performer
  const now = new Date();
  const performerIds = [...new Set(
    events.map((e: any) => e.performer?._id?.toString()).filter(Boolean)
  )];

  // Build a map of performerId -> { totalGigs, lastPerformed }
  const statsMap: Record<string, { totalGigs: number; lastPerformed: string | null }> = {};

  await Promise.all(performerIds.map(async (performerId) => {
    const pastGigs = await Event.find({
      performer: performerId,
      $or: [{ date: { $lt: now } }, { status: 'completed' }]
    })
      .sort({ date: -1 })
      .populate('restaurant', 'restaurantName');

    const lastEvent = pastGigs[0] as any;
    statsMap[performerId] = {
      totalGigs: pastGigs.length,
      lastPerformed: lastEvent?.restaurant?.restaurantName || null
    };
  }));

  // Merge computed stats into each event's performer
  return events.map((event: any) => {
    const eventObj = event.toObject ? event.toObject() : event;
    if (eventObj.performer?._id) {
      const stats = statsMap[eventObj.performer._id.toString()];
      if (stats) {
        eventObj.performer.totalGigs = stats.totalGigs;
        eventObj.performer.lastPerformed = stats.lastPerformed;
      }
    }
    return eventObj;
  });
};

export const getEventById = async (eventId: string) => {
  return await Event.findById(eventId)
    .populate('restaurant', 'restaurantName location address upiId accountHolderName upiQrImage advancePaymentType advanceAmount advancePercentage paymentInstructions advanceBookingEnabled')
    .populate('performer', 'displayName category bio');
};

export const updateEvent = async (eventId: string, data: any) => {
  return await Event.findByIdAndUpdate(eventId, data, { new: true })
    .populate('restaurant', 'restaurantName location address')
    .populate('performer', 'displayName category bio');
};

