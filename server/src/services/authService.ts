import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';

export const registerUser = async (name: string, email: string, password?: string, phone?: string, googleId?: string, role?: string, gender?: string) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  let hashedPassword = undefined;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const userData: any = {
    name,
    email,
  };
  
  if (phone) userData.phone = phone;
  if (hashedPassword) userData.password = hashedPassword;
  if (googleId) userData.googleId = googleId;
  if (role) userData.role = role;
  if (gender) userData.gender = gender;

  const user = await User.create(userData);

  if (user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      token: generateToken(user._id as any),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

export const loginUser = async (email: string, password?: string, googleId?: string) => {
  const user = await User.findOne({ email });

  if (user) {
    if (googleId && user.googleId === googleId) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
        token: generateToken(user._id as any),
      };
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileCompleted: user.profileCompleted,
          token: generateToken(user._id as any),
        };
      }
    }
  }

  throw new Error('Invalid email or password');
};
