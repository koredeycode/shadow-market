import { eq } from 'drizzle-orm';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    address: string;
    username?: string;
  };
}

/**
 * Authenticate requests using JWT
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        address: string;
      };

      // Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
        columns: {
          id: true,
          address: true,
          username: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      req.user = {
        id: user.id,
        address: user.address,
        username: user.username ?? undefined,
      };
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      address: string;
    };

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      columns: {
        id: true,
        address: true,
        username: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        address: user.address,
        username: user.username ?? undefined,
      };
    }
  } catch (err) {
    // Ignore invalid tokens for optional auth
  }

  next();
}
