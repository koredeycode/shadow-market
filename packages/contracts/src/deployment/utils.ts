import { Buffer } from 'buffer';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';

// Midnight SDK imports
import * as ledger from '@midnight-ntwrk/ledger-v7';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { getNetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

// Network configurations
export const NETWORKS = {
  preprod: {
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    networkId: 'preprod',
  },
  local: {
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'http://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    networkId: 'undeployed',
  },
};

// Default to preprod, can be overridden via environment variable
const NETWORK = (process.env.MIDNIGHT_NETWORK || 'preprod') as keyof typeof NETWORKS;
export const CONFIG = NETWORKS[NETWORK];

// Set network ID
setNetworkId(CONFIG.networkId);

// Path configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Note: zkConfigPath is now passed per-contract in MVP deployment scripts
export const zkConfigPath = path.resolve(__dirname, '..', 'src', 'managed', 'shadow-market');

// --- Wallet Functions ----------------------------------------------------------

export function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');

  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');

  hdWallet.hdWallet.clear();
  return result.keys;
}

export async function createWallet(seed: string) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();

  // Derive secret keys for different wallet components
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const configuration = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: CONFIG.indexer,
      indexerWsUrl: CONFIG.indexerWS,
    },
    provingServerUrl: new URL(CONFIG.proofServer),
    relayURL: new URL(CONFIG.node.replace(/^http/, 'ws')),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  // Initialize wallet using WalletFacade.init
  const wallet = await WalletFacade.init({
    configuration,
    shielded: cfg => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys as any),
    unshielded: cfg =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: cfg =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey as any,
        ledger.LedgerParameters.initialParameters().dust
      ),
  });

  await wallet.start(shieldedSecretKeys as any, dustSecretKey as any);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

// Sign transaction intents with the wallet's private keys
export function signTransactionIntents(
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

export async function createProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  customZkConfigPath?: string
) {
  const activeZkConfigPath = customZkConfigPath || zkConfigPath;
  const state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));

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

      const signFn = (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload);

      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      }

      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(activeZkConfigPath);

  return {
    walletProvider,
    midnightProvider: {
      submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
    },
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    privateStateProvider: await levelPrivateStateProvider({
      privateStoragePasswordProvider: async () => 'dev-pw-x9k2m7n4q8',
      accountId: activeZkConfigPath,
    }),
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    zkConfigProvider,
    witnesses: {
      userSecretKey: (ctx: any): [any, Uint8Array] => [
        ctx.currentPrivateState,
        ctx.currentPrivateState.userSecretKey,
      ],
      betAmount: (ctx: any): [any, bigint] => [ctx.currentPrivateState, 1000n],
      betSide: (ctx: any): [any, bigint] => [ctx.currentPrivateState, 1n],
      betNonce: (ctx: any): [any, Uint8Array] => [
        ctx.currentPrivateState,
        new Uint8Array(32).fill(0),
      ],
      wagerAmountInput: (ctx: any): [any, bigint] => [ctx.currentPrivateState, 1000n],
      callerAddress: (ctx: any): [any, Uint8Array] => [
        ctx.currentPrivateState,
        new Uint8Array(32).fill(0),
      ],
    },
  };
}
