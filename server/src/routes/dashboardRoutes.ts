import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get dashboard metrics (recruiter only) - TODO: Add role authorization back
router.get('/metrics', getDashboardMetrics);

export default router;
