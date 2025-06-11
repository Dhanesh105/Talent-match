import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    res.status(400).json({
      message: 'Duplicate field value entered',
    });
    return;
  }

  // Default error handler
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
