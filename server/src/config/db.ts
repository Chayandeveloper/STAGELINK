import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in environment variables!');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ Error connecting to MongoDB: ${error.message || error}`);
    console.error('👉 TIP: In MongoDB Atlas -> Network Access, make sure IP 0.0.0.0/0 (Allow access from anywhere) is enabled so Render can connect.');
    // Do not call process.exit(1) so the HTTP server stays alive for Render health checks and diagnosis
  }
};
