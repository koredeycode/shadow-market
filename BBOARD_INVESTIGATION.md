# How BBoard UI Implements Contract Integration

## Key Discovery: Monorepo Workspace Pattern

After investigating the `example-bboard-clone`, here's how they structure the contract integration:

## 1. **Workspace Structure**

### BBoard Example:

```
example-bboard-clone/
├── package.json          # ROOT - All Midnight SDK packages installed HERE
├── api/                  # API wrapper layer
├── bboard-ui/            # Frontend UI (no Midnight deps in package.json)
├── contract/             # Compiled Compact contracts
└── bboard-cli/           # CLI tools
```

### Shadow Market (Current):

```
shadow-market/
├── package.json          # ROOT - Midnight packages SHOULD be here
├── pnpm-workspace.yaml   # ✅ Already configured
├── frontend/             # ❌ Trying to install Midnight deps here (won't work)
├── backend/              # ❌ Trying to install Midnight deps here (won't work)
├── api/                  # Should be API wrapper
└── contracts/            # Contract bindings
```

## 2. **Dependency Management Pattern**

### BBoard Root `package.json`:

```json
{
  "name": "@midnight-ntwrk/example-bboard",
  "workspaces": {
    "packages": ["bboard-cli", "bboard-ui", "api", "contract"]
  },
  "dependencies": {
    "@midnight-ntwrk/dapp-connector-api": "4.0.0",
    "@midnight-ntwrk/ledger-v7": "7.0.0",
    "@midnight-ntwrk/midnight-js-compact": "3.0.0",
    "@midnight-ntwrk/midnight-js-contracts": "3.0.0",
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider": "3.0.0",
    "@midnight-ntwrk/midnight-js-http-client-proof-provider": "3.0.0",
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider": "3.0.0",
    "@midnight-ntwrk/midnight-js-level-private-state-provider": "3.0.0",
    "@midnight-ntwrk/midnight-js-types": "3.0.0",
    "@midnight-ntwrk/midnight-js-utils": "3.0.0"
    // ... more
  }
}
```

### BBoard UI `package.json`:

```json
{
  "name": "@midnight-ntwrk/bboard-ui",
  "dependencies": {
    // NO MIDNIGHT PACKAGES HERE
    // They're hoisted from root
    "@mui/material": "^7.3.8",
    "react": "^19.2.4"
    // ...
  }
}
```

## 3. **Architecture Layers**

### Layer 1: Contract (Compact Code)

```
contracts/src/bboard.compact
  ↓ (compile)
contracts/src/managed/bboard/contract/index.js
```

### Layer 2: API Wrapper (`api/` package)

```typescript
// api/src/index.ts
import * as BBoard from '../../contract/src/managed/bboard/contract/index.js';
import { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

export class BBoardAPI {
  constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders
  ) {
    // Wrap contract interactions
  }

  async post(message: string): Promise<void> {
    // Call contract circuit
  }
}
```

### Layer 3: React Context (`bboard-ui/src/contexts/`)

```typescript
// BrowserDeployedBoardManager.ts
import { BBoardAPI } from '../../../api/src/index';
import { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export class BrowserDeployedBoardManager {
  // Manages contract instances
  // Provides them to React components via Context
}
```

### Layer 4: React Components (`bboard-ui/src/components/`)

```typescript
// Components use the context
const { api } = useDeployedBoardContext();
await api.post(message);
```

## 4. **How They Handle Wallet Connection**

### BrowserDeployedBoardManager Implementation:

```typescript
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

// When wallet connects:
const connectedAPI = await initialAPI.connect(networkId);

// Create providers for contract
const providers = {
  privateStateProvider: inMemoryPrivateStateProvider(),
  publicDataProvider: indexerPublicDataProvider(indexerUrl),
  proofProvider: httpClientProofProvider(proofServerUrl),
  zkConfigProvider: new FetchZkConfigProvider(proofServerUrl),
};

// Create contract API
const api = new BBoardAPI(deployedContract, providers);
```

## 5. **Key Files Structure**

### BBoard Example:

