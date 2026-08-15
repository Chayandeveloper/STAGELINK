import { Meetup } from '../models/Meetup';
import { Connection } from '../models/Connection';
import { Restaurant } from '../models/Restaurant';
import { UserEngagement } from '../models/UserEngagement';
import { MeetupVerification } from '../models/MeetupVerification';
import { getIO } from '../sockets';
import crypto from 'crypto';

export const proposeMeetup = async (userId: string, recipientId: string, venueId: string, dateTime: Date, purpose: string) => {
  // Check if connected
  const conn = await Connection.findOne({ users: { $all: [userId, recipientId] } });
  if (!conn) throw new Error('You can only propose meetups with connections');

  // Verify venue is a partner (allow mock ID for demo purposes)
  if (venueId !== '000000000000000000000000') {
    const venue = await Restaurant.findById(venueId);
    if (!venue) throw new Error('Venue not found');
  }

  const meetup = await Meetup.create({
    participants: [userId, recipientId],
    venueId,
    dateTime,
    purpose,
    status: 'scheduled',
    verificationStatus: 'pending',
    confirmations: [
      { user: userId },
      { user: recipientId }
    ]
  });

  return meetup;
};

export const confirmMeetup = async (userId: string, meetupId: string, didMeet: boolean) => {
  const meetup = await Meetup.findById(meetupId);
  if (!meetup) throw new Error('Meetup not found');
  if (meetup.status !== 'verified') throw new Error(`Meetup must be verified first`);

  const userConf = meetup.confirmations.find((c: any) => c.user.toString() === userId);
  if (!userConf) throw new Error('User not part of this meetup');

  userConf.confirmedMet = didMeet;
  
  // Check if both users answered
  const allAnswered = meetup.confirmations.every((c: any) => c.confirmedMet !== undefined && c.confirmedMet !== null);
  
  if (allAnswered) {
    const bothMet = meetup.confirmations.every((c: any) => c.confirmedMet === true);
    if (bothMet) {
      meetup.status = 'completed';
      meetup.completedAt = new Date();
      
      // Award XP to both users
      for (const participantId of meetup.participants) {
        const eng = await UserEngagement.findOne({ user: participantId });
        if (eng) {
          eng.xp += 200; // Big reward for real world meetup
          
          const XP_PER_LEVEL = 500;
          const newLevel = Math.floor(eng.xp / XP_PER_LEVEL) + 1;
          if (newLevel > eng.level) {
            eng.level = newLevel;
          }
          await eng.save();
        }
      }
    } else {
      meetup.status = 'cancelled';
    }
  }

  await meetup.save();
  return meetup;
};

// --- QR VERIFICATION LOGIC ---

export const generateVerificationToken = async (meetupId: string, userId: string) => {
  const meetup = await Meetup.findById(meetupId);
  if (!meetup) throw new Error('Meetup not found');
  
  if (!meetup.participants.includes(userId as any)) {
    throw new Error('Not a participant in this meetup');
  }

  if (meetup.status !== 'scheduled' && meetup.status !== 'verified') {
    throw new Error('Meetup is not in a verifiable state');
  }

  // Optional: Invalidate existing pending tokens
  await MeetupVerification.updateMany(
    { meetupId, status: 'pending' },
    { $set: { status: 'expired' } }
  );

  const qrToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  const verification = await MeetupVerification.create({
    meetupId,
    generatedBy: userId,
    qrToken,
    expiresAt,
    status: 'pending'
  });

  meetup.verificationStatus = 'started';
  if (!meetup.verificationStartedAt) {
    meetup.verificationStartedAt = new Date();
  }
  await meetup.save();

  return verification;
};

export const scanVerificationToken = async (meetupId: string, scannerId: string, token: string) => {
  const meetup = await Meetup.findById(meetupId);
  if (!meetup) throw new Error('Meetup not found');

  if (!meetup.participants.includes(scannerId as any)) {
    throw new Error('Not a participant in this meetup');
  }

  const verification = await MeetupVerification.findOne({ qrToken: token, meetupId });
  if (!verification) throw new Error('Invalid verification token');

  if (verification.generatedBy.toString() === scannerId) {
    throw new Error('You cannot scan your own QR code');
  }

  if (verification.status !== 'pending') {
    throw new Error(`Token is already ${verification.status}`);
  }

  if (verification.expiresAt < new Date()) {
    verification.status = 'expired';
    await verification.save();
    throw new Error('QR token has expired');
  }

  verification.status = 'scanned';
  verification.scannedBy = scannerId as any;
  verification.scannedAt = new Date();
  await verification.save();

  meetup.verificationStatus = 'scanned';
  await meetup.save();

  // Notify the generator that their QR was scanned
  getIO().to(verification.generatedBy.toString()).emit('verification_request_received', { meetupId, scannerId });

  return verification;
};

export const confirmVerification = async (meetupId: string, generatorId: string) => {
  const meetup = await Meetup.findById(meetupId);
  if (!meetup) throw new Error('Meetup not found');

  // Find the scanned token
  const verification = await MeetupVerification.findOne({
    meetupId,
    generatedBy: generatorId,
    status: 'scanned'
  }).sort({ scannedAt: -1 });

  if (!verification) throw new Error('No scanned token found to confirm');

  verification.status = 'confirmed';
  verification.confirmedAt = new Date();
  await verification.save();

  meetup.status = 'verified';
  meetup.verificationStatus = 'verified';
  meetup.verificationCompletedAt = new Date();
  await meetup.save();

  // Notify both participants that verification is complete
  for (const participantId of meetup.participants) {
    getIO().to(participantId.toString()).emit('meetup_verified', { meetupId });
  }

  return meetup;
};


export const getUserMeetups = async (userId: string) => {
  return await Meetup.find({ participants: userId })
    .populate('participants', 'name')
    .populate('venueId', 'restaurantName address')
    .sort({ dateTime: 1 });
};
