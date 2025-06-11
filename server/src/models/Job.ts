import mongoose, { Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  requiredSkills: string[];
  location: string;
  companyName: string;
  postedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    requiredSkills: {
      type: [String],
      required: [true, 'Please provide required skills'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a job location'],
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
    },
    postedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);
