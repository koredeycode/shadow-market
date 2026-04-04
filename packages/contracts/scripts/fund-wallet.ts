import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';

// Midnight SDK imports
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  UnshieldedWallet,
  PublicKey,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';

// Shared config import (relative to contracts/scripts)
import { getNetworkConfig } from '../deployment/config.js';

// Enable WebSocket for wallet sync
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

// Constants
const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const NETWORK_CONFIG = getNetworkConfig();
const normalizedNetworkId = (NETWORK_CONFIG.network === 'testnet') ? 'testnet' : 'undeployed';

setNetworkId(normalizedNetworkId);

async function initWallet(seedHex: string) {
  const seed = fromHex(seedHex);
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') throw new Error('Failed to initialize HDWallet');

  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (derivationResult.type !== 'keysDerived') throw new Error('Failed to derive keys');
  hdWallet.hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivationResult.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derivationResult.keys[Roles.Dust]);
  const unshieldedSecretKey = derivationResult.keys[Roles.NightExternal];
  
  const baseConfiguration = {
    networkId: normalizedNetworkId as 'undeployed' | 'testnet',
    costParameters: { additionalFeeOverhead: 1_000_000_000n, feeBlocksMargin: 5 },
    indexerClientConnection: { 
      indexerHttpUrl: NETWORK_CONFIG.indexer, 
      indexerWsUrl: NETWORK_CONFIG.indexerWS 
    },
    relayURL: new URL(NETWORK_CONFIG.nodeUrl),
    provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  const unshieldedKeystore = createKeystore(unshieldedSecretKey, baseConfiguration.networkId);
  const unshieldedPublicKey = PublicKey.fromKeyStore(unshieldedKeystore);

  const shieldedWallet = ShieldedWallet(baseConfiguration).startWithSecretKeys(shieldedSecretKeys);
  const dustWallet = DustWallet(baseConfiguration).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);
  const unshieldedWallet = UnshieldedWallet(baseConfiguration).startWithPublicKey(unshieldedPublicKey);

  const facade = await WalletFacade.init({
    configuration: baseConfiguration,
    shielded: async () => shieldedWallet,
    unshielded: async () => unshieldedWallet,
    dust: async () => dustWallet,
  });

  await facade.start(shieldedSecretKeys, dustSecretKey);
  
  console.log(`  Syncing wallet ${unshieldedKeystore.getBech32Address()}...`);
  await Rx.firstValueFrom(facade.state().pipe(Rx.filter((s: any) => s.isSynced)));
  console.log(`  Wallet synced.`);
  
  return { 
    wallet: facade,
    shieldedSecretKeys, 
    dustSecretKey, 
    unshieldedKeystore 
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('\nUsage: pnpm tsx scripts/fund-wallet.ts <target_address_or_bech32> <amount_in_tnight>');
    console.log('Example: pnpm tsx scripts/fund-wallet.ts mn_addr_... 5000000');
    process.exit(1);
  }

  const [targetInput, amountStr] = args;
  const amount = BigInt(amountStr);

  console.log('\n--- Midnight Wallet Funding Utility ---');
  console.log(`Target: ${targetInput}`);
  console.log(`Amount: ${amount.toLocaleString()} tNight`);
  console.log('---------------------------------------\n');

  try {
    // 1. Resolve Target Address Hex
    // Using the exact logic from full-setup.ts (expects hex string)
    const targetAddressHex = targetInput;
    
    if (targetAddressHex.startsWith('mn_addr_')) {
      console.error('\n❌ Error: You provided a Bech32 address (mn_addr_...).');
      console.error('   The funding script requires a HEX address.');
      console.error('   Please run "pnpm tsx scripts/mnemonic-to-wallet.ts" to get your HEX ADDRESS.');
      process.exit(1);
    }

    console.log(`  Target Address (Hex): ${targetAddressHex}`);

    // 2. Initialize Genesis Wallet
    console.log('  Initializing master wallet...');
    const master = await initWallet(GENESIS_SEED);

    // 3. Check Balance
    const state = await Rx.firstValueFrom(master.wallet.state()) as any;
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Master Balance: ${balance.toLocaleString()} tNight`);

    if (balance < amount + 2_000_000_000n) {
      throw new Error(`Insufficient funds in master wallet. Need ${amount + 2_000_000_000n} tNight (inc. fees).`);
    }

    // 4. Transfer
    console.log(`  Transferring to ${targetAddressHex}...`);
    const recipe = await (master.wallet as any).transferTransaction(
      [
        {
          type: 'unshielded',
          outputs: [
            { 
              receiverAddress: { data: Buffer.from(targetAddressHex, 'hex') } as any, 
              amount: amount, 
              type: unshieldedToken().raw 
            }
          ]
        }
      ],
      {
        shieldedSecretKeys: master.shieldedSecretKeys,
        dustSecretKey: master.dustSecretKey,
      },
      { ttl: new Date(Date.now() + 30 * 60 * 1000) }
    );

    const signedRecipe = await master.wallet.signRecipe(
      recipe, 
      (payload: Uint8Array) => master.unshieldedKeystore.signData(payload)
    );

    const tx = await master.wallet.submitTransaction(await master.wallet.finalizeRecipe(signedRecipe));
    
    console.log('\n✅ Transfer submitted successfully!');
    console.log('---------------------------------------');
    // console.log('Transaction Hash:', toHex(tx.serialize())); // tx might not have a simple hash getter here
    console.log('Status: PENDING (Waiting for inclusion)');
    console.log('---------------------------------------\n');

  } catch (err: any) {
    console.error('\n❌ Funding failed:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
