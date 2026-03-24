import { Request, Response } from 'express';

/**
 * 404 handler for unknown routes
 */
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
}
