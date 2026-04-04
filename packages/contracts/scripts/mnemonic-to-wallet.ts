import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

const mnemonic = process.argv.slice(2).join(' ');

if (!mnemonic || mnemonic.split(' ').length < 12) {
  console.error('Error: Please provide a valid mnemonic (at least 12 words) as arguments.');
  console.log('\nUsage: pnpm tsx scripts/mnemonic-to-wallet.ts "word1 word2 ... word12"');
  process.exit(1);
}

try {
  if (!bip39.validateMnemonic(mnemonic, english)) {
    console.error('Error: Invalid mnemonic phrase.');
    process.exit(1);
  }

  console.log('\nProcessing mnemonic...');
  
  // 1. Derive Seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const seedHex = toHex(seed);

  // 2. Derive HD Wallet
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') {
    throw new Error('Failed to initialize HDWallet from seed');
  }

  // 3. Derive Keys for Account 0
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (derivationResult.type !== 'keysDerived') {
    throw new Error('Failed to derive keys');
  }

  // 4. Create Keystore to get Bech32 Address
  // Using 'undeployed' as network ID for local development
  const keystore = createKeystore(derivationResult.keys[Roles.NightExternal], 'undeployed');
  const address = keystore.getBech32Address().toString();
  const hexAddress = keystore.getAddress();

  console.log('\n✅ Wallet derived successfully!');
  console.log('--------------------------------------------------');
  console.log('SEED (HEX):      ', seedHex);
  console.log('HEX ADDRESS:     ', hexAddress);
  console.log('BECH32 ADDRESS:  ', address);
  console.log('--------------------------------------------------');
  console.log('\nEnvironment variables for .env.local:');
  console.log('ADMIN_ADDRESS=' + address);
  console.log('ADMIN_SEED=' + seedHex);

} catch (err: any) {
  console.error('\n❌ An error occurred:', err.message);
  process.exit(1);
}
