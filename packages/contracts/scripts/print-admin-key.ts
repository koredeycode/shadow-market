import { deriveAdminKey, getAdminWalletSeed } from '../src/deployment/config.js';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

async function printAdminKey() {
  try {
    const seed = getAdminWalletSeed();
    const adminKey = deriveAdminKey(seed);
    
    console.log('\n' + '='.repeat(50));
    console.log('🛡️  SHADOW MARKET - ADMIN IDENTITY KEY BACKUP');
    console.log('='.repeat(50));
    console.log('This key is derived from your ADMIN_SEED using PBKDF2.');
    console.log('Use this key as your "userSecretKey" when logging in');
    console.log('to the dashboard or CLI to perform admin actions.\n');
    console.log('ADMIN IDENTITY KEY (HEX):');
    console.log('\x1b[35m%s\x1b[0m', toHex(adminKey));
    console.log('\n' + '='.repeat(50));
    console.log('KEEP THIS KEY PRIVATE AND SECURE.\n');
  } catch (error: any) {
    console.error('\x1b[31mError retrieving admin seed:\x1b[0m', error.message);
    console.log('\nPlease ensure ADMIN_SEED is set in your .env or .env.local file.');
  }
}

printAdminKey();
