import express, { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/users/register
router.post('/register', (req: Request, res: Response) => registerUser(req, res));

// @route   POST /api/users/login
router.post('/login', (req: Request, res: Response) => loginUser(req, res));

// @route   GET /api/users/profile
router.get('/profile', protect, (req: Request, res: Response) => getUserProfile(req, res));

export default router;
