import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { generateNumericOTP, sendVerificationEmail, sendPasswordResetEmail } from './emailService';

export const registerUser = async (
  name: string,
  email: string,
  password?: string,
  phone?: string,
  googleId?: string,
  role?: string,
  gender?: string
) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  // If user exists and is already verified, block re-registration
  if (existingUser && existingUser.isEmailVerified) {
    throw new Error('User already exists with this email address');
  }

  let hashedPassword = undefined;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  // Generate 6-digit OTP and 10-minute expiry
  const otp = generateNumericOTP(6);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  let user: IUser;

  if (existingUser && !existingUser.isEmailVerified) {
    // Update existing unverified user record
    existingUser.name = name;
    if (hashedPassword) existingUser.password = hashedPassword;
    if (phone) existingUser.phone = phone;
    if (googleId) existingUser.googleId = googleId;
    if (role) existingUser.role = role as any;
    if (gender) existingUser.gender = gender as any;
    existingUser.emailOtp = otp;
    existingUser.emailOtpExpires = otpExpires;
    existingUser.isEmailVerified = false;
    user = await existingUser.save();
  } else {
    // Create new user record
    const userData: any = {
      name,
      email: normalizedEmail,
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpires,
    };

    if (phone) userData.phone = phone;
    if (hashedPassword) userData.password = hashedPassword;
    if (googleId) userData.googleId = googleId;
    if (role) userData.role = role;
    if (gender) userData.gender = gender;

    user = await User.create(userData);
  }

  // Send verification email asynchronously so the UI responds immediately
  sendVerificationEmail(normalizedEmail, user.name, otp).catch((err) => {
    console.error('❌ Background verification email error:', err);
  });

  return {
    message: 'Verification code sent to your email. Please verify to activate your account.',
    email: user.email,
    requiresVerification: true,
  };
};

export const verifyEmailOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    // Already verified, return user session
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      token: generateToken(user._id as any),
      message: 'Email already verified. Welcome back!',
    };
  }

  if (!user.emailOtp || user.emailOtp !== otp.trim()) {
    throw new Error('Invalid verification code. Please check your email and try again.');
  }

  if (user.emailOtpExpires && user.emailOtpExpires < new Date()) {
    throw new Error('Verification code has expired. Please request a new one.');
  }

  // Mark as verified and clear OTP
  user.isEmailVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted,
    token: generateToken(user._id as any),
    message: 'Email verified successfully!',
  };
};

export const resendVerificationOtp = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('No account found with this email address');
  }

  if (user.isEmailVerified) {
    throw new Error('Email is already verified. You can log in directly.');
  }

  const otp = generateNumericOTP(6);
  user.emailOtp = otp;
  user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendVerificationEmail(normalizedEmail, user.name, otp).catch((err) => {
    console.error('❌ Background resend email error:', err);
  });

  return {
    message: 'A fresh verification code has been sent to your email.',
    email: user.email,
  };
};

export const loginUser = async (email: string, password?: string, googleId?: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  let isAuthenticated = false;

  if (googleId && user.googleId === googleId) {
    isAuthenticated = true;
  } else if (password && user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    throw new Error('Invalid email or password');
  }

  // Check email verification (admin or explicit true passes)
  const isVerified = user.isEmailVerified === true || user.role === 'admin';

  if (!isVerified) {
    // Generate and send a fresh OTP to the unverified user
    const otp = generateNumericOTP(6);
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendVerificationEmail(user.email, user.name, otp).catch((err) => {
      console.error('❌ Background login verification email error:', err);
    });

    const error: any = new Error('Your email is not verified yet. We have sent a verification code to your email.');
    error.status = 403;
    error.requiresVerification = true;
    error.email = user.email;
    throw error;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted,
    token: generateToken(user._id as any),
  };
};

export const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('No account found with this email address');
  }

  const otp = generateNumericOTP(6);
  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendPasswordResetEmail(normalizedEmail, user.name, otp).catch((err) => {
    console.error('❌ Background forgot password email error:', err);
  });

  return {
    message: 'Password reset code sent to your email.',
    email: user.email,
  };
};

export const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('No account found with this email address');
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
    throw new Error('Invalid reset code. Please check your email and try again.');
  }

  if (user.resetPasswordOtpExpires && user.resetPasswordOtpExpires < new Date()) {
    throw new Error('Password reset code has expired. Please request a new one.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;
  // If user reset their password via email OTP, their email is also verified
  user.isEmailVerified = true;
  await user.save();

  return {
    message: 'Password has been reset successfully! You can now sign in with your new password.',
  };
};
