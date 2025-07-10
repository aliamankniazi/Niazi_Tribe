import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  // Default to 500 server error
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  res.status(status).json({
    error: {
      message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    }
  });
}; 