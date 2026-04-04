import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler with improved error classification
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Determine if this is an operational error or a programming error
  const isOperational = err instanceof AppError && err.isOperational;

  // Log error with appropriate level
  const errorContext = {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  // Log stack trace for 500 errors (programming errors), just message for operational errors
  if (isOperational) {
    logger.warn('Operational error occurred', errorContext);
  } else {
    logger.error('Server error occurred', {
      ...errorContext,
      stack: err.stack,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }

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
    errors = err.errors.map(e => ({
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
  } else {
    // For unexpected errors, use the actual error message in development
    if (process.env.NODE_ENV === 'development') {
      message = err.message || 'Internal server error';
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      name: err.name,
      originalMessage: err.message,
    }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
