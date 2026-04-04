import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';

/**
 * Generate a fresh Midnight account (BIP-39 Mnemonic, Seed, Addresses)
 */
async function generateAccount() {
  console.log('🚀 Generating fresh Midnight Protocol account...');

  // 1. Generate Mnemonic
  const mnemonic = bip39.generateMnemonic(english, 256);
  
  // 2. Derive Seed from Mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const seedHex = toHex(seed);

  // 3. Derive HD Wallet
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') {
    throw new Error('Failed to initialize HDWallet from seed');
  }

  // 4. Derive Keys for Account 0
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (derivationResult.type !== 'keysDerived') {
    throw new Error('Failed to derive keys');
  }

  // 5. Create Keystore to get Bech32 Address
  // Using 'undeployed' as network ID for local development by default
  const networkId = 'undeployed';
  const keystore = createKeystore(derivationResult.keys[Roles.NightExternal], networkId);
  const bech32Address = keystore.getBech32Address().toString();
  const hexAddress = keystore.getAddress();

  console.log('\n✅ Account generated successfully!');
  console.log('--------------------------------------------------');
  console.log('MNEMONIC:        ', mnemonic);
  console.log('SEED (HEX):      ', seedHex);
  console.log('HEX ADDRESS:     ', hexAddress);
  console.log('BECH32 ADDRESS:  ', bech32Address);
  console.log('--------------------------------------------------');
  console.log('\nUsage for .env.local:');
  console.log(`ADMIN_ADDRESS=${bech32Address}`);
  console.log(`ADMIN_SEED=${seedHex}`);
  console.log(`ADMIN_MNEMONIC=${mnemonic}`);
  console.log('--------------------------------------------------');
  console.log('\n⚠️  SAVE THESE DETAILS SECURELY! ⚠️');
}

generateAccount().catch(err => {
  console.error('\n❌ Generation failed:', err.message);
  process.exit(1);
});
