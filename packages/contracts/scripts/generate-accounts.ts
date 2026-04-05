import * as bip39 from '@scure/bip39';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

async function generate(mnemonicStr: string) {
  const seed = await bip39.mnemonicToSeed(mnemonicStr);
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');

  const keys = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal])
    .deriveKeysAt(0);

  if (keys.type !== 'keysDerived') throw new Error('Key derivation failed');

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys.keys[Roles.Zswap]);
  const coinPubKey = ShieldedCoinPublicKey.fromHexString(shieldedSecretKeys.coinPublicKey as unknown as string);
  const encryptionPubKey = ShieldedEncryptionPublicKey.fromHexString(shieldedSecretKeys.encryptionPublicKey as unknown as string);
  const shieldedAddress = new ShieldedAddress(coinPubKey, encryptionPubKey);

  const networks = ['undeployed', 'preview', 'prepod'] as const;

  console.log('\n+--------------------------------------------------------------+');
  console.log('|            Midnight Account Address Generator                |');
  console.log('+--------------------------------------------------------------+\n');
  console.log(`Mnemonic: ${mnemonicStr}`);

  for (const net of networks) {
    console.log(`\n─── Network: ${net.toUpperCase()} ─────────────────────────────────────`);
    const encodedShielded = ShieldedAddress.codec.encode(net, shieldedAddress).toString();
    console.log(`  🛡️  Shielded:   ${encodedShielded}`);
    
    // Correct way to get the unshielded address (matches Lace format)
    const keystore = createKeystore(keys.keys[Roles.NightExternal], net);
    const unshieldedBech32 = keystore.getBech32Address().toString();
    console.log(`  🌐 Unshielded: ${unshieldedBech32}`);
  }
  console.log('\n+--------------------------------------------------------------+\n');
}

const mnemonic = process.argv.slice(2).join(' ');
if (!mnemonic || mnemonic.split(' ').length < 12) {
  console.log('Usage: pnpm generate:accounts "your mnemonic phrase here"');
} else {
  generate(mnemonic).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('ERROR:', err);
    process.exit(1);
  });
}
