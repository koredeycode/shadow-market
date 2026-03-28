/**
 * Deploy Shadow Market contract to Midnight Local/Preprod network
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';

// Midnight SDK imports
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

// Shared config
import { getAdminWalletSeed, getNetworkConfig } from './config.js';
import { ShadowMarketAPI } from '../../api/src/index.js';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const NETWORK_CONFIG = getNetworkConfig();
setNetworkId(NETWORK_CONFIG.network === 'local' ? 'undeployed' : 'testnet');

const CONFIG = {
  indexer: NETWORK_CONFIG.indexer,
  indexerWS: NETWORK_CONFIG.indexerWS,
  node: NETWORK_CONFIG.nodeUrl,
  proofServer: NETWORK_CONFIG.proofServer,
  faucetUrl: 'http://localhost:8080', // Default local faucet
};

// --- Proof Server Health Check ---

async function waitForProofServer(maxAttempts = 30, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(CONFIG.proofServer, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return true;
    } catch (err: any) {
      const errMsg = err?.cause?.code || err?.code || '';
      if (errMsg !== 'ECONNREFUSED' && errMsg !== 'UND_ERR_CONNECT_TIMEOUT') {
        return true;
      }
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  Waiting for proof server... (${attempt}/${maxAttempts})   `);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'src', 'managed', 'shadow-market');

// Load compiled contract
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

// Check if contract is compiled
if (!fs.existsSync(contractPath)) {
  console.error('\nContract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const ShadowMarket = await import(pathToFileURL(contractPath).href);

// Witnesses for ShadowMarket
const witnesses = {
  userSecretKey: ({ privateState }: any): [any, Uint8Array] => [
    privateState,
    privateState.userSecretKey,
  ],
  betAmount: ({ privateState }: any): [any, bigint] => [privateState, 1000n], // Default/Placeholder
  betSide: ({ privateState }: any): [any, bigint] => [privateState, 1n],
  betNonce: ({ privateState }: any): [any, Uint8Array] => [
    privateState,
    new Uint8Array(32).fill(0),
  ],
  wagerAmountInput: ({ privateState }: any): [any, bigint] => [privateState, 1000n],
  callerAddress: ({ privateState }: any): [any, Uint8Array] => [
    privateState,
    new Uint8Array(32).fill(0), // Placeholder - usually derived from wallet
  ],
};

const compiledContract = CompiledContract.make('shadow-market', ShadowMarket.Contract).pipe(
  // @ts-ignore - Witness type mismatch
  CompiledContract.withWitnesses(witnesses as any),
  CompiledContract.withCompiledFileAssets(zkConfigPath)
);

// --- Wallet Functions ---

const baseConfiguration = {
  networkId: NETWORK_CONFIG.network === 'local' ? ('undeployed' as const) : ('testnet' as const),
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
  indexerClientConnection: {
    indexerHttpUrl: CONFIG.indexer,
    indexerWsUrl: CONFIG.indexerWS,
  },
};

// --- Wallet Functions ---

async function initWalletWithSeed(seed: Uint8Array) {
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') {
    throw new Error('Failed to initialize HDWallet');
  }

  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (derivationResult.type !== 'keysDerived') {
    throw new Error('Failed to derive keys');
  }

  hdWallet.hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivationResult.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derivationResult.keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(
    derivationResult.keys[Roles.NightExternal],
    baseConfiguration.networkId
  );

  const shieldedWallet = (await import('@midnight-ntwrk/wallet-sdk-shielded'))
    .ShieldedWallet(baseConfiguration)
    .startWithSecretKeys(shieldedSecretKeys);
  const dustWallet = (await import('@midnight-ntwrk/wallet-sdk-dust-wallet'))
    .DustWallet(baseConfiguration)
    .startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);

  const unshieldedPublicKey = (
    await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet')
  ).PublicKey.fromKeyStore(unshieldedKeystore);
  const unshieldedWallet = UnshieldedWallet({
    ...baseConfiguration,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  }).startWithPublicKey(unshieldedPublicKey);

  const facade = await WalletFacade.init({
    configuration: {
      ...baseConfiguration,
      relayURL: new URL(CONFIG.node),
      provingServerUrl: new URL(CONFIG.proofServer),
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    },
    shielded: async () => shieldedWallet,
    unshielded: async () => unshieldedWallet,
    dust: async () => dustWallet,
  });

  await facade.start(shieldedSecretKeys, dustSecretKey);
  return { wallet: facade, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

// Workaround for wallet SDK signRecipe bug
function signTransactionIntents(
  tx: { intents?: Map<number, any> },
  signFn: (payload: Uint8Array) => ledger.Signature,
  proofMarker: 'proof' | 'pre-proof'
): void {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize<
      ledger.SignatureEnabled,
      ledger.Proofish,
      ledger.PreBinding
    >('signature', proofMarker, 'pre-binding', intent.serialize());
    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: any, i: number) => cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: any, i: number) => cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
}

async function createProviders(walletCtx: Awaited<ReturnType<typeof initWalletWithSeed>>) {
  const state = await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced))
  );

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) }
      );
      const signFn = (payload: Uint8Array) =>
        (walletCtx.unshieldedKeystore as any).signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction)
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      return walletCtx.wallet.finalizeRecipe(recipe) as any;
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  } as any;

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-market-state',
      privateStoragePasswordProvider: () =>
        Promise.resolve('a-very-strong-password-at-least-16-chars-long'),
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
    }) as any,
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  } as any;
}

// --- Main Deploy Script ---

async function main() {
  console.log('\n+--------------------------------------------------------------+');
  console.log('|           Deploy Shadow Market to Midnight Network           |');
  console.log('+--------------------------------------------------------------+\n');

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    let seed = getAdminWalletSeed();

    console.log('  Creating wallet...');
    const walletCtx = await initWalletWithSeed(Buffer.from(seed.trim(), 'hex'));

    console.log('  Syncing with network...');
    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s: any) => s.isSynced)
      )
    );
    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;

    console.log(`\n  Wallet Address: ${address}`);
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    // Fund wallet if needed (for local network)
    if (balance === 0n && NETWORK_CONFIG.network === 'local') {
      console.log('─── Step: Fund Your Wallet ─────────────────────────────────────\n');
      console.log(`  Visit: ${CONFIG.faucetUrl}`);
      console.log(`  Address: ${address}\n`);
      console.log('  Waiting for funds...');

      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(10000),
          Rx.filter(s => s.isSynced),
          Rx.map(s => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
          Rx.filter(b => b > 0n)
        )
      );
      console.log('  Funds received!\n');
    }

    // Register for DUST
    console.log('─── Step: DUST Token Setup ─────────────────────────────────────\n');
    const dustState = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced))
    );

    if (dustState.dust.balance(new Date()) === 0n) {
      const nightUtxos = dustState.unshielded.availableCoins.filter(
        (c: any) => !c.meta?.registeredForDustGeneration
      );
      if (nightUtxos.length > 0) {
        console.log('  Registering for DUST generation...');
        const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
          nightUtxos,
          walletCtx.unshieldedKeystore.getPublicKey(),
          payload => walletCtx.unshieldedKeystore.signData(payload)
        );
        await walletCtx.wallet.submitTransaction(await walletCtx.wallet.finalizeRecipe(recipe));
      }

      console.log('  Waiting for DUST tokens...');
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(5000),
          Rx.filter((s: any) => s.isSynced),
          Rx.filter((s: any) => s.dust.balance(new Date()) >= 50n)
        )
      );
    }
    console.log('  DUST tokens ready!\n');

    // Deploy contract
    console.log('─── Step: Deploy Contract ──────────────────────────────────────\n');

    console.log('  Checking proof server...');
    const proofServerReady = await waitForProofServer();
    if (!proofServerReady) {
      console.log('\nProof server not responding\n');
      await walletCtx.wallet.stop();
      process.exit(1);
    }
    process.stdout.write('\r  Proof server ready!                    \n');

    console.log('  Setting up providers...');
    const providers = await createProviders(walletCtx);

    console.log('  Deploying contract...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract,
        privateStateId: 'shadowMarketState',
        initialPrivateState: { userSecretKey: new Uint8Array(32).fill(0) },
        args: [],
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('Contract deployed successfully!\n');
    console.log(`Contract Address: ${contractAddress}\n`);

    // Step: Initialize contract
    console.log('─── Step: Initialize Contract ──────────────────────────────────\n');
    console.log('  Calling on-chain initialize...\n');

    // Connect via API to call initialize
    const api = await ShadowMarketAPI.connect(
      {
        submitTransaction: providers.walletProvider.submitTx,
      } as any,
      {
        indexerUri: CONFIG.indexer,
        indexerWsUri: CONFIG.indexerWS,
        proverServerUri: CONFIG.proofServer,
        contractAddress: contractAddress as any,
        networkId: NETWORK_CONFIG.network === 'local' ? 'undeployed' : 'testnet',
      }
    );

    await api.initialize();
    console.log('Contract initialized successfully!\n');

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      seed,
      network: NETWORK_CONFIG.network,
      deployedAt: new Date().toISOString(),
    };

    const deploymentsDir = path.resolve(__dirname, '..', '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

    fs.writeFileSync(
      path.join(deploymentsDir, `shadow-market-${NETWORK_CONFIG.network}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`  Saved to deployments/shadow-market-${NETWORK_CONFIG.network}.json\n`);

    await walletCtx.wallet.stop();
  } finally {
    rl.close();
  }
}

main().catch(console.error);
