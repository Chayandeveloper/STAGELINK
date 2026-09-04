import { ConnectionRequest } from '../models/ConnectionRequest';
import { Connection } from '../models/Connection';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import { SystemSettings, ILikeRewardTier } from '../models/SystemSettings';
import { UserSwipe } from '../models/UserSwipe';
import { RestaurantLikeCode } from '../models/RestaurantLikeCode';

const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getSystemSettings = async () => {
  let settings = await SystemSettings.findOne({ key: 'global_settings' });
  if (!settings) {
    settings = await SystemSettings.create({
      key: 'global_settings',
      maxDailyLikes: 15,
      maxDailySwipes: 50
    });
  }
  return settings;
};

export const updateSystemSettings = async (
  maxDailyLikes: number, 
  maxDailySwipes: number, 
  likeRewardTiers?: ILikeRewardTier[]
) => {
  let settings = await SystemSettings.findOne({ key: 'global_settings' });
  if (!settings) {
    settings = await SystemSettings.create({
      key: 'global_settings',
      maxDailyLikes,
      maxDailySwipes,
      likeRewardTiers: likeRewardTiers || undefined
    });
  } else {
    settings.maxDailyLikes = maxDailyLikes;
    settings.maxDailySwipes = maxDailySwipes;
    if (likeRewardTiers) {
      settings.likeRewardTiers = likeRewardTiers;
    }
    await settings.save();
  }
  return settings;
};

export const calculateLikesForBill = (
  billAmount: number, 
  tiers: ILikeRewardTier[]
): { extraLikes: number; durationDays: number } => {
  if (!tiers || tiers.length === 0) return { extraLikes: 5, durationDays: 7 };
  const sorted = [...tiers].sort((a, b) => a.minBill - b.minBill);
  for (const tier of sorted) {
    if (billAmount >= tier.minBill && billAmount <= tier.maxBill) {
      return { extraLikes: tier.extraLikes, durationDays: tier.durationDays || 7 };
    }
  }
  const highest = sorted[sorted.length - 1];
  if (billAmount > highest.maxBill) {
    return { extraLikes: highest.extraLikes, durationDays: highest.durationDays || 7 };
  }
  const lowest = sorted[0];
  if (billAmount < lowest.minBill) {
    return { extraLikes: 0, durationDays: 0 };
  }
  return { extraLikes: 5, durationDays: 7 };
};

export const getUserSwipeStats = async (userId: string) => {
  const dateStr = getTodayDateStr();
  const settings = await getSystemSettings();
  const now = new Date();

  const [swipesToday, likesToday, activeVouchers] = await Promise.all([
    UserSwipe.countDocuments({ swiper: userId, dateStr }),
    UserSwipe.countDocuments({ swiper: userId, dateStr, action: 'like' }),
    RestaurantLikeCode.find({
      customer: userId,
      status: 'redeemed',
      $or: [
        { expiresAt: { $gte: now } },
        { expiresAt: { $exists: false }, dateStr }
      ]
    })
  ]);

  const baseDailyLikes = settings.maxDailyLikes;
  const maxDailySwipes = settings.maxDailySwipes;
  const bonusLikesToday = activeVouchers.reduce((sum, v) => sum + (v.likesAwarded || 0), 0);
  const effectiveMaxDailyLikes = baseDailyLikes + bonusLikesToday;

  return {
    dateStr,
    swipesToday,
    likesToday,
    baseDailyLikes,
    bonusLikesToday,
    activeBonusesCount: activeVouchers.length,
    maxDailyLikes: effectiveMaxDailyLikes,
    maxDailySwipes,
    likesRemaining: Math.max(0, effectiveMaxDailyLikes - likesToday),
    swipesRemaining: Math.max(0, maxDailySwipes - swipesToday)
  };
};

