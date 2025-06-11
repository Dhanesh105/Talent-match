import { Request, Response } from 'express';
import { Model } from 'mongoose';
import Job from '../models/Job';
import JobApplication from '../models/JobApplication';
import { IUser } from '../models/User';

interface DashboardMetrics {
  totalJobs: number;
  totalCandidates: number;
  candidatesPerJob: number;
  averageMatchScore: number;
  recentApplications: any[];
}

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as IUser)?._id;
    
    // Get total jobs posted by this recruiter
    const totalJobs = await Job.countDocuments({ });
    
    // Get total unique candidates who have applied
    const totalCandidates = await JobApplication.distinct('candidate').then(candidates => candidates.length);
    
    // Calculate candidates per job ratio
    const candidatesPerJob = totalJobs > 0 ? Math.round(totalCandidates / totalJobs) : 0;
    
    // Calculate average match score
    const matchScoreStats = await JobApplication.aggregate([
      { $match: { recruiter: userId } },
      { $group: { _id: null, averageScore: { $avg: '$matchScore' } } }
    ]);
    const averageMatchScore = matchScoreStats[0]?.averageScore || 0;
    
    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentApplications = await JobApplication.find({
      recruiter: userId,
      createdAt: { $gte: sevenDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('job', 'title')
    .populate('candidate', 'name');
    
    const metrics: DashboardMetrics = {
      totalJobs,
      totalCandidates,
      candidatesPerJob,
      averageMatchScore,
      recentApplications
    };
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};
