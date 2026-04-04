# Shadow Market: Midnight Ledger (`packages/contracts`)

The **Shadow Market Ledger** contains the core business rules of the protocol and ensures all outcomes and trades are cryptographically verifiable.

---

## 📜 COMPACT Language

Shadow Market's contracts are authored in **COMPACT**, a domain-specific language for writing privacy-preserving blockchain protocols.

- **`shadow-market.compact`**: The main contract definition.
- **`src/managed`**: Automatically generated TypeScript bindings from the COMPACT file.
- **`src/witnesses.ts`**: Helper functions for generating private inputs to the circuits.

---

## 🏗️ Circuits

The Shadow Market protocol utilizes 10 distinct Zero-Knowledge circuits to manage the lifecycle of markets and wagers:

### Market Management
- **`initialize`**: Sets the admin key and marks the ledger as active.
- **`createMarket`**: Defines a new prediction market with question and resolution time.
- **`lockMarket`**: Prevents further betting on a market (Admin only).
- **`resolveMarket`**: Settlement circuit that commits to a public outcome (YES/NO).

### AMM Betting (Pools)
- **`placeBet`**: Private bet placement in the AMM pool.
- **`claimPoolWinnings`**: Proof-based claim for successful AMM bets.

### P2P Wagers (Direct)
- **`createWager`**: Creates a direct Peer-to-Peer betting offer.
- **`acceptWager`**: Matching circuit to take the opposite side of an offer.
- **`cancelWager`**: Revocation circuit for un-matched offers.
- **`claimWagerWinnings`**: Proof-based claim for successful P2P wagers.


---

## 🧪 Development

### 1. Requirements
Ensure you have the `compact` compiler installed on your system.

### 2. Compilation
To recompile the COMPACT contract and regenerate the managed assets:
```bash
./scripts/compile.sh
```

### 3. Testing
We use **Vitest** for testing the contract logic locally:
```bash
pnpm test
```

---

## 📂 Code Organization

- **`/compact`**: The original COMPACT source file.
- **`/src/managed`**: The compiler's TypeScript and circuit output.
- **`/src/test`**: Contract-level unit and integration tests.
- **`/deployments`**: JSON assets containing network-specific deployment info.
