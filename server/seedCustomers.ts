import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './src/models/User';

dotenv.config();

const demoCustomers = [
  { name: 'Aarav Sharma', phone: '9876543201', email: 'aarav.sharma@stagelink.com', gender: 'male', interests: ['Live Music', 'Coffee', 'Food'] },
  { name: 'Priya Das', phone: '9876543202', email: 'priya.das@stagelink.com', gender: 'female', interests: ['Food', 'Art', 'Coffee'] },
  { name: 'Rohit Kalita', phone: '9876543203', email: 'rohit.kalita@stagelink.com', gender: 'male', interests: ['Comedy', 'Live Music', 'Gaming'] },
  { name: 'Ananya Roy', phone: '9876543204', email: 'ananya.roy@stagelink.com', gender: 'female', interests: ['Photography', 'Travel', 'Art'] },
  { name: 'Devraj Borah', phone: '9876543205', email: 'devraj.borah@stagelink.com', gender: 'male', interests: ['Tech', 'Gaming', 'Live Music'] },
  { name: 'Sneha Goswami', phone: '9876543206', email: 'sneha.goswami@stagelink.com', gender: 'female', interests: ['Coffee', 'Books', 'Fitness'] },
  { name: 'Vikram Dutta', phone: '9876543207', email: 'vikram.dutta@stagelink.com', gender: 'male', interests: ['Fitness', 'Travel', 'Food'] },
  { name: 'Rhea Sen', phone: '9876543208', email: 'rhea.sen@stagelink.com', gender: 'female', interests: ['Live Music', 'Art', 'Photography'] },
  { name: 'Arjun Baruah', phone: '9876543209', email: 'arjun.baruah@stagelink.com', gender: 'male', interests: ['Food', 'Coffee', 'Comedy'] },
  { name: 'Tanvi Hazarika', phone: '9876543210', email: 'tanvi.hazarika@stagelink.com', gender: 'female', interests: ['Books', 'Art', 'Coffee'] },
  { name: 'Karan Saikia', phone: '9876543211', email: 'karan.saikia@stagelink.com', gender: 'male', interests: ['Gaming', 'Tech', 'Fitness'] },
  { name: 'Megha Choudhury', phone: '9876543212', email: 'megha.choudhury@stagelink.com', gender: 'female', interests: ['Live Music', 'Travel', 'Food'] },
  { name: 'Aditya Nath', phone: '9876543213', email: 'aditya.nath@stagelink.com', gender: 'male', interests: ['Comedy', 'Food', 'Live Music'] },
  { name: 'Nisha Borthakur', phone: '9876543214', email: 'nisha.borthakur@stagelink.com', gender: 'female', interests: ['Photography', 'Coffee', 'Art'] },
  { name: 'Siddharth Sarma', phone: '9876543215', email: 'siddharth.sarma@stagelink.com', gender: 'male', interests: ['Travel', 'Fitness', 'Tech'] },
  { name: 'Ishita Medhi', phone: '9876543216', email: 'ishita.medhi@stagelink.com', gender: 'female', interests: ['Art', 'Books', 'Comedy'] },
  { name: 'Rahul Kashyap', phone: '9876543217', email: 'rahul.kashyap@stagelink.com', gender: 'male', interests: ['Live Music', 'Gaming', 'Coffee'] },
  { name: 'Pooja Bhattacharya', phone: '9876543218', email: 'pooja.bhattacharya@stagelink.com', gender: 'female', interests: ['Food', 'Fitness', 'Travel'] },
  { name: 'Manish Deka', phone: '9876543219', email: 'manish.deka@stagelink.com', gender: 'male', interests: ['Tech', 'Photography', 'Live Music'] },
  { name: 'Rupali Pathak', phone: '9876543220', email: 'rupali.pathak@stagelink.com', gender: 'female', interests: ['Coffee', 'Food', 'Books'] },
  { name: 'Abhinav Tamuly', phone: '9876543221', email: 'abhinav.tamuly@stagelink.com', gender: 'male', interests: ['Gaming', 'Comedy', 'Food'] },
  { name: 'Shreya Phukan', phone: '9876543222', email: 'shreya.phukan@stagelink.com', gender: 'female', interests: ['Fitness', 'Travel', 'Live Music'] }
];

const seedCustomers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stagelink';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    let countCreated = 0;
    let countUpdated = 0;

    for (const cust of demoCustomers) {
      const existing = await User.findOne({
        $or: [{ email: cust.email }, { phone: cust.phone }]
      });

      if (existing) {
        existing.name = cust.name;
        existing.phone = cust.phone;
        existing.city = 'Guwahati';
        existing.role = 'customer';
        existing.gender = cust.gender as any;
        existing.profileCompleted = true;
        existing.interests = cust.interests;
        existing.lookingFor = cust.interests.slice(0, 2);
        existing.password = hashedPassword;
        await existing.save();
        countUpdated++;
        console.log(`Updated: ${cust.name} [${cust.phone}]`);
      } else {
        await User.create({
          ...cust,
          city: 'Guwahati',
          role: 'customer',
          profileCompleted: true,
          lookingFor: cust.interests.slice(0, 2),
          password: hashedPassword
        });
        countCreated++;
        console.log(`Created: ${cust.name} [${cust.phone}]`);
      }
    }

    console.log(`\nSuccess: Processed ${demoCustomers.length} demo customer accounts (${countCreated} created, ${countUpdated} updated).`);
    console.log('Default Password for all: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding customers:', error);
    process.exit(1);
  }
};

seedCustomers();
