# Shadow Market: Headless SDK (`packages/api`)

The **Shadow Market SDK** is the core logic engine that manages all on-chain interactions and off-chain state synchronization. It is a "headless" library, meaning it has no UI but provides the business rules for the Web, CLI, and Backend.

---

## 🛠️ Components

### 1. **Handlers**
A collection of state machines that manage complex multi-transaction flows:
- `createMarket`: Circuit for creating a new prediction market.
- `placeWager`: Circuit for placing a private bet on an outcome.
- `claimWinnings`: Circuit for proving and claiming winnings via ZK.

### 2. **Witnesses**
Private data generators for Midnight's ZKP circuits.

### 3. **Providers**
Abstractions for:
- **WalletProvider**: Handles signing and private key management.
- **NetworkProvider**: Connects to the Midnight devnet/testnet.
- **StoreProvider**: Maps on-chain IDs to off-chain metadata.

---

## 🧪 Usage in Other Packages

The SDK exports all necessary types and functions for direct use in the Web, TUI, and Backend.

```typescript
import { ShadowMarketAPI } from '@shadow-market/api';

const sdk = new ShadowMarketAPI(config);
await sdk.createMarket({ outcomeCount: 2, expiry: ... });
```

---

## 🏗️ Development

To build the SDK:
```bash
pnpm build
```

To run tests:
```bash
pnpm test
```
