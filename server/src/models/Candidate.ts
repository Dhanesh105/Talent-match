import mongoose, { Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  extractedText: string;
  skills: string[];
  experience: string[];
  education: string[];
  createdBy: mongoose.Types.ObjectId;
  matchScores: Array<{
    jobId: mongoose.Types.ObjectId;
    score: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a candidate name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume file is required'],
    },
    extractedText: {
      type: String,
      required: [true, 'Extracted text is required'],
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [String],
      default: [],
    },
    education: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
    },
    matchScores: [
      {
        jobId: {
          type: mongoose.Types.ObjectId,
          ref: 'Job',
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
