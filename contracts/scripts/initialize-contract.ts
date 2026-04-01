/**
 * Initialize the unified prediction market contract
 *
 * This script calls the initialize() circuit on the deployed contract
 * to set it up for use. Must be run once after deployment.
 */

import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// Midnight SDK imports
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
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

// Project imports
import { getNetworkConfig, getAdminWalletSeed } from '../deployment/config.js';
import { ShadowMarketAPI } from '../../api/src/index.js';
import { createWitnessProviders, type MarketPrivateState } from '../../api/src/witnesses.js';

const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

// --- Private State Helpers ---
class MemoryPrivateStateProvider {
  private states = new Map<string, any>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.states.get(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.states.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.states.delete(key);
  }

  async getSigningKey(address: string): Promise<Uint8Array | undefined> {
    return this.states.get(`signing-key-${address}`);
  }

  async setSigningKey(address: string, key: Uint8Array): Promise<void> {
    this.states.set(`signing-key-${address}`, key);
  }

  setContractAddress(address: string): void {
    console.log(`Private state provider scoped to contract: ${address}`);
  }
}

async function fundWallet(fromCtx: any, toUserAddress: any, amount: bigint) {
  const stateBefore = await Rx.firstValueFrom(fromCtx.wallet.state()) as any;
  const balance = stateBefore.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Source Balance: ${balance.toLocaleString()} tNight`);
  
  if (balance < amount + 10_000_000_000n) {
    throw new Error(`Insufficient funds in source wallet`);
  }

  const recipe = await fromCtx.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [
          { 
            receiverAddress: { data: Buffer.from(toUserAddress as string, 'hex') }, 
            amount: amount, 
            type: unshieldedToken().raw 
          }
        ]
      }
    ],
    {
      shieldedSecretKeys: fromCtx.shieldedSecretKeys,
      dustSecretKey: fromCtx.dustSecretKey,
    },
    { ttl: new Date(Date.now() + 30 * 60 * 1000) }
  );

  const signedRecipe = await fromCtx.wallet.signRecipe(recipe, (payload: Uint8Array) => fromCtx.unshieldedKeystore.signData(payload));
  await fromCtx.wallet.submitTransaction(await fromCtx.wallet.finalizeRecipe(signedRecipe));
  console.log(`  Transfer submitted.`);
}

async function registerForDust(ctx: any) {
  const state = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced))) as any;
  if (state.dust.balance(new Date()) < 1000n) {
    console.log(`  Registering ${ctx.address} for DUST generation...`);
    const nightUtxos = state.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
    if (nightUtxos.length > 0) {
      const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
        nightUtxos,
        ctx.unshieldedKeystore.getPublicKey(),
        (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload)
      );
      await ctx.wallet.submitTransaction(await ctx.wallet.finalizeRecipe(recipe));
    }
    await Rx.firstValueFrom(ctx.wallet.state().pipe(
      Rx.filter((state: any) => state.isSynced && state.dust.balance(new Date()) >= 1000n)
    ));
    console.log(`  DUST ready for ${ctx.address}`);
  }
}

// Enable WebSocket
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const zkConfigPath = path.resolve(__dirname, '..', 'src', 'managed', 'shadow-market');

async function initWallet(seedHex: string, networkId: string) {
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
    networkId: networkId as any,
    costParameters: { additionalFeeOverhead: 1_000_000_000n, feeBlocksMargin: 5 },
    indexerClientConnection: { indexerHttpUrl: getNetworkConfig().indexer, indexerWsUrl: getNetworkConfig().indexerWS },
    relayURL: new URL(getNetworkConfig().nodeUrl),
    provingServerUrl: new URL(getNetworkConfig().proofServer),
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
  await Rx.firstValueFrom(facade.state().pipe(Rx.filter((s: any) => s.isSynced)));
  
  return { 
    wallet: facade,
    shieldedSecretKeys, 
    dustSecretKey, 
    unshieldedKeystore,
    address: unshieldedKeystore.getBech32Address().toString(),
    hexAddress: unshieldedKeystore.getAddress(),
    seed: seedHex,
    zswapKey: derivationResult.keys[Roles.Zswap],
  };
}

async function createProviders(ctx: any, config: any) {
  const privateState: MarketPrivateState = {
    userSecretKey: ctx.zswapKey,
  };
  
  const witnesses = createWitnessProviders(privateState);
  
  const walletProvider = {
    getCoinPublicKey: () => ctx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => ctx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(tx, {
        shieldedSecretKeys: ctx.shieldedSecretKeys,
        dustSecretKey: ctx.dustSecretKey,
      }, { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) });

      const signedRecipe = await ctx.wallet.signRecipe(recipe, (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload));
      return ctx.wallet.finalizeRecipe(signedRecipe) as any;
    },
    submitTx: (tx: any) => ctx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  return {
    privateStateProvider: new MemoryPrivateStateProvider(),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
    witnesses
  };
}

async function main() {
  console.log('\n+--------------------------------------------------------------+');
  console.log('|   Initialize Shadow Market Contract                          |');
  console.log('+--------------------------------------------------------------+\n');

  try {
    const config = getNetworkConfig();
    const networkId = (config.network === 'testnet') ? 'testnet' : 'undeployed';
    setNetworkId(networkId);

    // Load deployment info
    const deploymentPath = path.join(__dirname, '../deployments/shadow-market-local.json');
    if (!fs.existsSync(deploymentPath)) {
      throw new Error('Contract not deployed. Run "pnpm contracts:deploy:local" first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    const contractAddress = deployment.contractAddress;

    console.log('Contract Address:', contractAddress);
    console.log('Network:', networkId, '\n');

    // Create wallet and providers
    console.log('🔧 Initializing admin wallet and providers...');
    const seed = getAdminWalletSeed();
    const adminCtx = await initWallet(seed, networkId);

    // Fund and register admin if on local network
    if (config.network !== 'testnet') {
      console.log('  Checking admin wallet balance and DUST registration...');
      const genesisCtx = await initWallet(GENESIS_SEED, networkId);
      
      if (adminCtx.address !== genesisCtx.address) {
        await fundWallet(genesisCtx, adminCtx.hexAddress, 2_000_000_000n);
        await sleep(2000);
      }
      
      await registerForDust(adminCtx);
    }

    const providers = await createProviders(adminCtx, config);

    console.log('Admin Address:', adminCtx.address);
    console.log('Connecting to contract...');
    
    // Connect and initialize
    const api = await ShadowMarketAPI.connectWithProviders(providers as any, contractAddress);
    
    // Helper for sleep
    function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    console.log('Calling initialize() circuit...');
    await api.initialize();

    console.log('\n+--------------------------------------------------------------+');
    console.log('|                INITIALIZATION SUCCESS                        |');
    console.log('+--------------------------------------------------------------+\n');
    console.log('  Contract is now ready to use!\n');
  } catch (error: any) {
    console.error('\n+--------------------------------------------------------------+');
    console.error('|                INITIALIZATION FAILED                         |');
    console.error('+--------------------------------------------------------------+\n');
    console.error('Error:', error.message);
    if (error.stack) console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

main();
