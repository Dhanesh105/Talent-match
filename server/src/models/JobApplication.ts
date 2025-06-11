import mongoose, { Document } from 'mongoose';

export interface IJobApplication extends Document {
  job: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  resume: string; // URL to resume file
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  matchScore?: number; // Score representing how well the candidate matches the job
  resumeData?: {
    extractedText: string;
    skills: string[];
    education: string[];
    experience: string[];
  };
  candidateInfo?: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate is required'],
    },
    resume: {
      type: String,
      required: [true, 'Resume is required'],
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending',
    },
    matchScore: {
      type: Number,
      default: 0
    },
    resumeData: {
      extractedText: String,
      skills: [String],
      education: [String],
      experience: [String]
    },
    candidateInfo: {
      name: String,
      email: String
    }
  },
  { timestamps: true }
);

// Create a compound index to prevent duplicate applications
JobApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
