import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './src/models/User';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stagelink');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@stagelink.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await User.create({
      name: 'StageLink Admin',
      email: 'admin@stagelink.com',
      password: hashedPassword,
      role: 'admin',
      profileCompleted: true
    });

    console.log('Admin user created successfully!');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
