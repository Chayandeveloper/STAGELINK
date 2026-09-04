import { UserEngagement } from '../models/UserEngagement';
import { User } from '../models/User';

const MISSIONS_POOL = [
  { missionId: 'VISIT_CAFE', title: 'Visit a New Cafe', description: 'Explore a new local cafe and check in.', xpReward: 50 },
  { missionId: 'ATTEND_EVENT', title: 'Attend a Live Event', description: 'Go to a live performance tonight.', xpReward: 100 },
  { missionId: 'MEET_NEW_PERSON', title: 'Connect with a Fan', description: 'Message someone new in your city.', xpReward: 75 },
  { missionId: 'WRITE_REVIEW', title: 'Write a Review', description: 'Leave a review for a performer or venue.', xpReward: 60 },
  { missionId: 'SHARE_EVENT', title: 'Share an Event', description: 'Share an upcoming event with a friend.', xpReward: 30 },
  { missionId: 'SAVE_EVENT', title: 'Save an Event', description: 'Find an event you like and save it for later.', xpReward: 40 },
  { missionId: 'VIEW_PERFORMER', title: 'Discover Artists', description: 'View 3 different performer profiles.', xpReward: 45 }
];

const getDailyMissions = () => {
  // Select 3 random missions
  const shuffled = [...MISSIONS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map(m => ({ ...m, completed: false }));
};

export const getDashboardInfo = async (userId: string) => {
  let engagement = await UserEngagement.findOne({ user: userId });

  if (!engagement) {
    engagement = await UserEngagement.create({
      user: userId,
      dailyMissions: getDailyMissions(),
      lastMissionDate: new Date()
    });
  } else {
    // Check if missions need to be reset (different day)
    const today = new Date();
    const lastDate = new Date(engagement.lastMissionDate);
    
    if (today.toDateString() !== lastDate.toDateString()) {
      engagement.dailyMissions = getDailyMissions();
      engagement.lastMissionDate = today;
      await engagement.save();
    }
  }

  return engagement;
};

export const completeMission = async (userId: string, missionId: string) => {
  const engagement = await UserEngagement.findOne({ user: userId });
  if (!engagement) throw new Error('Engagement profile not found');

  const mission = engagement.dailyMissions.find(m => m.missionId === missionId);
  if (!mission) throw new Error('Mission not found for today');
  if (mission.completed) throw new Error('Mission already completed');

  mission.completed = true;
  engagement.xp += mission.xpReward;

  // Level up logic (e.g. 500 XP per level)
  const XP_PER_LEVEL = 500;
  const newLevel = Math.floor(engagement.xp / XP_PER_LEVEL) + 1;
  if (newLevel > engagement.level) {
    engagement.level = newLevel;
  }

  await engagement.save();
  return engagement;
};

import { Connection } from '../models/Connection';
import { ConnectionRequest } from '../models/ConnectionRequest';
import { Reservation } from '../models/Reservation';
import { Meetup } from '../models/Meetup';
import { Review } from '../models/Review';
import { UserSwipe } from '../models/UserSwipe';

export const getNearbyPeople = async (userId: string, city?: string) => {
  if (!city) {
    const user = await User.findById(userId);
    city = user?.city || '';
  }
  
  if (!city) return [];

  // Find existing connections to exclude them
  const existingConnections = await Connection.find({
    users: userId
  });
  
  const excludedUserIds = [userId];
  existingConnections.forEach(conn => {
    conn.users.forEach(u => {
      excludedUserIds.push(u.toString());
    });
  });

  // Exclude users where there is a pending/accepted/rejected request
  const requests = await ConnectionRequest.find({
    $or: [
      { requester: userId },
      { recipient: userId }
    ]
  });

  requests.forEach(req => {
    excludedUserIds.push(req.requester.toString());
    excludedUserIds.push(req.recipient.toString());
  });

  // Also exclude any targets swiped (liked or disliked) by this user
  const userSwipes = await UserSwipe.find({ swiper: userId });
  userSwipes.forEach(s => {
    excludedUserIds.push(s.target.toString());
  });

  const users = await User.find({
    _id: { $nin: excludedUserIds },
    role: 'customer',
    city: new RegExp(city, 'i'),
    'privacySettings.visibility': { $ne: 'invisible' }
  })
  .select('name city interests lookingFor profileCompleted gender')
  .limit(10);

  const usersWithStats = await Promise.all(users.map(async (user) => {
    const userIdStr = user._id.toString();

    const [engagement, eventsAttended, meetupsCompleted, reviewsWritten, reviewsReceived] = await Promise.all([
      UserEngagement.findOne({ user: userIdStr }),
      Reservation.countDocuments({ customer: userIdStr, reservationStatus: 'completed' }),
      Meetup.countDocuments({ participants: userIdStr, confirmations: { $elemMatch: { user: userIdStr, confirmedMet: true } } }),
      Review.countDocuments({ reviewer: userIdStr }),
      Review.find({ reviewee: userIdStr }).select('rating')
    ]);

    const level = engagement?.level || 1;
    
    let repScore = 0;
    if (reviewsReceived.length > 0) {
      const totalRating = reviewsReceived.reduce((sum, rev) => sum + rev.rating, 0);
      repScore = Number((totalRating / reviewsReceived.length).toFixed(1));
    } else {
      // Default rep score if no reviews yet
      repScore = 5.0;
    }

    return {
      ...user.toObject(),
      stats: {
        level,
        repScore,
        eventsAttended,
        meetupsCompleted,
        reviewsWritten,
        isVerified: level >= 5 // Example verification logic based on real stats
      }
    };
  }));

  return usersWithStats;
};
