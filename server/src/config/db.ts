import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-tool';
    
    await mongoose.connect(mongoURI);
    
    console.log('MongoDB Connected');
  } catch (err: any) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
