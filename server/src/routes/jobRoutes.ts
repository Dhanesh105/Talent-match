import express from 'express';
import { 
  createJob, 
  getJobs, 
  getJobById, 
  updateJob, 
  deleteJob,
  getTopCandidatesForJob
} from '../controllers/jobController';
import { applyForJob, getJobApplications } from '../controllers/jobApplicationController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   POST /api/jobs
router.post('/', authorize('recruiter', 'admin') as any, createJob as any);

// @route   GET /api/jobs
router.get('/', getJobs as any);

// @route   GET /api/jobs/:id
router.get('/:id', getJobById as any);

// @route   PUT /api/jobs/:id
router.put('/:id', authorize('recruiter', 'admin') as any, updateJob as any);

// @route   DELETE /api/jobs/:id
router.delete('/:id', authorize('recruiter', 'admin') as any, deleteJob as any);

// @route   GET /api/jobs/:id/candidates
router.get('/:id/candidates', authorize('recruiter', 'admin') as any, getTopCandidatesForJob as any);

// @route   POST /api/jobs/:id/apply - Apply for a job (candidate only)
router.post('/:id/apply', authorize('candidate') as any, upload.single('resume'), applyForJob as any);

// @route   GET /api/jobs/:id/applications - Get applications for a job (recruiter only)
router.get('/:id/applications', authorize('recruiter', 'admin') as any, getJobApplications as any);

export default router;
