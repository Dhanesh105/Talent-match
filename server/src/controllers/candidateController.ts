import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Candidate from '../models/Candidate';
import Job from '../models/Job';
import { parseResume } from '../utils/resumeParser';
import { matchCandidateToJobs } from '../utils/candidateMatching';

// @desc    Upload resume and create candidate
// @route   POST /api/candidates
// @access  Private
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload a file' });
      return;
    }

    const { name, email, phone } = req.body;
    const uploadPath = req.file.path;

    // Parse resume for text and skills
    const { extractedText, skills, education, experience } = await parseResume(uploadPath);

    // Get all active jobs for matching
    const jobs = await Job.find({
      postedBy: req.user._id,
      isActive: true
    });

    // Create candidate
    const candidate = await Candidate.create({
      name,
      email,
      phone,
      resumeUrl: uploadPath,
      extractedText,
      skills,
      experience,
      education,
      createdBy: req.user._id,
      matchScores: []
    });

    // Match against all jobs and update scores
    if (jobs.length > 0) {
      const matchResults = matchCandidateToJobs(candidate, jobs);

      // Update candidate with match scores
      candidate.matchScores = matchResults.map(result => ({
        jobId: result.jobId,
        score: result.score
      }));

      await candidate.save();
    }

    res.status(201).json(candidate);
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all candidates for the logged-in user
// @route   GET /api/candidates
// @access  Private
export const getCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidates = await Candidate.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a candidate by ID
// @route   GET /api/candidates/:id
// @access  Private
export const getCandidateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    // Check if the candidate belongs to the logged-in user
    if (candidate.createdBy.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized to access this candidate' });
      return;
    }

    res.json(candidate);
  } catch (error) {
    console.error('Get candidate by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a candidate
// @route   PUT /api/candidates/:id
// @access  Private
export const updateCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone } = req.body;

    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    // Check if the candidate belongs to the logged-in user
    if (candidate.createdBy.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized to update this candidate' });
      return;
    }

    // Update candidate
    candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone
      },
      { new: true }
    );

    res.json(candidate);
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a candidate
// @route   DELETE /api/candidates/:id
// @access  Private
export const deleteCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    // Check if the candidate belongs to the logged-in user
    if (candidate.createdBy.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized to delete this candidate' });
      return;
    }

    // Remove the resume file if it exists
    if (candidate.resumeUrl && fs.existsSync(candidate.resumeUrl)) {
      fs.unlinkSync(candidate.resumeUrl);
    }

    await candidate.deleteOne();

    res.json({ message: 'Candidate removed' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recommended jobs for a candidate
// @route   GET /api/candidates/:id/jobs
// @access  Private
export const getRecommendedJobsForCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    // Check if the candidate belongs to the logged-in user
    if (candidate.createdBy.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized to access this candidate' });
      return;
    }

    // Find all jobs that this candidate has been matched against
    const jobIds = candidate.matchScores.map(ms => ms.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds } });

    // Sort jobs by match score
    const sortedJobs = jobs
      .map(job => {
        const jobIdString = job._id ? job._id.toString() : '';
        const matchScore = candidate.matchScores.find(
          ms => ms.jobId.toString() === jobIdString
        );
        return {
          _id: jobIdString,
          title: job.title,
          company: job.companyName,
          location: job.location,
          requiredSkills: job.requiredSkills,
          isActive: job.isActive,
          matchScore: matchScore ? matchScore.score : 0,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(sortedJobs);
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
