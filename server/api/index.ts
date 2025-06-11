import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import { errorHandler } from '../src/middleware/errorHandler';

// Import routes
import userRoutes from '../src/routes/userRoutes';
import jobRoutes from '../src/routes/jobRoutes';
import candidateRoutes from '../src/routes/candidateRoutes';
import jobApplicationRoutes from '../src/routes/jobApplicationRoutes';
import dashboardRoutes from '../src/routes/dashboardRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://talent-match-frontend.vercel.app', 'https://your-frontend-domain.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic API info route
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the AI-Powered Recruitment Tool API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler middleware
app.use(errorHandler);

export default app;
