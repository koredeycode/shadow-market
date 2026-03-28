# Contract API Integration Guide

## Current Status

✅ **Contract Compiled**: The unified-prediction-market contract has been compiled  
✅ **Managed Artifacts Generated**: Contract bindings exist in `contracts/src/managed/unified-prediction-market/`  
⚠️ **API Wrapper**: Currently using stub implementation that throws helpful errors  
❌ **Full Integration**: API wrapper needs to use actual contract calls

## What's Happening

When you try to place a bet in the frontend, you see an error toast saying "Contract integration not complete" because:

1. ✅ The **contract IS compiled** (you've done this)
2. ✅ The **contract IS deployed** (you mentioned this)
3. ❌ The **API wrapper** (`api/src/index.ts`) is still using stub methods that throw errors instead of calling the actual contract

## Why This Approach?

The current stub implementation is **intentional** because:

- The Midnight SDK v4 has significant API changes from v3
- The BBoard example shows the correct pattern, but needs adaptation
- The actual implementation requires careful setup of providers and contract bindings

## What You See Now (Improved)

Instead of the generic "Contract not compiled" message, you'll now see detailed error messages like:

```
Contract integration not complete.
The contract is compiled but the API wrapper needs implementation.
Market: <marketId>, Amount: <amount>, Outcome: YES/NO
```

Plus detailed console logs showing:

- The stub method being called
- Wallet connection status
- Contract configuration
- All parameters being passed

## To Complete the Integration

### Step 1: Check Contract Deployment

Verify your contract is deployed and you have the contract address:

```bash
# Check if contract address is set
echo $VITE_UNIFIED_CONTRACT_ADDRESS

# Should match what's in:
frontend/.env
```

### Step 2: Implement the API Wrapper

Edit `api/src/index.ts` and replace the stub implementation with actual contract calls:

```typescript
// Import the deployed contract
import { deployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import contract from '../../contracts/src/managed/unified-prediction-market/contract/index.cjs';
import { witnesses } from '../../contracts/src/managed/unified-prediction-market/contract/witnesses.cjs';

// In constructor:
constructor(config: DeployedUnifiedMarketConfig) {
  this.config = config;

  // Set up providers
  this.publicDataProvider = indexerPublicDataProvider(
    config.indexerUrl,
    config.indexerWs
  );

  this.proofProvider = httpClientProofProvider(config.proofServerUrl);
}

// In placeBet method:
async placeBet(marketId: string, betAmount: bigint, betOutcome: boolean, wallet: any): Promise<void> {
  // Get private state provider from wallet
  const privateStateProvider = await wallet.getPrivateStateProvider();

  // Find deployed contract
  const deployed = await deployedContract(
    contract,
    this.config.contractAddress,
    this.publicDataProvider,
    privateStateProvider,
    this.proofProvider,
    witnesses
  );

  // Call the contract
  const result = await deployed.callTx.placeBet(
    marketId,
    betAmount,
    betOutcome
  );

  // Wait for confirmation
  await result.getTxResults();
}
```

### Step 3: Follow BBoard Pattern

Reference the BBoard example for the complete pattern:

```bash
# Study the BBoard implementation
cd /home/yusufakoredey/Desktop/midnight/example-bboard-clone/api/src
cat index.ts
```

Key differences to adapt:

- BBoard uses `create_board`, `add_post` - you need `placeBet`, `createMarket`
- BBoard's ledger state structure differs from your market state
- Parameter types need to match your contract's Compact types

### Step 4: Update Frontend Error Handling

Once the API is implemented, update the frontend to show more specific errors:

```typescript
// In frontend/src/hooks/useContract.ts
catch (error: any) {
  toast.dismiss();

  // Show specific error from contract
  const errorMsg = error.message || 'Failed to place bet';
  toast.error(errorMsg);

  // Log full error for debugging
  console.error('Contract error:', {
    message: error.message,
    code: error.code,
    details: error
  });
}
```

## Temporary Workaround

For testing UI/UX flow without smart contracts:

1. **Use Backend API Only**: The backend has a database-only implementation that works without contracts
2. **Frontend calls backend**: Instead of contract, call `wagersApi.placeBet()` which goes to PostgreSQL
3. **Test the flow**: Market creation, betting, positions all work in the backend

```typescript
// In BettingTerminal.tsx or PlaceBetModal.tsx
// Skip contract call, go straight to backend:
const result = await wagersApi.placeBet({
  marketId: market.id,
  amount: amount.toString(),
  side: side.toLowerCase() as 'yes' | 'no',
  slippage: 5,
});
```

## Next Steps (Priority Order)

1. **[CURRENT]** Use backend API for testing (contracts optional)
2. **Study BBoard**: Understand the deployed contract pattern
3. **Implement placeBet**: Start with one method, test thoroughly
4. **Add remaining methods**: createMarket, lockMarket, etc.
5. **Test end-to-end**: Frontend → API → Contract → Indexer → Backend
6. **Add error handling**: Graceful degradation if contract fails

## Resources

- [Midnight SDK v4 Docs](https://docs.midnight.network/)
- [BBoard Example](../example-bboard-clone/)
- [Compact Language Spec](https://docs.midnight.network/compact/)
- Contract artifacts: `contracts/src/managed/unified-prediction-market/`

## Testing Without Contract Integration

The backend is fully functional without contract calls. You can:

✅ Create markets (database only)  
✅ Place bets (encrypted positions in DB)  
✅ View positions and portfolio  
✅ Admin lock/resolve markets  
✅ WebSocket real-time updates  
✅ All REST API endpoints

The contract integration adds:

- On-chain verification
- Decentralized state
- Zero-knowledge proofs
- Trustless settlement

---

**Current Error Message Improved**: Now shows detailed context instead of generic "not compiled"  
**Backend Works**: Full feature set available without contract integration  
**Contract Ready**: Compiled and waiting for API implementation
