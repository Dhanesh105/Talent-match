import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).json({
      message: 'Simple test function working',
      method: req.method,
      timestamp: new Date().toISOString(),
      env: {
        node_env: process.env.NODE_ENV,
        mongodb_uri_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test function failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
