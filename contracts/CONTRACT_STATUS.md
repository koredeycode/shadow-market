# Contract Status

## Current Implementation: Stub Contracts

The contracts in this project are currently **STUB IMPLEMENTATIONS** designed to:

1. Compile successfully with Compact 0.22 (language version 0.22.0)
2. Provide basic structure for backend/frontend development
3. Be replaced with full implementations when Compact 0.29+ is available

## Limitations

The `market-stub.compact` contract provides only minimal functionality:

### What Works

- ✅ Contract compiles successfully
- ✅ Basic market state tracking (OPEN → CLOSED → RESOLVED)
- ✅ Placeholder bet commitments
- ✅ Simple counter for bets

### What's Missing (To Be Implemented)

- ❌ **No privacy features** - Witness values are disclosed
- ❌ **No AMM pricing** - Just tracks totals
- ❌ **No payout calculation** - Returns would not be calculated
- ❌ **No validation** - Minimal asserts
- ❌ **No factory pattern** - Single contract deployment only
- ❌ **No oracle integration** - Manual resolution only
- ❌ **No liquidity pools** - No LP functionality
- ❌ **No P2P wagers** - No peer-to-peer betting

## Compact 0.22 Limitations

The current Compact toolchain has significant restrictions:

### Missing Features

- No `sender()` function - cannot get caller address within circuits
- No `deployContract<T>()` - no factory pattern support
- No `Bool` type - must use Field (0/1) instead
- No division operator `/` in some contexts
- No `if/else` expressions - only statements
- No `let` keyword - must use `const`
- No `Address` or `ContractAddress` types - use `Bytes<32>`

### What This Means

The original contract designs from the planning docs **cannot be implemented** with Compact 0.22. They assumed features from Compact 0.29+ which don't exist yet.

## Migration Plan

When Compact 0.29+ becomes available:

1. **Replace stub with full contracts**:
   - Restore original `prediction-market.compact`
   - Implement `market-factory.compact`
   - Add `oracle.compact`
   - Add `liquidity-pool.compact`
   - Add `p2p-wager.compact`

2. **Update package versions**:
   - `@midnight-ntwrk/compact-runtime` → match new compact version
   - `@midnight-ntwrk/compact-js` → latest
   - Midnight SDK packages → compatible versions

3. **Revert contracts to use**:
   - `sender()` for caller identification
   - `deployContract<T>()` for factory pattern
   - `Bool` type for clarity
   - `Address`/`ContractAddress` types
   - Full privacy features with witnesses

## Current Development Approach

For now, focus on:

- ✅ Backend API development (can use mock contract data)
- ✅ Frontend UI implementation
- ✅ Database schema and migrations
- ✅ WebSocket real-time updates
- ✅ Authentication and authorization
- ✅ Overall application architecture

The stub contract provides enough structure to:

- Test contract interaction patterns
- Validate TypeScript interfaces
- Build out the full application stack
- Demo the UI and UX

## Files

- **Stub contract**: `contracts/src/market-stub.compact` (currently compiled)
- **Original contracts**: `contracts/src/*.compact` (archived, not compiling)
- **Compile script**: `contracts/package.json` - currently only compiles stub

## Notes

The original contracts in this repository were designed based on Compact language features
that were documented in planning materials but are not yet available in the released
toolchain. This is not uncommon in early blockchain SDKs.

The stub approach allows full-stack development to proceed while waiting for the
Compact language to mature.
