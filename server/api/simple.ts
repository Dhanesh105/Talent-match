import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

const app = express();

// Basic CORS
app.use(cors({
  origin: [
    'https://talent-match-eosin.vercel.app',
    'https://tm-backend-pi.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Express API working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoint working',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
export default app;
