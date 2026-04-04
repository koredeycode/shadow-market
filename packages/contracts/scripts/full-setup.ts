/**
 * Full Setup Script for Shadow Market
 * 
 * Orchestrates:
 * 1. DB Reset
 * 2. Contract Compilation
 * 3. Multi-Wallet Generation & Funding (Admin + User A, B, C)
 * 4. Contract Deployment & Initialization
 * 5. Complex Data Seeding (50 Markets, Slugs, No activity)
 * 6. Environment Update (.env.local)
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';
import { execSync } from 'node:child_process';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';

// Midnight SDK imports
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  UnshieldedWallet,
  PublicKey,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

// Shared config
import { getNetworkConfig } from '../deployment/config.js';
import { ShadowMarketAPI } from '../../api/src/index.js';
import { createWitnessProviders, type MarketPrivateState } from '../../api/src/witnesses.js';

// Enable WebSocket
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'src', 'managed', 'shadow-market');
const NETWORK_CONFIG = getNetworkConfig();
const normalizedNetworkId = (NETWORK_CONFIG.network === 'testnet') ? 'testnet' : 'undeployed';
console.log(`  Detected Network: ${NETWORK_CONFIG.network} (Normalized: ${normalizedNetworkId})`);
setNetworkId(normalizedNetworkId);

const CONFIG = {
  indexer: NETWORK_CONFIG.indexer,
  indexerWS: NETWORK_CONFIG.indexerWS,
  node: NETWORK_CONFIG.nodeUrl,
  proofServer: NETWORK_CONFIG.proofServer,
  faucetUrl: 'http://localhost:8080',
};

const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const ADMIN_PRESET_SEED = 'dad7b31a5abd2ed25856fdb0c00606f70ee67f3e21c511d175c44ee3675dd3747a86bf0edcdfa9d7c9ae996b2b2f3e2fcfeda57d97ab5e1f90feddac447ed7d2';

// --- State Management ---
const STATE_FILE = path.join(__dirname, 'setup-state.json');

interface WalletInfo {
  address: string;
  seed: string;
  mnemonic: string;
}

interface SetupState {
  dbResetDone?: boolean;
  compiledDone?: boolean;
  wallets: Record<string, WalletInfo>;
  contractAddress?: string;
  initializedDone?: boolean;
  seedingMarketIndex?: number;
  activityDone?: boolean;
}

function loadState(): SetupState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { wallets: {} };
}

function saveState(state: SetupState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// --- Helper Functions ---

async function runCommand(cmd: string, cwd: string) {
  console.log(`\n  Running: ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    throw err;
  }
}

// Helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function promptStep(stepName: string, stateDone: boolean): Promise<'run' | 'skip' | 'force'> {
  const rl = createInterface({ input: stdin, output: stdout });
  const status = stateDone ? '(ALREADY DONE)' : '(PENDING)';
  const options = stateDone ? '[s]kip / [f]orce' : '[r]un / [s]kip';
  const question = `\n--- STEP: ${stepName} ${status} ---\n${options}? `;
  
  const answer = await rl.question(question);
  rl.close();
  
  const cmd = (answer || 's').toLowerCase();
  if (cmd.startsWith('r')) return 'run';
  if (cmd.startsWith('f')) return 'force';
  return 'skip';
}

// --- Backend Sync Helpers ---
const userTokens: Record<string, string> = {};
const BACKEND_URL = 'http://localhost:3000/api';

async function getTokenForUser(address: string, role?: string) {
  if (userTokens[address]) return userTokens[address];
  
  try {
    const authRes = await fetch(`${BACKEND_URL}/users/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, username: role || `user_${address.slice(-4)}` }),
    });
    
    if (!authRes.ok) return null;

    const authData = await authRes.json() as any;
    if (!authData.success) return null;
    
    const token = authData.data.token;
    
    // If it's the admin, elevate
    if (role === 'admin') {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
      await fetch(`${BACKEND_URL}/admin/auth`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
    }

    userTokens[address] = token;
    return token;
  } catch (err: any) {
    return null;
  }
}

async function syncMarketToBackend(marketData: any) {
  const token = await getTokenForUser(marketData.creatorAddress, 'admin');
  if (!token) return;
  
  try {
    await fetch(`${BACKEND_URL}/markets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...marketData,
        description: `Auto-seeded market: ${marketData.question}`,
        category: 'Crypto',
        tags: ['auto-seeded'],
        resolutionSource: 'Admin Oracle',
        maxBet: '10000000',
      }),
    });
  } catch (err: any) {
    console.error(`  ❌ Failed to sync market to backend: ${err.message}`);
  }
}

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
    indexerClientConnection: { indexerHttpUrl: CONFIG.indexer, indexerWsUrl: CONFIG.indexerWS },
    relayURL: new URL(CONFIG.node),
    provingServerUrl: new URL(CONFIG.proofServer),
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
    mnemonic: '' // Passed back if needed
  };
}

async function initWalletByMnemonic(mnemonic: string) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const seedHex = toHex(seed);
  const ctx = await initWallet(seedHex);
  return { ...ctx, mnemonic };
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

async function createProviders(ctx: any) {
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
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `shadow-market-state-${ctx.address}`,
      privateStoragePasswordProvider: () => Promise.resolve('A-strong-password-1!'),
      accountId: ctx.address,
    }),
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
    witnesses
  };
}

async function main() {
  console.log('\n🔥 SHADOW MARKET ALL-IN-ONE SETUP 🚀\n');

  const rootDir = path.resolve(__dirname, '../..');
  const backendDir = path.resolve(rootDir, 'backend');
  const contractsDir = path.resolve(rootDir, 'contracts');

  const state = loadState();
  const roles = ['admin', 'userA', 'userB', 'userC'];
  const testWallets: Record<string, any> = {};

  // 1. Reset Database
  const run1 = await promptStep('Reset Database', !!state.dbResetDone);
  if (run1 !== 'skip') {
    console.log('─── Step 1: Reset Database ─────────────────────────────────────');
    await runCommand('pnpm run db:push', backendDir);
    await runCommand('pnpm run db:clear', backendDir);
    state.dbResetDone = true;
    saveState(state);
    console.log('  Database reset and cleared.');
  }

  // 2. Compile
  const run2 = await promptStep('Compile Contracts', !!state.compiledDone);
  if (run2 !== 'skip') {
    console.log('\n─── Step 2: Compile Contracts ──────────────────────────────────');
    await runCommand('npm run compile', contractsDir);
    state.compiledDone = true;
    saveState(state);
  }

  // 3. Multi-Wallet Funding
  const run3 = await promptStep('Wallet Generation & Funding', Object.keys(state.wallets).length >= roles.length);
  if (run3 !== 'skip') {
    console.log('\n─── Step 3: Wallet Generation & Funding ────────────────────────');
    if (run3 === 'force') state.wallets = {};
    
    const genesis = await initWallet(GENESIS_SEED);
    for (const role of roles) {
      if (!state.wallets[role]) {
        let mnemonic: string;
        if (role === 'admin' && process.env.ADMIN_MNEMONIC) {
           mnemonic = process.env.ADMIN_MNEMONIC;
        } else {
           mnemonic = bip39.generateMnemonic(english, 256);
        }
        
        const ctx = await initWalletByMnemonic(mnemonic);
        testWallets[role] = ctx;
        state.wallets[role] = { address: ctx.address, seed: ctx.seed, mnemonic: ctx.mnemonic };
        console.log(`  Generated ${role}: ${ctx.address}`);
        console.log(`  Mnemonic: ${ctx.mnemonic}`);
        await fundWallet(genesis, ctx.hexAddress, 2_000_000_000n);
        await sleep(2000);
        saveState(state);
      } else {
        testWallets[role] = await initWalletByMnemonic(state.wallets[role].mnemonic);
      }
    }
    for (const role of roles) {
      await registerForDust(testWallets[role]);
      await getTokenForUser(testWallets[role].address, role);
    }
  } else {
    for (const role of roles) {
      if (state.wallets[role]) {
        testWallets[role] = await initWalletByMnemonic(state.wallets[role].mnemonic);
        await getTokenForUser(testWallets[role].address, role);
      }
    }
  }

  // 4. Deploy & Initialize
  const run4 = await promptStep('Deploy & Initialize', !!state.initializedDone);
  let contractAddress = state.contractAddress;

  if (run4 !== 'skip') {
    console.log('\n─── Step 4: Deploy & Initialize ────────────────────────────────');
    const adminCtx = testWallets.admin;
    const providers = await createProviders(adminCtx);

    if (!contractAddress || run4 === 'force') {
      const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
      const ShadowMarket = await import(pathToFileURL(contractPath).href);
      const compiledContract = CompiledContract.make('shadow-market', ShadowMarket.Contract).pipe(
        // @ts-ignore
        CompiledContract.withWitnesses(providers.witnesses),
        CompiledContract.withCompiledFileAssets(zkConfigPath)
      );

      console.log('  Deploying contract...');
      const deployed = await deployContract(providers as any, {
        compiledContract,
        privateStateId: 'shadow-market-private-state',
        initialPrivateState: { userSecretKey: new Uint8Array(32).fill(0) },
        args: [],
      } as any);

      contractAddress = deployed.deployTxData.public.contractAddress;
      state.contractAddress = contractAddress;
      state.initializedDone = false;
      state.seedingMarketIndex = 0;
      state.activityDone = false;
      saveState(state);
      console.log(`  Contract Deployed: ${contractAddress}`);
      await sleep(3000);
    }

    if (!state.initializedDone || run4 === 'force') {
      const api = await ShadowMarketAPI.connectWithProviders(providers as any, contractAddress as any);
      await api.initialize();
      state.initializedDone = true;
      saveState(state);
      console.log('  Contract Initialized!');
      await sleep(2000);
    }
  }

  // 5. Seeding
  const run5 = await promptStep('Complex Seeding', !!state.activityDone);
  if (run5 !== 'skip') {
    console.log('\n─── Step 5: Seeding 50 Markets ─────────────────────────────────');
    
    if (run5 === 'force') {
      state.seedingMarketIndex = 0;
      state.activityDone = false;
      saveState(state);
    }

    const marketQuestions: string[] = [];
    const items = ['Bitcoin', 'Ethereum', 'Cardano', 'OpenAI', 'Apple', 'Tesla', 'SpaceX', 'Federal Reserve', 'S&P 500', 'Crude Oil', 'Midnight Mainnet', 'Solana', 'Polkadot', 'Polygon', 'Chainlink', 'Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Lido'];
    const values = ['$100k', '$10k', '$5.00', 'GPT-6', 'Vision Pro 2', 'Mars Mission', 'Rate Cut', 'New Highs', 'FDA Approval', 'Mainnet Launch', '$200', '$50', '$5', 'V4 Release', 'Q3 Launch'];

    for (let i = 1; i <= 50; i++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const value = values[Math.floor(Math.random() * values.length)];
        marketQuestions.push(`Market #${i}: Will ${item} hit ${value} in 2026?`);
    }

    const adminCtx = testWallets.admin;
    const providers = await createProviders(adminCtx);
    const api = await ShadowMarketAPI.connectWithProviders(providers as any, contractAddress as any);

    let startIndex = state.seedingMarketIndex || 0;
    if (startIndex < marketQuestions.length) {
      for (let i = startIndex; i < marketQuestions.length; i++) {
          console.log(`  Creating Market ${i+1}/${marketQuestions.length}: ${marketQuestions[i]}`);
          const endTime = BigInt(Date.now() + 1000000000);
          await api.createMarket(marketQuestions[i], endTime, 1000n, adminCtx.address);
          
          await syncMarketToBackend({
            question: marketQuestions[i],
            endTime: new Date(Number(endTime)).toISOString(),
            minBet: '1000',
            onchainId: (i + 1).toString(),
            creatorAddress: adminCtx.address,
            contractAddress: contractAddress
          });

          state.seedingMarketIndex = i + 1;
          saveState(state);
      }
      console.log('  All markets created and synced to backend.');
      await sleep(5000);
    }

    state.activityDone = true;
    saveState(state);
  }

  // 6. Update .env.local
  console.log('\n─── Step 6: Update Environment ──────────────────────────────────');
  const envPath = path.resolve(rootDir, '.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  
  const updates = [
    { key: 'MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS', value: contractAddress },
    { key: 'ADMIN_ADDRESS', value: testWallets.admin.address },
    { key: 'ADMIN_SEED', value: testWallets.admin.seed },
    { key: 'ADMIN_MNEMONIC', value: testWallets.admin.mnemonic }
  ];

  for (const { key, value } of updates) {
    if (new RegExp(`${key}=`).test(envContent)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envPath, envContent);
  console.log('  .env.local updated.');

  console.log('\n💎 SETUP SUCCESSFUL 💎\n');
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Setup Failed:', error);
  process.exit(1);
});
