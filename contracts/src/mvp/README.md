# Shadow Market - Production Contract

This folder contains the production-ready unified prediction market contract for Shadow Market.

## 📁 Current Contract

### Unified Prediction Market (`unified-prediction-market.compact`)

**Single contract managing:**
- Multiple prediction markets
- Pool betting (YES/NO pools with shared odds)
- P2P wagers (custom odds between users)
- Complete lifecycle management

**Features:**
- ✅ Create unlimited markets
- ✅ Dual betting: Pool + P2P per market
- ✅ Privacy-preserving commitments
- ✅ Admin-controlled resolution

**Circuits:**
- `initialize()` - Set admin key
- `createMarket(endTime, minBet)` - Anyone can create markets
- `placeBet(marketId, side)` - Pool betting
- `createWager(marketId, side, oddsNum, oddsDenom)` - P2P wagers
- `acceptWager(wagerId)` - Accept P2P wagers
- `cancelWager(wagerId)` - Cancel open wagers
- `lockMarket(marketId)` - Admin locks betting
- `resolveMarket(marketId, outcome)` - Admin sets outcome
- `claimPoolWinnings(betId)` - Claim pool winnings
- `claimWagerWinnings(wagerId)` - Claim P2P winnings

## 🚀 Usage

### Compile
```bash
pnpm compile
```

### Deploy
```bash
pnpm deploy
```

## 📊 Architecture Benefits

**Previous:** 4 separate contracts (oracle + factory + prediction + p2p)  
**Current:** 1 unified contract

**Benefits:**
- Lower deployment costs (single contract)
- Better UX (all options in one place)
- Simpler state management
- Easier maintenance

## 🔧 Compact 0.22 Compatibility

This contract is built for Compact 0.22 with workarounds for:
- No `Map.get()` - uses counter-based IDs
- No `hash()` - uses `persistentHash<Vector<>>()`
- No `Bool` type - uses Field with 0/1
- No division operator - simplified payout logic
- All witness values properly disclosed

## 📦 Deployment Info

Current deployment: `../../deployments/unified-prediction-market-local.json`

**Contract Address:** `cd9dae0f85be015b6b6c6b4008de30fc0be98d55bbf6b61f0fbda0e359f9aea7`

## 🗂️ Legacy Contracts

Previous 4-contract architecture has been archived to `../archived/`:
- `oracle-simple-v22.compact`
- `market-factory-simple-v22.compact`
- `prediction-market-simple-v22.compact`
- `p2p-wager-simple-v22.compact`

And their deployment scripts:
- `deploy-oracle-local.ts`
- `deploy-factory-local.ts`
- `deploy-prediction-local.ts`
- `deploy-p2p-local.ts`
