# Real Contract Integration Plan

## Current State

- ✅ Contract compiled: `/contracts/src/managed/unified-prediction-market/contract/index.js`
- ✅ Wallet integration working (connects, gets config, addresses)
- ✅ Simulated transactions working
- ❌ Real circuit calls not implemented

## What BBoard Does (Reference Pattern)

### 1. API Class Structure (`example-bboard-clone/api/src/index.ts`)

```typescript
export class BBoardAPI implements DeployedBBoardAPI {
  readonly deployedContract: DeployedBBoardContract;
  readonly state$: Observable<BBoardDerivedState>;

  async post(message: string): Promise<void> {
    const txData = await this.deployedContract.callTx.post(message);
  }
}
```

### 2. Contract Deployment/Finding

```typescript
// Deploy new contract
const deployedContract = await deployContract(providers, {
  compiledContract: CompiledBBoardContract,
  privateStateId: 'bboard-private-state',
  initialPrivateState: privateState,
});

// Or find existing contract
const deployedContract = await findDeployedContract(providers, {
  contractAddress: '0x...',
  compiledContract: CompiledBBoardContract,
  privateStateId: 'market-private-state',
  initialPrivateState: privateState,
});
```

### 3. Providers Required

- `publicDataProvider` - reads blockchain state
- `privateStateProvider` - manages user's private state (secret keys)
- `zkConfigProvider` - provides ZK circuit config
- `midnightProvider` - submits transactions

## Implementation Steps for Shadow Market

### Step 1: Import Required SDK Modules

```typescript
// api/src/index.ts
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import * as UnifiedMarket from '../../contracts/src/managed/unified-prediction-market/contract/index.js';
```

### Step 2: Define Private State

```typescript
// contracts/src/index.ts
export interface MarketPrivateState {
  userSecretKey: Uint8Array;
}

export const createMarketPrivateState = (secretKey: Uint8Array): MarketPrivateState => ({
  userSecretKey: secretKey,
});

export const marketPrivateStateKey = 'unified-market-private-state';
```

### Step 3: Implement Witness Providers

```typescript
// api/src/witnesses.ts
export const createWitnessProviders = (privateState: MarketPrivateState) => ({
  userSecretKey: context => [privateState, privateState.userSecretKey],
  betAmount: context => [privateState, context.betAmount], // from tx data
  betSide: context => [privateState, context.betSide],
  betNonce: context => [privateState, randomBytes(32)],
  wagerAmountInput: context => [privateState, context.wagerAmount],
});
```

### Step 4: Setup Providers from Wallet

```typescript
// api/src/providers.ts
export const createProvidersFromWallet = async (
  wallet: ConnectedAPI,
  config: DeployedUnifiedMarketConfig
): Promise<MarketProviders> => {
  const walletConfig = await wallet.getConfiguration();

  return {
    publicDataProvider: createPublicDataProvider(walletConfig),
    privateStateProvider: createPrivateStateProvider(),
    zkConfigProvider: createZkConfigProvider(config.zkConfigPath),
    midnightProvider: createMidnightProvider(walletConfig),
    walletProvider: createWalletProvider(wallet),
    witnessProvider: createWitnessProviders(privateState),
  };
};
```

### Step 5: Refactor UnifiedMarketAPI Class

```typescript
export class UnifiedMarketAPI implements DeployedUnifiedMarketAPI {
  private deployedContract: DeployedUnifiedMarketContract;
  readonly state$: Observable<MarketDerivedState>;

  private constructor(deployedContract: DeployedUnifiedMarketContract, providers: MarketProviders) {
    this.deployedContract = deployedContract;
    this.state$ = providers.publicDataProvider
      .contractStateObservable(deployedContract.deployTxData.public.contractAddress, {
        type: 'latest',
      })
      .pipe(map(state => UnifiedMarket.ledger(state.data)));
  }

  async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean): Promise<void> {
    // Real circuit call!
    const txData = await this.deployedContract.callTx.placeBet(
      BigInt(marketId),
      betOutcome ? 1n : 0n
    );

    console.log('✅ Transaction submitted:', txData.public.txHash);
  }

  static async connect(
    wallet: ConnectedAPI,
    config: DeployedUnifiedMarketConfig
  ): Promise<UnifiedMarketAPI> {
    const providers = await createProvidersFromWallet(wallet, config);
    const privateState = await getOrCreatePrivateState(providers.privateStateProvider);

    const deployedContract = await findDeployedContract(providers, {
      contractAddress: config.contractAddress,
      compiledContract: CompiledUnifiedMarketContract,
      privateStateId: marketPrivateStateKey,
      initialPrivateState: privateState,
    });

    return new UnifiedMarketAPI(deployedContract, providers);
  }
}
```

### Step 6: Update Frontend Hook

```typescript
// frontend/src/hooks/useContract.ts
const api = useRef<UnifiedMarketAPI | null>(null);

useEffect(() => {
  if (wallet && contractAddress) {
    UnifiedMarketAPI.connect(wallet, config).then(connectedAPI => {
      api.current = connectedAPI;
      setIsInitialized(true);
    });
  }
}, [wallet, contractAddress]);

const placeBet = useCallback(async (marketId, side, amount) => {
  if (!api.current) throw new Error('API not initialized');
  await api.current.placeBet(marketId, BigInt(amount), side === 'YES');
}, []);
```

## Key Differences from Simulated Approach

| Aspect           | Simulated (Current) | Real (Needed)            |
| ---------------- | ------------------- | ------------------------ |
| Transaction      | Console log         | Actual blockchain tx     |
| Proof Generation | None                | Via proof server         |
| State Updates    | Manual API calls    | Observable ledger state  |
| Private State    | None                | Managed per contract     |
| Witness Data     | Hardcoded           | Generated from context   |
| Error Handling   | Simple try/catch    | Circuit execution errors |

## Migration Checklist

- [ ] Step 1: Import SDK modules (`deployContract`, `findDeployedContract`)
- [ ] Step 2: Define `MarketPrivateState` type and create function
- [ ] Step 3: Implement witness providers for all circuits
- [ ] Step 4: Create provider factory from wallet
- [ ] Step 5: Refactor `UnifiedMarketAPI` to match bboard pattern
- [ ] Step 6: Update frontend hook to use `.connect()` pattern
- [ ] Step 7: Set up Observable state subscriptions
- [ ] Step 8: Test with devnet/testnet
- [ ] Step 9: Handle transaction failures and retries
- [ ] Step 10: Add transaction status tracking

## Estimated Effort

- Setup & Providers: 2-3 hours
- Contract Connection: 1-2 hours
- Witness Implementation: 2-3 hours
- State Management: 2-3 hours
- Testing & Debugging: 4-6 hours
- **Total: 11-17 hours**

## Resources

- BBoard Reference: `example-bboard-clone/api/src/index.ts`
- BBoard UI: `example-bboard-clone/bboard-ui/src/components/Board.tsx`
- SDK Docs: https://docs.midnight.network/
- Contract: `contracts/src/managed/unified-prediction-market/contract/index.js`
