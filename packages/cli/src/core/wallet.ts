import * as bip39 from '@scure/bip39';
import { createWitnessProviders, ShadowMarketAPI } from '@shadow-market/api';
import Conf from 'conf';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WalletManager - Optimized for CLI startup speed.
 * Heavy Midnight SDK dependencies are loaded lazily.
 */
class WalletManager {
  private config = new Conf({ 
    projectName: 'shadow-market',
    projectSuffix: '', // No -nodejs suffix
  });
  private api: ShadowMarketAPI | null = null;
  private currentContext: any = null;

  getSession(): any {
    return this.config.get('session');
  }

  setLinkedSession(token: string, address: string) {
    const session = this.config.get('session') as any;
    this.config.set('session', {
      ...session,
      address, // Update to the authorized address from backend
      token,
      linked: true
    });
  }

  isLoggedIn(): boolean {
    const session = this.config.get('session') as any;
    return !!(session && session.seed);
  }

  isLinked(): boolean {
    const session = this.config.get('session') as any;
    return !!(session && session.linked && session.token);
  }

  getAddress(): string {
    const session = this.config.get('session') as any;
    return session?.address || 'Unknown';
  }

  async login(method: string, data: string): Promise<boolean> {
    try {
      let seedHex = '';
      let mnemonic = '';
      const normalizedMethod = method.toLowerCase();

      if (normalizedMethod === 'mnemonic') {
        const seed = bip39.mnemonicToSeedSync(data);
        const { toHex } = await import('@midnight-ntwrk/midnight-js-utils');
        seedHex = toHex(seed);
        mnemonic = data;
      } else if (normalizedMethod === 'hex' || normalizedMethod === 'key') {
        seedHex = data;
      } else if (normalizedMethod === 'env') {
        seedHex = process.env.ADMIN_SEED || '';
        mnemonic = process.env.ADMIN_MNEMONIC || '';
        if (!seedHex) throw new Error('ADMIN_SEED not found in .env');
      }

      const ctx = await this.initWallet(seedHex);
      
      const currentSession = this.config.get('session') as any;
      this.config.set('session', {
        ...currentSession,
        address: ctx.address,
        seed: seedHex,
        mnemonic: mnemonic
      });

      this.currentContext = ctx;
      return true;
    } catch (err: any) {
      console.error('Login error:', err.message);
      return false;
    }
  }

  logout(): void {
    this.config.delete('session');
    this.api = null;
    this.currentContext = null;
  }

  async getStatus(): Promise<any> {
    if (!this.currentContext && this.isLoggedIn()) {
      await this.login('hex', this.config.get('session.seed') as string);
    }
    if (!this.currentContext) throw new Error('Not logged in');

    const [ledger, state] = await Promise.all([
      import('@midnight-ntwrk/ledger-v8'),
      Rx.firstValueFrom(this.currentContext.wallet.state()) as any
    ]);

    return {
      address: this.currentContext.address,
      network: this.currentContext.networkId,
      balance: state.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n,
      dust: state.dust.balance(new Date()) ?? 0n,
      isSynced: state.isSynced
    };
  }

  async getAPI(): Promise<ShadowMarketAPI> {
    if (this.api) return this.api;
    if (!this.currentContext && this.isLoggedIn()) {
       await this.login('hex', this.config.get('session.seed') as string);
    }
    if (!this.currentContext) throw new Error('Not logged in');

    const providers = await this.createMarketProviders(this.currentContext);
    const contractAddress = process.env.MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error('Contract address not found in environment');
    
    this.api = await ShadowMarketAPI.connectWithProviders(providers as any, contractAddress as any);
    return this.api;
  }

