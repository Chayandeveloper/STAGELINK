import { Application } from '../models/Application';
import { Performer } from '../models/Performer';
import { Gig } from '../models/Gig';
import { Restaurant } from '../models/Restaurant';
import { Event } from '../models/Event';

export const applyForGig = async (userId: string, gigId: string, data: any) => {
  const performer = await Performer.findOne({ user: userId });
  if (!performer) throw new Error('Performer profile not found');

  const gig = await Gig.findById(gigId);
  if (!gig) throw new Error('Gig not found');

  const existingApplication = await Application.findOne({ gig: gigId, performer: performer._id });
  if (existingApplication) throw new Error('You have already applied for this gig');

  const application = await Application.create({
    gig: gigId,
    performer: performer._id,
    initiator: 'performer',
    ...data
  });

  return application;
};

export const createDirectRequest = async (userId: string, targetId: string, initiatorRole: 'performer' | 'restaurant', data: any) => {
  let performerId, restaurantId;

  if (initiatorRole === 'performer') {
    const performer = await Performer.findOne({ user: userId });
    if (!performer) throw new Error('Performer profile not found');
    performerId = performer._id;
    restaurantId = targetId; // targetId is Restaurant ID
  } else {
    const restaurant = await Restaurant.findOne({ user: userId });
    if (!restaurant) throw new Error('Restaurant profile not found');
    restaurantId = restaurant._id;
    performerId = targetId; // targetId is Performer ID
  }

  const existing = await Application.findOne({ 
    restaurant: restaurantId, 
    performer: performerId, 
    gig: { $exists: false },
    proposedDate: data.proposedDate,
    proposedTime: data.proposedTime
  });
  if (existing) throw new Error('A request already exists between this venue and performer for this exact date and time');

  return await Application.create({
    restaurant: restaurantId,
    performer: performerId,
    initiator: initiatorRole,
    ...data
  });
};

export const getApplicationsForPerformer = async (userId: string) => {
  const performer = await Performer.findOne({ user: userId });
  if (!performer) return [];

  return await Application.find({ performer: performer._id })
    .populate({ path: 'gig', populate: { path: 'restaurant', populate: { path: 'user', select: 'name city' } } })
    .populate({ path: 'restaurant', populate: { path: 'user', select: 'name city' } });
};

export const getApplicationsForVenue = async (userId: string) => {
  const restaurant = await Restaurant.findOne({ user: userId });
  if (!restaurant) return [];

  // Find gig applications + direct applications
  const gigs = await Gig.find({ restaurant: restaurant._id });
  const gigIds = gigs.map(g => g._id);

  return await Application.find({
    $or: [
      { gig: { $in: gigIds } },
      { restaurant: restaurant._id }
    ]
  }).populate({ path: 'performer', populate: { path: 'user', select: 'name city email' } })
    .populate('gig');
};

export const getApplicationsForGig = async (gigId: string, userId: string) => {
  const gig = await Gig.findById(gigId).populate('restaurant');
  if (!gig) throw new Error('Gig not found');
  
  // @ts-ignore
  if (gig.restaurant.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to view these applications');
  }

  return await Application.find({ gig: gigId }).populate('performer');
};

export const updateApplicationStatus = async (applicationId: string, status: string, userId: string) => {
  const application = await Application.findById(applicationId).populate({
    path: 'gig',
    populate: { path: 'restaurant' }
  }).populate('restaurant').populate('performer');

  if (!application) throw new Error('Application not found');

  // Check if authorized
  let isAuthorized = false;
  let restaurantId = null;
  
  if (application.gig) {
    // @ts-ignore
    isAuthorized = application.gig.restaurant.user.toString() === userId.toString();
    // @ts-ignore
    restaurantId = application.gig.restaurant._id;
  } else if (application.restaurant) {
    // @ts-ignore
    isAuthorized = application.restaurant.user.toString() === userId.toString();
    // @ts-ignore
    restaurantId = application.restaurant._id;
  }

  if (!isAuthorized) throw new Error('Not authorized to update this application');

  application.status = status as any;
  await application.save();

  if (status === 'accepted') {
    // Create an event if it doesn't already exist for this specific date
    const dateToCheck = application.gig ? (application.gig as any).date : application.proposedDate;
    
    const existingEvent = await Event.findOne({
      restaurant: restaurantId,
      // @ts-ignore
      performer: application.performer._id,
      gig: application.gig ? application.gig._id : { $exists: false },
      date: dateToCheck
    });

    if (!existingEvent) {
      if (application.gig) {
        await Event.create({
          restaurant: restaurantId,
          // @ts-ignore
          performer: application.performer._id,
          gig: application.gig._id,
          // @ts-ignore
          title: application.gig.title,
          // @ts-ignore
          description: application.gig.description,
          // @ts-ignore
          date: application.gig.date,
          // @ts-ignore
          time: application.gig.time,
          // @ts-ignore
          category: application.gig.requiredSkill || 'Live Performance',
          ticketPrice: 0,
          // @ts-ignore
          totalSeats: application.gig.audienceSize || 50,
          status: 'upcoming'
        });
      } else {
        // Direct Pitch Event Creation
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        
        await Event.create({
          restaurant: restaurantId,
          // @ts-ignore
          performer: application.performer._id,
          title: application.proposedTitle || `Live Performance by ${(application.performer as any).displayName || 'Artist'}`,
          description: application.coverNote || 'An exciting live performance!',
          date: application.proposedDate || fallbackDate,
          time: application.proposedTime || '20:00',
          // @ts-ignore
          category: (application.performer as any).category || 'Live Music',
          ticketPrice: 0,
          totalSeats: 50,
          status: 'upcoming'
        });
      }
    }
  }

  return application;
};
