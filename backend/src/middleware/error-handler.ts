import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler with improved error classification
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any = undefined;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    // Validation errors
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message;
  } else if (err.name === 'SequelizeUniqueConstraintError' || err.message?.includes('duplicate')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message?.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
