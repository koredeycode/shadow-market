import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { generateId } from '../utils/crypto.js';
import logger from '../utils/logger.js';

/**
 * Initialize admin user from environment variables
 * Creates admin user if it doesn't exist
 */
export async function initializeAdmin() {
  logger.info('Initializing admin user...');

  try {
    const { adminUsername, adminPassword, adminAddress } = config;

    if (!adminUsername || !adminPassword) {
      logger.warn('Admin credentials not configured, skipping admin setup');
      return;
    }

    // Check if admin exists by username
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, adminUsername),
    });

    if (existingAdmin) {
      logger.info('Admin user already exists', {
        username: adminUsername,
        userId: existingAdmin.id,
      });

      // Ensure user has admin privileges
      if (!existingAdmin.isAdmin) {
        await db.update(users).set({ isAdmin: true }).where(eq(users.id, existingAdmin.id));
        logger.info('Updated user to admin role', { username: adminUsername });
      }

      // Sync admin address if it differs from config (e.g. from shielded to unshielded)
      if (adminAddress && existingAdmin.address !== adminAddress) {
        await db
          .update(users)
          .set({ address: adminAddress, updatedAt: new Date() })
          .where(eq(users.id, existingAdmin.id));
        logger.info('Synchronized admin wallet address in database', {
          username: adminUsername,
          oldAddress: existingAdmin.address,
          newAddress: adminAddress,
        });
      }

      return existingAdmin;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const [adminUser] = await db
      .insert(users)
      .values({
        id: generateId(),
        address: adminAddress || `admin_${Date.now()}`,
        username: adminUsername,
        encryptedSeed: hashedPassword, // Store password hash in encryptedSeed field
        isAdmin: true,
        reputation: 1000,
      })
      .returning();

    logger.info('Admin user created successfully', {
      username: adminUsername,
      userId: adminUser.id,
      defaultPassword: adminPassword === 'changeme',
    });

    if (adminPassword === 'changeme') {
      logger.warn('SECURITY WARNING: Admin using default password - CHANGE IMMEDIATELY!');
    }

    return adminUser;
  } catch (error) {
    logger.error('Failed to initialize admin user', { error });
    throw error;
  }
}

/**
 * Verify admin password for login
 */
export async function verifyAdminPassword(username: string, password: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || !user.isAdmin || !user.encryptedSeed) {
      return false;
    }

    return await bcrypt.compare(password, user.encryptedSeed);
  } catch (error) {
    logger.error('Error verifying admin password', { error, username });
    return false;
  }
}
