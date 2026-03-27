import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { generateId } from '../utils/crypto.js';

/**
 * Initialize admin user from environment variables
 * Creates admin user if it doesn't exist
 */
export async function initializeAdmin() {
  console.log('🔄 Initializing admin user...');

  try {
    const { adminUsername, adminPassword, adminWalletAddress } = config;

    if (!adminUsername || !adminPassword) {
      console.log('⚠️  Admin credentials not configured, skipping admin setup');
      return;
    }

    // Check if admin exists by username
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, adminUsername),
    });

    if (existingAdmin) {
      console.log(`✅ Admin user '${adminUsername}' already exists`);

      // Ensure user has admin privileges
      if (!existingAdmin.isAdmin) {
        await db.update(users).set({ isAdmin: true }).where(eq(users.id, existingAdmin.id));
        console.log(`  ✅ Updated '${adminUsername}' to admin role`);
      }

      return existingAdmin;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const [adminUser] = await db
      .insert(users)
      .values({
        id: generateId(),
        address: adminWalletAddress || `admin_${Date.now()}`,
        username: adminUsername,
        encryptedSeed: hashedPassword, // Store password hash in encryptedSeed field
        isAdmin: true,
        reputation: 1000,
      })
      .returning();

    console.log(`✅ Created admin user: ${adminUsername}`);
    console.log(`  📧 Username: ${adminUsername}`);
    console.log(
      `  🔑 Password: ${adminPassword === 'changeme' ? '⚠️  CHANGE DEFAULT PASSWORD!' : '✓'}`
    );
    console.log(`  👤 User ID: ${adminUser.id}`);

    return adminUser;
  } catch (error) {
    console.error('❌ Failed to initialize admin:', error);
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
    console.error('Error verifying admin password:', error);
    return false;
  }
}
