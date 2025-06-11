import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

// Database connection function
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected');
    }
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return false;
  }
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://talent-match-eosin.vercel.app',
        'https://tm-backend-pi.vercel.app'
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Root route
app.get('/', (_req: Request, res: Response) => {
  try {
    res.json({
      message: 'Welcome to the AI-Powered Recruitment Tool API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      mongodb_uri_set: !!process.env.MONGODB_URI,
      jwt_secret_set: !!process.env.JWT_SECRET,
      status: 'Working without database'
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

// Database test route
app.get('/api/db-test', async (_req: Request, res: Response) => {
  try {
    const connected = await connectDB();
    res.json({
      message: 'Database test completed',
      database_connected: connected,
      connection_state: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test route for user registration (with database)
app.post('/api/users/register', async (_req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    res.json({
      message: 'Registration endpoint reached',
      database_connected: dbConnected,
      note: 'Ready for user registration logic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Registration route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default app;
