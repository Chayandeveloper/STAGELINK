import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log(`Debug MONGO_URI: Type=${typeof uri}, Length=${uri?.length || 0}, Prefix="${uri ? uri.substring(0, 15) : 'N/A'}"`);
    
    const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/stagelink');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

