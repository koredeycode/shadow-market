import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { generateRandomUsername } from '../utils/names.js';

export const usersRouter = Router();

/**
 * POST /api/users/auth
 * Create or login user with wallet address
 */
usersRouter.post('/auth', async (req, res, next) => {
  try {
    const { address, username } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    logger.info('User authentication request', { address, username });

    // Check if user exists
    let user = await db.query.users.findFirst({
      where: eq(users.address, address),
    });

    // Create new user if doesn't exist
    if (!user) {
      logger.info('Creating new user', { address, username });

      const [newUser] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          address,
          username: username || generateRandomUsername(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      user = newUser;

      logger.info('User created successfully', { userId: user.id, address });
    } else {
      logger.info('User already exists', { userId: user.id, address });

      // Update username if provided and different
      if (username && username !== user.username) {
        await db
          .update(users)
          .set({ username, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        user.username = username;
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        address: user.address,
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    logger.info('JWT token generated', { userId: user.id });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
usersRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        address: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/me
 * Update current user profile
 */
usersRouter.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ username, updatedAt: new Date() })
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        address: users.address,
        username: users.username,
        createdAt: users.createdAt,
      });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});