```
api/
  src/
    index.ts              # Main API exports (BBoardAPI class)
    common-types.ts       # Shared types
    utils/                # Helper functions

bboard-ui/
  src/
    contexts/
      DeployedBoardContext.tsx         # React Context
      BrowserDeployedBoardManager.ts   # Contract manager
    hooks/
      useDeployedBoardContext.ts       # React hook
    components/
      Board.tsx                         # UI component using hook
    in-memory-private-state-provider.ts # Private state management
```

### What Shadow Market Needs:

```
api/                      # ❌ MISSING - Need to create
  src/
    index.ts              # Export market contract API
    market-api.ts         # Wrap unified contract
    common-types.ts       # Types

frontend/
  src/
    contexts/
      ContractContext.tsx           # Similar to DeployedBoardContext
      BrowserContractManager.ts     # Similar to BrowserDeployedBoardManager
    hooks/
      useContract.ts                # Use context
```

## 6. **The Critical Fix Needed**

### Current Problem:

```bash
# In frontend/
npm install @midnight-ntwrk/compact-runtime  # ❌ FAILS - packages not public
```

### BBoard Solution:

```bash
# At ROOT level (shadow-market/)
pnpm add -w @midnight-ntwrk/compact-runtime
pnpm add -w @midnight-ntwrk/midnight-js-types
pnpm add -w @midnight-ntwrk/midnight-js-indexer-public-data-provider
pnpm add -w @midnight-ntwrk/midnight-js-http-client-proof-provider
# etc...
```

The `-w` flag installs at workspace root, making packages available to ALL workspace packages.

## 7. **Why This Pattern Works**

1. **Dependency Deduplication**: All packages share the same Midnight SDK version
2. **Easier Updates**: Update SDK once at root, all packages get it
3. **Type Safety**: TypeScript can find types across workspace packages
4. **Build Optimization**: Single copy of large packages
5. **Better for Monorepos**: Standard pattern for pnpm/yarn/npm workspaces

## 8. **Implementation Steps for Shadow Market**

### Step 1: Update root package.json

```bash
cd /home/yusufakoredey/Desktop/midnight/shadow-market

# Add Midnight SDK packages at ROOT
pnpm add -w @midnight-ntwrk/compact-runtime@0.15.0
pnpm add -w @midnight-ntwrk/midnight-js-types@3.0.0
pnpm add -w @midnight-ntwrk/midnight-js-indexer-public-data-provider@3.0.0
pnpm add -w @midnight-ntwrk/midnight-js-http-client-proof-provider@3.0.0
pnpm add -w @midnight-ntwrk/midnight-js-fetch-zk-config-provider@3.0.0
pnpm add -w @midnight-ntwrk/midnight-js-contracts@3.0.0
pnpm add -w @midnight-ntwrk/midnight-js-utils@3.0.0
pnpm add -w @midnight-ntwrk/dapp-connector-api@4.0.0
pnpm add -w @midnight-ntwrk/ledger-v7@7.0.0
```

### Step 2: Create API wrapper package

```typescript
// api/src/index.ts
import * as UnifiedMarket from '../../contracts/src/managed/unified-prediction-market/contract';
import { Contract } from '@midnight-ntwrk/compact-runtime';

export class MarketContractAPI {
  // Wrap contract methods
}
```

### Step 3: Update frontend to use API package

```typescript
// frontend/src/services/contract.service.ts
import { MarketContractAPI } from '@shadow-market/api';
```

### Step 4: Remove stub, restore real implementation

```bash
mv frontend/src/services/contract.service.ts.bak frontend/src/services/contract.service.ts
```

## 9. **Alternative: Use Private Registry**

If Midnight SDK packages are in a private registry:

```bash
# Configure npm/pnpm to use private registry
pnpm config set @midnight-ntwrk:registry https://private-registry-url

# Or use .npmrc
echo "@midnight-ntwrk:registry=https://private-registry-url" >> .npmrc
```

## Summary

**Key Insight**: BBoard doesn't install Midnight packages in individual workspace packages. They install everything at the ROOT level and leverage pnpm workspace hoisting. This is the standard monorepo pattern and exactly what Shadow Market should do.

**Action Required**: Install Midnight SDK packages at shadow-market root level with `-w` flag, then all packages (frontend, backend, api) can import them.
