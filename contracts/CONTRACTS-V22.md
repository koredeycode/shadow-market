# Shadow Market - Compact 0.22 Contracts

Backported prediction market contracts compatible with Compact 0.22 for immediate deployment.

## Contracts Overview

### 1. **oracle-v22.compact** 🔮

Decentralized oracle system for market resolution.

**Features:**

- Oracle registration with stake requirement (min 1000 DUST)
- Reputation-based weighted voting (0-1000 scale)
- Consensus outcome calculation
- Reputation updates based on accuracy
- Stake slashing for dishonest oracles

**Key Circuits:**

```compact
registerOracle()                              // Register as oracle (stake required)
submitOutcome(marketId, outcome, confidence)  // Submit market outcome (0=NO, 1=YES)
resolveMarket(marketId)                       // Calculate consensus outcome
getOutcome(marketId)                          // Get resolved outcome
updateOracleReputation(marketId, address, wasCorrect) // Update reputation
```

---

### 2. **market-factory-v22.compact** 🏭

Factory contract for creating and tracking prediction markets.

**Features:**

- Register new prediction markets
- Track all markets by ID
- Store market metadata (question, end time, status)
- Track markets by creator
- Market status management

**Key Circuits:**

```compact
registerMarket(address, question, category, endTime, minBet, maxBet) // Register new market
getMarketAddress(marketId)        // Get market contract address
getMarketInfo(marketId)          // Get question, endTime, status
updateMarketStatus(marketId, status) // Update market state
getCreatorMarkets(creator)       // Get markets by creator
getTotalMarkets()                // Get total market count
```

---

### 3. **prediction-market-v22.compact** 📊

Individual prediction market with AMM-based betting.

**Features:**

- Binary markets (YES/NO only)
- Private bet amounts via ZK commitments
- AMM pricing (constant product: x \* y = k)
- Dynamic odds based on liquidity
- Reveal-to-claim payout system

**Market Lifecycle:**

```
PENDING → openMarket() → OPEN → placeBet() → LOCKED → resolveMarket() → RESOLVED → claimWinnings()
```

**Key Circuits:**

```compact
openMarket()                // Start accepting bets (PENDING → OPEN)
placeBet()                  // Place private bet with commitment
lockMarket()                // Close betting (OPEN → LOCKED)
resolveMarket(outcome)      // Set winner from oracle (LOCKED → RESOLVED)
claimWinnings()            // Reveal bet and claim payout (winners only)
getCurrentOdds()           // Get current YES/NO odds
getUserBet(address)        // Check if user has bet
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         1. Deploy oracle-v22                │
│    (Shared resolution system)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      2. Deploy market-factory-v22           │
│    (Central market registry)                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   3. Register Markets via Factory           │
│    - Deploy prediction-market-v22           │
│    - Call factory.registerMarket()          │
│    - Repeat for each new market             │
└─────────────────────────────────────────────┘
```

---

## Compile Contracts

```bash
# Compile individual contracts
pnpm compile:oracle      # Oracle system
pnpm compile:factory     # Market factory
pnpm compile:prediction  # Prediction market

# Compile all at once
pnpm compile:all
```

---

## Deployment Steps

### Step 1: Deploy Oracle

```bash
# Edit deploy-oracle.ts with your network config
pnpm deploy:oracle
```

Save the oracle contract address!

### Step 2: Deploy Market Factory

```bash
# Edit deploy-factory.ts
pnpm deploy:factory
```

Save the factory contract address!

### Step 3: Create a Market

```bash
# Deploy prediction-market contract
pnpm deploy:prediction

# Register it with factory (call registerMarket circuit)
# Frontend would do this automatically
```

---

## Usage Flow

### For Platform Operators:

1. Deploy oracle contract once
2. Deploy factory contract once
3. Register multiple oracles (call `oracle.registerOracle()`)

### For Market Creators:

1. Deploy new `prediction-market-v22` contract
2. Call `factory.registerMarket()` with contract address and metadata
3. Call `market.openMarket()` to start accepting bets

### For Bettors:

1. Query `factory.getMarketInfo(marketId)` for market details
2. Query `market.getCurrentOdds()` for current pricing
3. Call `market.placeBet()` with commitment (private amount)
4. After resolution, call `market.claimWinnings()` if won

### For Oracles:

1. Monitor markets via `factory` contract
2. When market reaches `endTime`, call `market.lockMarket()`
3. Submit outcome via `oracle.submitOutcome(marketId, outcome, confidence)`
4. When threshold reached, call `oracle.resolveMarket(marketId)`
5. Call `market.resolveMarket(outcome)` with consensus result

---

## Key Differences from 0.29 Syntax

✅ **What Works:**

- All core functionality preserved
- AMM pricing intact
- Private commitments working
- Oracle consensus working

⚠️ **Compromises Made:**

- `Address` type → `Bytes<32>`
- `ContractAddress` → `Bytes<32>`
- Simplified timestamp handling (no `currentTime()` function)
- No automatic contract deployment (factory can't deploy, only register)
- Limited vector iteration (frontend filters instead)

---

## Testing Locally

```bash
# Start local network (in midnight-local-dev)
cd ../midnight-local-dev
pnpm start

# Compile contracts
pnpm compile:all

# Build TypeScript
pnpm build

# Deploy oracle
pnpm deploy:oracle:local

# Deploy factory
pnpm deploy:factory:local

# Deploy first market
pnpm deploy:prediction:local
```

---

## Next Steps

1. **Create deployment scripts** similar to `deploy-local-test.ts` for:
   - `deploy-oracle.ts`
   - `deploy-factory.ts`
   - `deploy-prediction.ts`

2. **Create witnesses** similar to `witnesses.ts` for each contract

3. **Update frontend** to interact with factory → prediction-market flow

4. **Test full lifecycle**:
   - Create market via factory
   - Place bets
   - Lock after endTime
   - Oracle resolution
   - Winners claim payouts

---

## Contract Addresses (Local Network)

After deployment, save these:

```
Oracle Contract:      [deployed address]
Factory Contract:     [deployed address]
Market 1 Contract:    [deployed address]
Market 2 Contract:    [deployed address]
```

Keep track in `deployments/local-contracts.json`
