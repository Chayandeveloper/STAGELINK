import { ConnectionRequest } from '../models/ConnectionRequest';
import { Connection } from '../models/Connection';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';

export const sendConnectionRequest = async (requesterId: string, recipientId: string, message?: string) => {
  if (requesterId === recipientId) throw new Error('Cannot connect with yourself');

  const existingRequest = await ConnectionRequest.findOne({
    requester: requesterId,
    recipient: recipientId
  });

  if (existingRequest) throw new Error('Connection request already exists');

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
