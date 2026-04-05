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
import { terminalSessions } from '../db/schema.js';

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

/**
 * GET /api/users/link/code
 * Generate a code for linking CLI
 */
usersRouter.get('/link/code', async (req, res, next) => {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await db.insert(terminalSessions).values({
      id: `session_${code}_${Date.now()}`,
      pairingCode: code,
      status: 'PENDING',
      expiresAt,
    });

    res.json({ success: true, data: { code, expiresAt: expiresAt.toISOString() } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/link/authorize
 * Authorize a CLI code (authenticated)
 */
usersRouter.post('/link/authorize', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    const session = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, code),
    });

    if (!session || session.status !== 'PENDING' || session.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code' });
    }

    const token = jwt.sign(
      { userId, address: req.user!.address, terminalSessionId: session.id },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    await db.update(terminalSessions)
      .set({ status: 'AUTHORIZED', userId, token, authorizedAt: new Date() })
      .where(eq(terminalSessions.id, code));

    res.json({ success: true, data: { status: 'AUTHORIZED' } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/link/poll/:code
 * Poll for CLI session status
 */
usersRouter.get('/link/poll/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const session = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, code),
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.status === 'AUTHORIZED') {
      return res.json({ success: true, data: { status: 'AUTHORIZED', token: session.token } });
    }

    if (session.expiresAt < new Date()) {
      return res.json({ success: true, data: { status: 'EXPIRED' } });
    }

    res.json({ success: true, data: { status: 'PENDING' } });
  } catch (error) {
    next(error);
  }
});
