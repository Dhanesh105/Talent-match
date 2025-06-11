import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  uploadResume, 
  getCandidates, 
  getCandidateById, 
  updateCandidate, 
  deleteCandidate,
  getRecommendedJobsForCandidate
} from '../controllers/candidateController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Configure multer storage for resume files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for resume uploads
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Protect all routes
router.use(protect);

// @route   POST /api/candidates
router.post('/', upload.single('resume'), (req: Request, res: Response) => uploadResume(req, res));

// @route   GET /api/candidates
router.get('/', (req: Request, res: Response) => getCandidates(req, res));

// @route   GET /api/candidates/:id
router.get('/:id', (req: Request, res: Response) => getCandidateById(req, res));

// @route   PUT /api/candidates/:id
router.put('/:id', (req: Request, res: Response) => updateCandidate(req, res));

// @route   DELETE /api/candidates/:id
router.delete('/:id', (req: Request, res: Response) => deleteCandidate(req, res));

// @route   GET /api/candidates/:id/jobs
router.get('/:id/jobs', (req: Request, res: Response) => getRecommendedJobsForCandidate(req, res));

export default router;
