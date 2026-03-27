import { eq } from 'drizzle-orm';
import { NextFunction, Response } from 'express';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { AuthRequest } from './auth.js';

/**
 * Middleware to check if authenticated user is an admin
 * Must be used after the authenticate middleware
 */
export async function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get full user data to check admin status
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        isAdmin: true,
      },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
