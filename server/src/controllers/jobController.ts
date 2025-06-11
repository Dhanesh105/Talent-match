import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job';
import Candidate from '../models/Candidate';
import { matchJobToCandidates } from '../utils/candidateMatching';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, description, requiredSkills, location, companyName } = req.body;

    // Create new job
    const job = await Job.create({
      title,
      description, 
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map((skill: string) => skill.trim()),
      location,
      companyName,
      postedBy: req.user._id,
    });

    // Update match scores for existing candidates against this new job
    const candidates = await Candidate.find({ createdBy: req.user._id });
    
    if (candidates.length > 0) {
      const matchResults = matchJobToCandidates(job, candidates);
      
      // Update candidate match scores
      for (const { candidateId, score } of matchResults) {
        await Candidate.findByIdAndUpdate(
          candidateId,
          {
            $push: {
              matchScores: {
                jobId: job._id,
                score,
              },
            },
          }
        );
      }
    }

    res.status(201).json({ job: job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all jobs for the logged-in user
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    console.log(`Found ${jobs.length} jobs`);
    res.json({ jobs: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req: Request, res: Response) => {
  try {
    console.log("Getting job by ID:", req.params.id);
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the logged-in user
    // if (job.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(401).json({ message: 'Not authorized to access this job' });
    // }

    res.json({ job: job });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private
export const updateJob = async (req: Request, res: Response) => {
  try {
    const { title, description, requiredSkills, location, companyName, isActive } = req.body;

    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the logged-in user
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this job' });
    }

    // Update job
    job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map((skill: string) => skill.trim()),
        location,
        companyName,
        isActive,
      },
      { new: true }
    );

    // If job requirements changed, update candidate match scores
    if (requiredSkills) {
      const candidates = await Candidate.find({ createdBy: req.user._id });
      
      if (candidates.length > 0 && job) {
        const matchResults = matchJobToCandidates(job, candidates);
        
        // Update candidate match scores
        for (const { candidateId, score } of matchResults) {
          await Candidate.updateOne(
            { 
              _id: candidateId,
              "matchScores.jobId": job._id 
            },
            {
              $set: { "matchScores.$.score": score }
            }
          );
        }
      }
    }

    res.json({ job: job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the logged-in user
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();

    // Remove this job from all candidate match scores
    await Candidate.updateMany(
      { createdBy: req.user._id },
      { $pull: { matchScores: { jobId: job._id } } }
    );

    res.json({ message: 'Job removed' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top candidates for a job
// @route   GET /api/jobs/:id/candidates
// @access  Private
export const getTopCandidatesForJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the logged-in user
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to access this job' });
    }

    // Find candidates with match scores for this job, sort by score
    const candidates = await Candidate.find({
      createdBy: req.user._id,
      'matchScores.jobId': job._id,
    }).select('name email phone skills education matchScores');

    // Sort candidates by their match score for this job
    const sortedCandidates = candidates
      .map(candidate => {
        const jobIdString = job._id ? job._id.toString() : '';
        const candidateIdString = candidate._id ? candidate._id.toString() : '';
        const matchScore = candidate.matchScores.find(
          ms => ms.jobId.toString() === jobIdString
        );
        return {
          _id: candidateIdString,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          skills: candidate.skills,
          education: candidate.education,
          matchScore: matchScore ? matchScore.score : 0,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ candidates: sortedCandidates });
  } catch (error) {
    console.error('Get top candidates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
