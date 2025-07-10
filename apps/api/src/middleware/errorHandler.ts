import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId
  });

  // Determine status code
  const status = err.status || err.statusCode || 500;
  
  // Prepare error response
  const response: any = {
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : {
      stack: err.stack,
      code: err.code
    }
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    response.message = 'Validation error';
    response.errors = err.message;
  } else if (err.name === 'UnauthorizedError') {
    response.message = 'Unauthorized';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    response.message = 'File too large';
  }

  res.status(status).json(response);
}; 