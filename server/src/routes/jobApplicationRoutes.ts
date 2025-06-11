import express from 'express';
import { 
  applyForJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  getRecruiterApplications,
} from '../controllers/jobApplicationController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for candidate applications
router.get('/me', getMyApplications as any);

// Routes for recruiter applications
router.get('/recruiter', getRecruiterApplications as any);

// Routes for application status updates (recruiter only)
router.patch('/:id/status', authorize('recruiter', 'admin') as any, updateApplicationStatus as any);

export default router;
