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

const app = express();

// Initialize database connection
let isConnected = false;

const initializeDB = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  }
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://talent-match-eosin.vercel.app',
        'https://tm-backend-pi.vercel.app',
        /^https:\/\/talent-match.*\.vercel\.app$/,
        /^https:\/\/tm-backend.*\.vercel\.app$/
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}

// Database initialization middleware (non-blocking)
app.use(async (_req, _res, next) => {
  try {
    // Don't block requests if DB connection fails
    initializeDB().catch(err => {
      console.error('DB initialization failed:', err.message);
    });
  } catch (error) {
    console.error('DB middleware error:', error);
  }
  next();
});

// Create uploads directory if it doesn't exist
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  try {
    res.json({
      message: 'Welcome to the AI-Powered Recruitment Tool API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      mongodb_uri_set: !!process.env.MONGODB_URI,
      jwt_secret_set: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.status(500).json({
      error: 'Root route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Basic API info route
app.get('/api', (_req: Request, res: Response) => {
  try {
    res.json({
      message: 'Welcome to the AI-Powered Recruitment Tool API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      status: 'API is working'
    });
  } catch (error) {
    res.status(500).json({
      error: 'API route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  try {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      env: {
        node_env: process.env.NODE_ENV,
        mongodb_uri_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test route to check database connection
app.get('/api/test', async (_req: Request, res: Response) => {
  try {
    await initializeDB();
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Failed to connect',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handler middleware
app.use(errorHandler);

export default app;
