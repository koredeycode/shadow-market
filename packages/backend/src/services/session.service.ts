import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { terminalSessions, users } from '../db/schema.js';
import { generateId } from '../utils/crypto.js';
import { config } from '../config.js';

export class SessionService {
  /**
   * Create a new pending session for the TUI
   */
  async createSession(walletAddress: string) {
    const sessionId = generateId();
    const pairingCode = this.generatePairingCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const [session] = await db
      .insert(terminalSessions)
      .values({
        id: sessionId,
        status: 'PENDING',
        pairingCode,
        walletAddress,
        expiresAt,
      })
      .returning();

    return session;
  }

  /**
   * Authorize a session from the Web UI
   */
  async authorizeSession(pairingCode: string, walletAddress: string, signature: string) {
    // 1. Find the pending session
    const session = await db.query.terminalSessions.findFirst({
      where: and(
        eq(terminalSessions.pairingCode, pairingCode),
        eq(terminalSessions.status, 'PENDING'),
        gt(terminalSessions.expiresAt, new Date())
      ),
    });

    if (!session) {
      throw new Error('Invalid or expired pairing code');
    }

    if (session.walletAddress !== walletAddress) {
       throw new Error(`Address mismatch: Expected ${session.walletAddress}, got ${walletAddress}`);
    }

    // 2. Find or create user for this wallet address
    let user = await db.query.users.findFirst({
      where: eq(users.address, walletAddress),
    });

    if (!user) {
      [user] = await db.insert(users).values({
        id: generateId(),
        address: walletAddress,
      }).returning();
    }

    // 3. Generate a JWT token for the CLI/TUI session
    const token = jwt.sign(
      {
        userId: user.id,
        address: user.address,
        terminalSessionId: session.id,
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    // 4. Update session to AUTHORIZED
    const [updatedSession] = await db
      .update(terminalSessions)
      .set({
        status: 'AUTHORIZED',
        userId: user.id,
        token,
        walletAddress,
        signature,
        authorizedAt: new Date(),
      })
      .where(eq(terminalSessions.id, session.id))
      .returning();

    return updatedSession;
  }

  /**
   * Get session status (for TUI polling)
   */
  async getSessionStatus(pairingCode: string) {
    return await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.pairingCode, pairingCode),
      with: {
        user: true
      }
    });
  }

  /**
   * Helper to generate human-readable pairing codes
   */
  private generatePairingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SHADOW-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