export const recordSwipe = async (swiperId: string, targetId: string, action: 'like' | 'dislike') => {
  if (swiperId === targetId) throw new Error('Cannot swipe on yourself');

  const stats = await getUserSwipeStats(swiperId);

  if (stats.swipesToday >= stats.maxDailySwipes) {
    throw new Error(`You're out of swipes now! Daily limit reached. Please try again tomorrow!`);
  }

  if (action === 'like' && stats.likesToday >= stats.maxDailyLikes) {
    throw new Error(`You're out of likes now! Daily limit reached. Please try again tomorrow!`);
  }

  const dateStr = getTodayDateStr();

  // Create or update swipe record
  await UserSwipe.findOneAndUpdate(
    { swiper: swiperId, target: targetId },
    { action, dateStr },
    { upsert: true, new: true }
  );

  let connectionReq = null;
  if (action === 'like') {
    // Also trigger send connection request logic if not exists
    const existingReq = await ConnectionRequest.findOne({
      requester: swiperId,
      recipient: targetId
    });
    if (!existingReq) {
      connectionReq = await sendConnectionRequest(swiperId, targetId);
    }
  }

  const updatedStats = await getUserSwipeStats(swiperId);

  return {
    stats: updatedStats,
    connectionRequest: connectionReq
  };
};

export const sendConnectionRequest = async (requesterId: string, recipientId: string, message?: string) => {
  if (requesterId === recipientId) throw new Error('Cannot connect with yourself');

  const existingRequest = await ConnectionRequest.findOne({
    requester: requesterId,
    recipient: recipientId
  });

  if (existingRequest) throw new Error('Connection request already exists');

  // Check swipe limit when sending a connection request
  const dateStr = getTodayDateStr();
  const existingSwipe = await UserSwipe.findOne({ swiper: requesterId, target: recipientId });

  if (!existingSwipe) {
    const stats = await getUserSwipeStats(requesterId);
    if (stats.swipesToday >= stats.maxDailySwipes) {
      throw new Error(`You're out of swipes now! Daily limit reached. Please try again tomorrow!`);
    }
    if (stats.likesToday >= stats.maxDailyLikes) {
      throw new Error(`You're out of likes now! Daily limit reached. Please try again tomorrow!`);
    }

    await UserSwipe.create({
      swiper: requesterId,
      target: recipientId,
      action: 'like',
      dateStr
    });
  }

  const reverseRequest = await ConnectionRequest.findOne({
    requester: recipientId,
    recipient: requesterId
  });

  if (reverseRequest) {
    if (reverseRequest.status === 'pending') {
      return acceptConnectionRequest(recipientId, requesterId);
    }
  }

  const newRequest = await ConnectionRequest.create({
    requester: requesterId,
    recipient: recipientId,
    message
  });

  return newRequest;
};

export const acceptConnectionRequest = async (requesterId: string, recipientId: string) => {
  const request = await ConnectionRequest.findOne({
    requester: requesterId,
    recipient: recipientId
  });

  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

  request.status = 'accepted';
  await request.save();

  // Create the connection
  const connection = await Connection.create({
    users: [requesterId, recipientId]
  });

  // Automatically create a chat conversation
  const existingChat = await Conversation.findOne({
    conversationType: 'direct',
    'participants._id': { $all: [requesterId, recipientId] }
  });

  if (!existingChat) {
    const user1 = await User.findById(requesterId).select('name');
    const user2 = await User.findById(recipientId).select('name');
    
    if (user1 && user2) {
      await Conversation.create({
        participants: [user1._id, user2._id],
        conversationType: 'direct',
        unreadCount: {
          [user1._id.toString()]: 0,
          [user2._id.toString()]: 0
        }
      });
    }
  }

  return connection;
};

export const rejectConnectionRequest = async (requesterId: string, recipientId: string) => {
  const request = await ConnectionRequest.findOne({
    requester: requesterId,
    recipient: recipientId
  });

  if (!request) throw new Error('Request not found');
  
  request.status = 'rejected';
  await request.save();
  return request;
};

export const getPendingRequests = async (userId: string) => {
  const requests = await ConnectionRequest.find({
    recipient: userId,
    status: 'pending'
  }).populate('requester', 'name city interests lookingFor');

  await ConnectionRequest.updateMany(
    { recipient: userId, status: 'pending', isViewed: false },
    { $set: { isViewed: true } }
  );

  return requests;
};

export const getSentRequests = async (userId: string) => {
  return await ConnectionRequest.find({
    requester: userId
  }).populate('recipient', 'name city interests lookingFor privacySettings');
};

export const getUserConnections = async (userId: string) => {
  return await Connection.find({ users: userId })
    .populate('users', 'name city interests');
};

// Check if two users are connected
export const areConnected = async (user1Id: string, user2Id: string) => {
  const conn = await Connection.findOne({
    users: { $all: [user1Id, user2Id] }
  });
  return !!conn;
};
