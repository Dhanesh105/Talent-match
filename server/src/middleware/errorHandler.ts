import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details (in production, use proper logging service)
  if (process.env.NODE_ENV === 'production') {
    console.error('Production Error:', {
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error('Development Error:', err);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    res.status(400).json({
      message: 'Duplicate field value entered',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
    return;
  }

  // Default error handler
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode === 500 ? 'Internal Server Error' : err.message)
    : err.message || 'Server Error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};
