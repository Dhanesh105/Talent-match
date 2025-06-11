import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-tool';

    await mongoose.connect(mongoURI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB Connected');
  } catch (err: any) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // In serverless environment, don't exit the process
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};

export default connectDB;
