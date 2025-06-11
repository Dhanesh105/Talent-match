import { Request, Response } from 'express';
import mongoose from 'mongoose';
import JobApplication, { IJobApplication } from '../models/JobApplication';
import Job from '../models/Job';
import User from '../models/User';
import path from 'path';
import { parseResume } from '../utils/resumeParser';
import { calculateMatchScore } from '../utils/candidateMatching';

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidates only)
export const applyForJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id;
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user._id;
    const { name, email, coverLetter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Check if user is a candidate
    const user = await User.findById(userId);
    if (!user || user.role !== 'candidate') {
      res.status(403).json({ message: 'Only candidates can apply for jobs' });
      return;
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      candidate: userId
    });

    if (existingApplication) {
      res.status(400).json({ message: 'You have already applied for this job' });
      return;
    }

    // Check if resume file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'Resume file is required' });
      return;
    }

    // Get the resume file path
    const resumePath = path.join('uploads/resumes', req.file.filename);
    const fullResumePath = path.resolve(path.join(__dirname, '../../../', resumePath));

    // Parse the resume to extract information
    let resumeData;
    try {
      resumeData = await parseResume(fullResumePath);
    } catch (error) {
      console.error('Error parsing resume:', error);
      res.status(400).json({ message: 'Could not parse resume file. Please ensure it is a valid PDF or DOCX file.' });
      return;
    }

    // Calculate match score for this job
    const candidateData = {
      _id: new mongoose.Types.ObjectId(userId),
      skills: resumeData.skills,
      education: resumeData.education,
      extractedText: resumeData.extractedText
    };

    const matchScore = calculateMatchScore(candidateData as any, job);

    // Create application with resume data
    const application = await JobApplication.create({
      job: jobId,
      candidate: userId,
      resume: resumePath,
      coverLetter,
      status: 'pending',
      matchScore,
      resumeData: {
        extractedText: resumeData.extractedText,
        skills: resumeData.skills,
        education: resumeData.education,
        experience: resumeData.experience
      },
      candidateInfo: {
        name: name || user.name,
        email: email || user.email
      }
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all applications for a specific job
// @route   GET /api/jobs/:id/applications
// @access  Private (Recruiters only)
export const getJobApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id;
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user._id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Check if user is authorized (recruiter who posted the job or admin)
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && (user.role !== 'recruiter' || job.postedBy.toString() !== userId))) {
      res.status(403).json({ message: 'Not authorized to view these applications' });
      return;
    }

    // Get applications
    const applications = await JobApplication.find({ job: jobId })
      .populate('candidate', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all applications for the logged-in candidate
// @route   GET /api/applications/me
// @access  Private (Candidates only)
export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user._id;

    // Check if user is a candidate
    const user = await User.findById(userId);
    if (!user || user.role !== 'candidate') {
      res.status(403).json({ message: 'Only candidates can access their applications' });
      return;
    }

    // Get applications
    const applications = await JobApplication.find({ candidate: userId })
      .populate('job', 'title companyName location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Recruiters only)
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationId = req.params.id;
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user._id;
    const { status } = req.body;

    // Check if application exists
    const application = await JobApplication.findById(applicationId).populate('job');
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    // Check if user is authorized (recruiter who posted the job or admin)
    const user = await User.findById(userId);
    console.log("user",user);
    // @ts-ignore - job field is populated
    if (user.role !== 'recruiter') {
      res.status(403).json({ message: 'Not authorized to update this application' });
      return;
    }

    // Update status
    application.status = status;
    await application.save();

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }

  // Get applications for the recruiter
  
};

// Get applications for the recruiter
export const getRecruiterApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const recruiterId = req.params.id;
    // @ts-ignore - req.user is set in auth middleware
    const userId = req.user._id;

      // Check if user is a recruiter
      const user = await User.findById(userId);
      if (!user || user.role !== 'recruiter') {
        res.status(403).json({ message: 'Only recruiters can access their applications' });
        return;
      }

      // Get applications
      const applications = await JobApplication.find({ recruiter: recruiterId })
        .populate('job', 'title companyName location')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      console.error('Get recruiter applications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };