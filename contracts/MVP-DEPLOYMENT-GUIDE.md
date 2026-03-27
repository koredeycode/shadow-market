# Shadow Market MVP Deployment Guide

## ✅ Deployed Contracts (Local Network)

All contracts successfully deployed to local Midnight network (`undeployed`):

### 1. Oracle Contract (Resolution System)

**Contract Address:** `230ffb24fa6247644e9b2db16abac9ffb9b4ccb108323dd8bdb13ace3f8f1347`
**Type:** `oracle-simple-v22`
**Circuits:** 2

- `initialize()` - Set the admin address who can resolve markets
- `resolveMarket(marketId, outcome)` - Admin submits final results (0=NO, 1=YES)

**Purpose:** Central resolution authority for prediction markets. In the MVP, a single admin can resolve market outcomes. This is simpler than multi-oracle consensus but works for local testing.

**Storage:**

- `resolvedMarkets: Map<Field, Field>` - Stores marketId → outcome mappings
- `admin Key: Bytes<32>` - Public key of admin who can resolve markets
- `isInitialized: Field` - Tracks initialization status

**⚠️ TODO:** Call `initialize()` to set admin address before using

---

### 2. Market Factory Contract (Registry)

**Contract Address:** `afe110099a10c2ed26c90f674ad90777a6984b83af3b1ba48e492764c3f6176e`
**Type:** `market-factory-simple-v22`
**Circuits:** 2

- `initialize()` - Set the factory admin
- `registerMarket(question, category, endTime)` - Track new markets (increment counter)

**Purpose:** Acts as a market registry and counter. When prediction markets are created, they register here to get a unique market ID. The frontend indexes these events to display all available markets.

**Storage:**

- `marketCount: Counter` - Total number of markets created
- `adminKey: Bytes<32>` - Factory administrator
- `isInitialized: Field` - Initialization status

**Workaround:** Since Compact 0.22 doesn't support `Map.get()`, market details (question, categories, etc.) are tracked off-chain by the frontend via event indexing. The factory just maintains the count.

**⚠️ TODO:** Call `initialize()` to set admin address

---

### 3. P2P Wager Contract (Custom Odds Betting)

**Contract Address:** `bda8d238aa7d13b6782cdce8eaba442b43496ffd1de5a59a256a804c70e3b0ce`
**Type:** `p2p-wager-simple-v22`
**Circuits:** 4

- `createWager(wagerAmount, oddsNumerator, oddsDenominator, marketId, side)` - Create custom bet offer
- `acceptWager(wagerId)` - Match someone's bet
- `settleWager(wagerId, outcome, creatorWon)` - Resolve wager after market resolves
- `cancelWager(wagerId)` - Cancel unfilled bet

**Purpose:** Enables peer-to-peer betting with custom odds (e.g., 3:1, 2:1). Users create wagers offering specific odds, others accept them. This is different from pool-based prediction markets where everyone gets the same odds.

**Storage:**

- `wagerData: Map<Field, Bytes<32>>` - Stores wager parameters (insert-only)
- `creatorData: Map<Field, Bytes<32>>` - Creator information
- `takerData: Map<Field, Bytes<32>>` - Taker information
- `statusData: Map<Field, Field>` - Wager status (0=open, 1=matched, 2=settled, 3=cancelled)

**Use Case:**

