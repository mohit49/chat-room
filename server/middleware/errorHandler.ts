import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import config from '../config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.env === 'development' && { stack: err.stack }),
    });
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  
  return res.status(500).json({
    success: false,
    error: config.env === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};



