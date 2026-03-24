# Week 2 Summary: P2P & AMM Contracts

**Completion Date**: Days 8-14  
**Status**: ✅ Complete

## Overview
Week 2 focused on implementing the remaining smart contracts and comprehensive test coverage. All 5 core contracts are now complete with extensive testing infrastructure.

## Completed Contracts

### 1. P2PWager Contract (Days 8-9)
**File**: `contracts/src/p2p-wager.compact`  
**Lines of Code**: ~160

**Features**:
- Direct peer-to-peer wager creation with custom odds
- Wager matching system (creator vs taker)
- Settlement based on market outcomes
- Cancellation for unmatched wagers
- Payout calculation with odds ratios (e.g., 3:1, 5:2)
- Expiration handling
- User wager tracking

**Key Functions**:
- `createWager()`: Create custom odds wager
- `acceptWager()`: Match an open wager
- `settleWager()`: Distribute winnings based on outcome
- `cancelWager()`: Cancel unmatched wager
- `getWagerPayout()`: Calculate potential payout

### 2. LiquidityPool Contract (Days 10-11)
**File**: `contracts/src/liquidity-pool.compact`  
**Lines of Code**: ~210

**Features**:
- Liquidity pool creation for markets
- LP token minting/burning system
- Add/remove liquidity with automatic ratio maintenance
- Constant product AMM (x * y = k) for swaps
- Trading fee collection (configurable 0-10%)
- Slippage protection
- Spot price calculation
- Pool activation/deactivation

**Key Functions**:
- `createPool()`: Initialize pool with reserves
- `addLiquidity()`: Mint LP tokens
- `removeLiquidity()`: Burn LP tokens and withdraw
- `swap()`: Execute AMM swap with fees
- `getSpotPrice()`: Calculate current price
- `sqrt()`: Helper for LP token calculation

### 3. Oracle Contract (Days 12-13)
**File**: `contracts/src/oracle.compact`  
**Lines of Code**: ~260

**Features**:
- Oracle registration with stake requirements
- Multi-oracle outcome submissions
- Weighted consensus calculation (reputation × confidence)
- Reputation tracking and updates
- Dispute mechanism for contested outcomes
- Oracle voting on disputes (60% threshold)
- Oracle suspension capability
- Support for INVALID outcome

**Key Statistics Tracked**:
- Total submissions per oracle
- Correct submissions count
- Reputation score (0-1000)
- Stake amount

**Key Functions**:
- `registerOracle()`: Stake and register
- `submitOutcome()`: Submit market outcome
- `calculateConsensus()`: Weighted voting
- `updateReputations()`: Adjust based on accuracy
- `createDispute()`: Challenge outcome
- `voteOnDispute()`: Oracle voting
- `resolveDispute()`: Finalize dispute

### 4. Integration Tests (Day 14)
**File**: `contracts/src/test/integration.test.ts`  
**Test Cases**: ~50

**Test Coverage**:
- ✅ Full AMM market lifecycle
- ✅ Full P2P wager lifecycle
- ✅ Oracle consensus with multiple oracles
- ✅ Cross-contract interactions
- ✅ Privacy & ZK proof validation
- ✅ Edge cases (zero liquidity, tied votes, etc.)
- ✅ Economic scenarios (arbitrage, price swings)
- ✅ Multi-market handling
- ✅ Time-based operations
- ✅ Invalid state transitions
- ✅ Access control enforcement
- ✅ Numerical edge cases

## Contract Summary

| Contract | LOC | Circuits | Ledgers | Tests |
|----------|-----|----------|---------|-------|
| MarketFactory | 103 | 3 | 3 | 14 |
| PredictionMarket | 270 | 5 | 4 | 28 |
| P2PWager | 160 | 6 | 3 | 22 |
| LiquidityPool | 210 | 7 | 3 | 26 |
| Oracle | 260 | 9 | 4 | 30 |
| **Total** | **1,003** | **30** | **17** | **120** |

## Architecture Highlights

### Privacy-Preserving Design
- Position amounts hidden via ZK commitments in PredictionMarket
- Only revealed on claim to calculate payout
- User privacy maintained across transactions

### AMM Implementation
- Constant product formula: k = yesReserve × noReserve
- Dynamic pricing based on liquidity
- Fee collection for LP providers
- Slippage protection

### Oracle Consensus
- Weighted by reputation and confidence
- Self-correcting reputation system
- Dispute resolution with community voting
- Stake requirements prevent spam

### P2P Flexibility
- Custom odds negotiation (3:1, 5:2, etc.)
- Direct peer matching
- Independent of AMM liquidity
- Automatic settlement

## Git Commits

```
ec9724c Day 14: Add integration tests
0d9f1a4 Day 12-13: Implement Oracle contract
dd9f795 Day 10-11: Implement LiquidityPool contract
a041081 Day 8-9: Implement P2PWager contract
```

## Next Steps (Week 3-4)

### Backend Development
- [ ] Set up backend workspace with Express
- [ ] Configure Drizzle ORM with PostgreSQL
- [ ] Design database schema (markets, bets, users, oracles)
- [ ] Implement REST API endpoints
- [ ] Add WebSocket for real-time updates
- [ ] Integrate with Midnight Network
- [ ] Add authentication & session management
- [ ] Implement caching with Redis

### API Endpoints to Build
- Market CRUD operations
- Bet placement and tracking
- Oracle management
- Liquidity operations
- User portfolio
- Market statistics
- Real-time price feeds

### Database Schema
- Markets (id, question, type, status, creator, created_at, etc.)
- Bets (id, user_id, market_id, amount, side, outcome, etc.)
- Oracles (address, reputation, stake, status, etc.)
- Submissions (oracle_id, market_id, outcome, confidence, etc.)
- Wagers (id, creator, taker, odds, amount, status, etc.)
- Pools (id, market_id, yes_reserve, no_reserve, total_lp, etc.)

## Conclusion

Week 2 successfully delivered all core smart contract functionality. The ShadowMarket platform now has:
- ✅ Complete contract layer (5 contracts, 1,003 LOC)
- ✅ Dual betting modes (AMM + P2P)
- ✅ Decentralized oracle system
- ✅ Privacy-preserving architecture
- ✅ Comprehensive test coverage

Ready to build the backend infrastructure to make these contracts accessible via API.
