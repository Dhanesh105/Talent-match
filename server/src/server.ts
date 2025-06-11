import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import userRoutes from './routes/userRoutes';
import jobRoutes from './routes/jobRoutes';
import candidateRoutes from './routes/candidateRoutes';
import jobApplicationRoutes from './routes/jobApplicationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
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
  });
});

// Error handler middleware
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