  private async initWallet(seedHex: string) {
    const [
      ledger,
      { fromHex },
      { HDWallet, Roles },
      { setNetworkId },
      { createKeystore, InMemoryTransactionHistoryStorage, PublicKey, UnshieldedWallet },
      { ShieldedWallet },
      { DustWallet },
      { WalletFacade }
    ] = await Promise.all([
      import('@midnight-ntwrk/ledger-v8'),
      import('@midnight-ntwrk/midnight-js-utils'),
      import('@midnight-ntwrk/wallet-sdk-hd'),
      import('@midnight-ntwrk/midnight-js-network-id'),
      import('@midnight-ntwrk/wallet-sdk-unshielded-wallet'),
      import('@midnight-ntwrk/wallet-sdk-shielded'),
      import('@midnight-ntwrk/wallet-sdk-dust-wallet'),
      import('@midnight-ntwrk/wallet-sdk-facade')
    ]);

    const seed = fromHex(seedHex);
    const hdWallet = HDWallet.fromSeed(seed);
    if (hdWallet.type !== 'seedOk') throw new Error('Failed to derive HDWallet from seed');

    const derivationResult = (hdWallet.hdWallet as any)
      .selectAccount(0)
      .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
      .deriveKeysAt(0);

    if (derivationResult.type !== 'keysDerived') throw new Error('Failed to derive keys');

    const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivationResult.keys[Roles.Zswap]);
    const dustSecretKey = ledger.DustSecretKey.fromSeed(derivationResult.keys[Roles.Dust]);
    const unshieldedSecretKey = derivationResult.keys[Roles.NightExternal];
    
    const networkId = (process.env.MIDNIGHT_NETWORK_ID || process.env.NETWORK_ID || 'undeployed') as any;
    setNetworkId(networkId);
    
    const baseConfiguration = {
      networkId: networkId,
      costParameters: { additionalFeeOverhead: 1_000_000_000n, feeBlocksMargin: 5 },
      indexerClientConnection: { 
        indexerHttpUrl: process.env.MIDNIGHT_INDEXER_URL || 'http://localhost:8088/api/v4/graphql', 
        indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS || 'ws://localhost:8088/api/v4/graphql/ws'
      },
      relayURL: new URL(process.env.MIDNIGHT_NODE_URL || 'http://localhost:9944'),
      provingServerUrl: new URL(process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300'),
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    };

    const unshieldedKeystore = createKeystore(unshieldedSecretKey, networkId);
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
      zswapKey: derivationResult.keys[Roles.Zswap],
      networkId
    };
  }

  private async createMarketProviders(ctx: any) {
    const [
      { indexerPublicDataProvider },
      { httpClientProofProvider },
      { NodeZkConfigProvider },
      { FetchZkConfigProvider },
      { levelPrivateStateProvider }
    ] = await Promise.all([
      import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
      import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
      import('@midnight-ntwrk/midnight-js-node-zk-config-provider'),
      import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
      import('@midnight-ntwrk/midnight-js-level-private-state-provider')
    ]);

    const witnesses = createWitnessProviders({ userSecretKey: ctx.zswapKey, bets: {} });
    
    // ZK Config handling (Remote URL only for portability)
    // Always fetch from the frontend public folder to ensure consistency across environments
    const zkConfigUrl = 'http://localhost:5173/zk-config';
    const zkConfigProvider = new FetchZkConfigProvider(zkConfigUrl, fetch);

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

    return {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: `shadow-market-cli-v2-${ctx.address}`,
        privateStoragePasswordProvider: () => Promise.resolve('ShadowCLI-Secure-v2'),
        accountId: ctx.address,
      }),
      publicDataProvider: indexerPublicDataProvider(
        process.env.MIDNIGHT_INDEXER_URL || 'http://localhost:8088/api/v4/graphql',
        process.env.MIDNIGHT_INDEXER_WS || 'ws://localhost:8088/api/v4/graphql/ws'
      ),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(
        process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
        zkConfigProvider
      ),
      walletProvider,
      midnightProvider: walletProvider,
      witnesses
    };
  }
}

export const walletManager = new WalletManager();