- Alice creates wager: "100 DUST on YES at 2:1 odds" for Bitcoin $100k market
- Bob accepts: "200 DUST on NO"
- If YES wins: Alice gets 300 DUST (her 100 + Bob's 200)
- If NO wins: Bob gets 300 DUST

**⚠️ TODO:** Token transfers not implemented yet (escrow system needed)

---

### 4. Prediction Market Contract (Pool-Based Betting)

**Status:** ⏳ READY TO DEPLOY (Compiled but not deployed yet)
**Type:** `prediction-market-simple-v22`
**Circuits:** 5

- `openMarket()` - Start accepting bets
- `placeBet(betAmount, side, commitment)` - Place private bet (YES=1 or NO=0)
- `lockMarket()` - Close betting (admin only)
- `resolveMarket(outcome)` - Set final result (admin only)
- `claimWinnings()` - Reveal bet and claim payout

**Purpose:** Traditional prediction market with pooled betting. All bets go into YES/NO pools. Winners split the losing pool proportionally to their stakes. Bet amounts are private (using commitments), but pool totals are public.

**Constructor Parameters:**

- `marketId: Field` - Unique identifier (from factory)
- `question: String` - e.g., "Will Bitcoin reach $100k by 2026?"
- `endTime: Field` - Unix timestamp when betting closes
- `adminKey: Bytes<32>` - Admin who can lock/resolve market

**Storage:**

- `betCommitments: Map<Bytes<32>, Bytes<32>>` - Maps user key to bet commitment (private)
- `totalYesAmount: Counter` - Public total of YES bets
- `totalNoAmount: Counter` - Public total of NO bets
- `isOpen: Field` - 1 if accepting bets
- `isLocked: Field` - 1 if betting closed
- `isResolved: Field` - 1 if outcome decided
- `winningOutcome: Field` - Final result (0 or 1)

**Betting Flow:**

1. User calls `placeBet()` with private amount and side
2. Contract increments public totalYesAmount or totalNoAmount
3. Contract stores commitment of bet details (private)
4. After market ends, admin calls `lockMarket()` and `resolveMarket()`
5. Winners call `claimWinnings()` to reveal their bet and receive payout

**Payout Formula:**

```
If YOU bet on winning side:
  payout = yourStake + (yourStake / winningPoolTotal) * losingPoolTotal
```

**⏳ TODO:** Deploy this contract (will be the 4th contract)

---

## 🏗️ Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER FRONTEND (UI)                     │
│  - Browse markets                                            │
│  - Create prediction markets                                 │
│  - Place bets (pool or P2P)                                  │
│  - Track positions                                           │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────┐
│   MARKET FACTORY         │  │   P2P WAGER CONTRACT       │
│   (Registry/Counter)     │  │   (Custom Odds)            │
│                          │  │                            │
│  • registerMarket()      │  │  • createWager()           │
│  • marketCount           │  │  • acceptWager()           │
│                          │  │  • settleWager()           │
└───────────┬──────────────┘  └────────────┬───────────────┘
            │                               │
            │ marketId                      │ references
            ▼                               │ marketId
┌──────────────────────────┐                │
│  PREDICTION MARKET       │◄──────────────────────────────┘
│  (Pool-Based Betting)    │
│                          │
│  • openMarket()          │
│  • placeBet()            │
│  • lockMarket()          │
│  • resolveMarket()       │──┐
│  • claimWinnings()       │  │
└──────────────────────────┘  │
                               │ outcome?
                               ▼
                ┌──────────────────────────┐
                │   ORACLE CONTRACT        │
                │   (Resolution Authority) │
                │                          │
                │  • resolveMarket()       │
                │  • resolvedMarkets       │
                └──────────────────────────┘
```

---

## 🔄 Integration Flow

### Creating a Market

1. **Frontend** → **Factory**: Call `registerMarket("Will BTC hit $100k?", "crypto", endTime)`
2. **Factory**: Increments `marketCount`, emits event with market details
3. **Frontend**: Indexes event, gets new `marketId`
4. **Frontend**: Deploys new **Prediction Market** contract instance with `marketId`
5. **Admin**: Calls `openMarket()` on new contract

### Placing Pool-Based Bet

1. **User** → **Prediction Market**: `placeBet(1000n, 1)` // 1000 DUST on YES
2. **Contract**: Increments `totalYesAmount` by 1000
3. **Contract**: Stores commitment of bet details (private)
4. **Frontend**: Shows updated pool totals to all users

### Placing P2P Wager

1. **Alice** → **P2P Contract**: `createWager(100n, 2n, 1n, marketId, 1)` // 2:1 odds on YES
2. **Contract**: Stores wager with status=OPEN
3. **Bob** → **P2P Contract**: `acceptWager(wagerId)`
4. **Contract**: Updates wager status=MATCHED
5. **Frontend**: Both parties see matched wager

### Resolving Markets

1. **Admin** → **Oracle**: `resolveMarket(marketId, 1)` // YES wins
2. **Oracle**: Stores `resolvedMarkets[marketId] = 1`
3. **Admin** (or anyone) → **Prediction Market**: `resolveMarket(1)`
4. **Contract**: Sets `winningOutcome = 1`, `isResolved = 1`
5. **Winners** → **Prediction Market**: `claimWinnings()`
6. **Contract**: Reads commitment, verifies, pays out

### Settling P2P Wagers

1. **Anyone** → **P2P Contract**: `settleWager(wagerId, 1, true)` // outcome=YES, creator=YES
2. **Contract**: Verifies outcome from Oracle (off-chain check for MVP)
3. **Contract**: Sets status=SETTLED
4. **Winner**: Receives escrowed tokens (TODO: implement token transfers)

---

## 🎯 Key Design Decisions

### Why 4 Contracts?

- **Oracle**: Separates resolution authority from markets (reusable)
- **Factory**: Centralizes market tracking and ID generation
- **Prediction Market**: Classic pool-based betting model
- **P2P Wager**: Adds custom odds and direct matching

### Compact 0.22 Limitations Workarounds

| Feature Unavailable   | Workaround Used                                                           |
| --------------------- | ------------------------------------------------------------------------- |
| `Map.get()`           | Frontend indexes events and tracks off-chain                              |
| `Bool` type           | Use `Field` with 0/1 values                                               |
| `publicKey()`         | Use `persistentHash()` for user IDs                                       |
| Division `/`          | Use scaled multiplication                                                 |
| Inline `if`           | Use mathematical conditionals `(condition) * this + (1-condition) * that` |
| Circuit return values | Ledger-only updates, frontend reads state                                 |

### Privacy Features

- **Bet amounts**: Private (using commitments)
- **Pool totals**: Public (necessary for odds calculation)
- **User identities**: Private (persistent hashes, not addresses)
- **Market results**: Public (necessary for settlement)

---

## 📝 Next Steps

### Immediate (Required for MVP)

1. ☐ Call `initialize()` on Oracle contract (set admin)
2. ☐ Call `initialize()` on Factory contract (set admin)
3. ☐ Deploy Prediction Market contract instance
4. ☐ Test full lifecycle:
   - Create market via factory
   - Place some test bets
   - Resolve via oracle
   - Claim winnings

### Frontend Integration

1. ☐ Connect to all 4 deployed contracts
2. ☐ Index factory events to list markets
3. ☐ Build betting UI (pool + P2P tabs)
4. ☐ Show real-time pool totals
5. ☐ Display user's positions (bets + wagers)
6. ☐ Track resolutions and payouts

### Testing Scenarios

1. ☐ **Happy Path**: Create → Bet → Resolve → Claim
2. ☐ **Multiple Bets**: Multiple users betting on same market
3. ☐ **P2P Matching**: Create wager, accept, settle
4. ☐ **Edge Cases**: Cancel wager, claim with no balance, etc.

### Future Enhancements

1. ☐ Token escrow system for P2P wagers
2. ☐ Multi-oracle consensus (when Compact 0.29 stable)
3. ☐ Liquidity pools with dynamic odds
4. ☐ Market categories and filtering
5. ☐ Historical data and analytics
6. ☐ Reputation system for oracle admins
7. ☐ Dispute resolution mechanism

---

## 🔧 Deployment Commands

```bash
# Compile all MVP contracts
pnpm compile:oracle-simple
pnpm compile:factory-simple
pnpm compile:prediction-simple
pnpm compile:p2p-simple

# Deploy contracts (already done ✅)
pnpm deploy:oracle   # ✅ Done
pnpm deploy:factory  # ✅ Done
pnpm deploy:p2p      # ✅ Done

# Deploy prediction market (TODO)
# Need to create deployment script similar to deploy-local-test.ts
```

---

## 📦 Contract Addresses (Local Network)

Save these for frontend integration:

```typescript
export const CONTRACTS = {
  oracle: '230ffb24fa6247644e9b2db16abac9ffb9b4ccb108323dd8bdb13ace3f8f1347',
  factory: 'afe110099a10c2ed26c90f674ad90777a6984b83af3b1ba48e492764c3f6176e',
  p2pWager: 'bda8d238aa7d13b6782cdce8eaba442b43496ffd1de5a59a256a804c70e3b0ce',
  // predictionMarket: "TODO - deploy instance with specific market params"
};
```

---

## 🔐 Security Notes

**FOR LOCAL TESTING ONLY - NOT PRODUCTION READY**

- Using genesis master wallet (seed: 0x00...001)
- No access control beyond basic admin checks
- Token transfers not implemented (P2P wagers)
- No formal security audit
- Compact 0.22 has known limitations
- Private state password is hardcoded

**Do not use with real funds on production networks!**

---

## 📚 Additional Resources

- **Contract Source**: `contracts/src/*-simple-v22.compact`
- **Deployment Scripts**: `contracts/src/deploy-*-local.ts`
- **Compiled Assets**: `contracts/src/managed/*-simple-v22/`
- **Deployment Records**: `contracts/deployments/*.json`
- **Utils**: `contracts/src/utils.ts` (wallet, providers, config)

---

Generated: 2026-03-27  
Network: Midnight Local Dev (`undeployed`)  
Compact Version: 0.22.0  
SDK Version: 2.0.0
