# 🔍 Shadow Market Codebase Audit Report

**Date:** April 8, 2026  
**Scope:** Full monorepo analysis (API, Backend, Frontend, CLI, Contracts)  
**Severity Scale:** 🔴 Critical/Breaking | 🟡 High Priority | 🟢 Medium Priority | 🔵 Nice-to-Have

---

## 1. 🐛 Bug Hunter & Logic Review

### 🔴 CRITICAL - Immediate Action Required

#### 1.1 Race Condition in Global Witness Context
**Location:** [packages/api/src/witnesses.ts](packages/api/src/witnesses.ts#L30-L41)

**Issue:** Global variables store ephemeral witness data without thread safety:
```typescript
// Anti-pattern: Global mutable state
let _betAmount = 0n;
let _betSide = 0n;
let _betNonce = new Uint8Array(32);
```

**Risk:** In concurrent transactions:
- Thread A sets bet context (amount=100)
- Thread B sets bet context (amount=200) - **overwrites A's values**
- Thread A executes with Thread B's values

**Impact:** Incorrect bet amounts, invalid proofs, potential fund loss.

**Fix:**
```typescript
// BEFORE: Global state
let _betAmount = 0n;
export function setBetContext(amount: bigint, side: bigint, nonce: Uint8Array) {
  _betAmount = amount;
  // ...
}

// AFTER: Context injection
export function createBetWitnessContext() {
  let _betAmount = 0n;
  return {
    setBetContext(amount: bigint, side: bigint, nonce: Uint8Array) {
      _betAmount = amount;
      // ...
    },
    getBetAmount: () => _betAmount
  };
}
```

---

#### 1.2 Division by Zero in Payout Calculation
**Location:** [packages/api/src/index.ts](packages/api/src/index.ts#L279)

**Issue:** No guard against zero `winnersPool`:
```typescript
const winnersPool = betLedger.yesPool;
// ... later:
const payout = (privateBet.amount * market.totalPool) / winnersPool;
```

**Risk:** If no one bet on winning side, division by zero crashes.

**Fix:**
```typescript
if (winnersPool === 0n) {
  throw new Error(`Market ${marketId}: No winners pool, cannot calculate payout`);
}
const payout = (privateBet.amount * market.totalPool) / winnersPool;
```

---

#### 1.3 WebSocket Authentication Bypass
**Location:** [packages/backend/src/websocket.ts](packages/backend/src/websocket.ts#L41-L49)

**Issue:** No authentication check on user subscription events:
```typescript
socket.on('subscribe:user', ({ userId }: { userId: string }) => {
  socket.join(`user:${userId}`); // Anyone can subscribe to any user's private data
});
```

**Risk:** Malicious clients can subscribe to any user's bet updates and balance changes.

**Fix:**
```typescript
socket.on('subscribe:user', ({ userId }: { userId: string }) => {
  const authenticatedUserId = socket.data.userId; // From auth middleware
  if (authenticatedUserId !== userId) {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }
  socket.join(`user:${userId}`);
});
```

---

#### 1.4 Missing Bet Loss Refund Logic
**Location:** [packages/api/src/index.ts](packages/api/src/index.ts#L283-L289)

**Issue:** Only handles winning side, losing bets have no payout logic:
```typescript
if (privateBet.side === market.outcome) {
  payout = (privateBet.amount * market.totalPool) / winnersPool;
} else {
  // Missing: What happens to losing bet?
}
```

**Risk:** Users who lost are not properly handled - payout remains `0n`.

**Clarification Needed:** Is this intentional (losers get nothing) or should there be a partial refund?

---

#### 1.5 Race Condition in Market Update (Backend)
**Location:** [packages/backend/src/services/wager.service.ts](packages/backend/src/services/wager.service.ts#L90-L134)

**Issue:** Fetches market state, calculates prices, then updates without optimistic locking:
```typescript
// Step 1: Fetch market (stale data possible)
const market = await getMarketById(marketId);

// Step 2: Calculate new prices (based on stale state)
const newYesPrice = calculatePrice(...);

// Step 3: Update (another bet might have occurred between step 1 and 3)
await db.update(markets).set({ yesPrice: newYesPrice });
```

**Risk:** Two concurrent bets calculate prices based on the same stale state, last write wins incorrectly.

**Fix:**
```typescript
await db.transaction(async (tx) => {
  const market = await tx.select().from(markets).where(...).forUpdate(); // Lock row
  const newYesPrice = calculatePrice(...);
  await tx.update(markets).set({ yesPrice: newYesPrice });
});
```

---

#### 1.6 Rate Limiter Fails Open on Redis Error
**Location:** [packages/backend/src/middleware/rate-limit.ts](packages/backend/src/middleware/rate-limit.ts#L54-L56)

**Issue:** If Redis connection fails, middleware allows unlimited requests:
```typescript
} catch (err) {
  // Redis is down, allow request (fail open)
  return next();
}
```

**Risk:** DDoS attack succeeds if Redis is unavailable.

**Fix:**
```typescript
} catch (err) {
  logger.error('Rate limiter Redis error:', err);
  return res.status(503).json({ error: 'Service temporarily unavailable' });
}
```

---

### 🟡 HIGH PRIORITY - Address Soon

#### 1.7 N+1 Query in Bet Fetching
**Location:** [packages/backend/src/routes/bets.ts](packages/backend/src/routes/bets.ts#L50-L55)

**Issue:** Fetches all user bets then filters client-side:
```typescript
const allBets = await getAllBetsForUser(userId); // Loads entire table
const filtered = allBets.filter(b => b.marketId === marketId); // Client-side filter
```

**Fix:**
```typescript
const bets = await db.select().from(bets)
  .where(and(eq(bets.userId, userId), eq(bets.marketId, marketId)));
```

**Impact:** Performance degrades as bet count grows.

---

#### 1.8 Background Job Errors Swallowed
**Location:** [packages/backend/src/jobs/jobs.ts](packages/backend/src/jobs/jobs.ts#L92-L95)

**Issue:** `setInterval` continues even if callback throws:
```typescript
setInterval(() => {
  syncMarketPrices(); // If this crashes, interval keeps running
}, 30000);
```

**Fix:**
```typescript
setInterval(async () => {
  try {
    await syncMarketPrices();
  } catch (error) {
    logger.error('Market sync failed:', error);
    // Optionally: stop interval after N failures
  }
}, 30000);
```

---

#### 1.9 Missing Cleanup in useEffect (Frontend)
**Location:** [packages/web/src/hooks/useWallet.ts](packages/web/src/hooks/useWallet.ts#L385-L389)

**Issue:** Empty dependency array with stale closures:
```typescript
useEffect(() => {
  if (!isConnected && autoConnect) {
    connectWallet(); // Uses stale closure of connectWallet
  }
}, []); // Missing dependencies: isConnected, autoConnect, connectWallet
```

**Fix:**
```typescript
useEffect(() => {
  if (!isConnected && autoConnect) {
    connectWallet();
  }
}, [isConnected, autoConnect, connectWallet]);
```

---

#### 1.10 Terminal Cleanup Not Guaranteed (CLI)
**Location:** [packages/cli/src/tui/index.tsx](packages/cli/src/tui/index.tsx#L14-L30)

**Issue:** Console methods suppressed but restoration only happens after `waitUntilExit()`:
```typescript
const originalLog = console.log;
console.log = () => {}; // Disabled

render(<App />);
await instance.waitUntilExit();

console.log = originalLog; // If process crashes, never restored
```

**Fix:**
```typescript
const cleanup = () => {
  console.log = originalLog;
  console.error = originalError;
  // ...
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

try {
  render(<App />);
  await instance.waitUntilExit();
} finally {
  cleanup();
}
```

---

#### 1.11 Weak Admin Key Derivation (Contracts)
**Location:** [packages/contracts/src/config.ts](packages/contracts/src/config.ts#L150-L157)

**Issue:** Predictable key derivation using byte repetition:
```typescript
for (let i = 0; i < 32; i++) {
  key[i] = buffer[i % buffer.length]; // Simple pattern
}
```

**Risk:** Admin keys are cryptographically weak, vulnerable to brute force.

**Fix:** Use proper HKDF or PBKDF2:
```typescript
import { pbkdf2Sync } from 'crypto';
const key = pbkdf2Sync(seed, 'shadow-market-admin', 100000, 32, 'sha512');
```

---

### 🟢 MEDIUM PRIORITY

#### 1.12 Silent Error in Ledger Lookups (API)
**Location:** [packages/api/src/index.ts](packages/api/src/index.ts#L135-L163)

**Issue:** Empty catch blocks return `null` without logging:
```typescript
async getOnChainMarket(marketId: string) {
  try {
    // ...
  } catch {
    return null; // No logging, can't debug failures
  }
}
```

**Fix:** Add logging:
```typescript
} catch (error) {
  console.error(`Failed to fetch on-chain market ${marketId}:`, error);
  return null;
}
```

---

#### 1.13 Missing Input Sanitization (CLI)
**Location:** [packages/cli/src/commands/bet.ts](packages/cli/src/commands/bet.ts#L47)

**Issue:** Weak validation allows negative IDs:
```typescript
validate: (val) => !isNaN(parseInt(val)) || 'Must be a number'
// Accepts: "-1", "-999"
```

**Fix:**
```typescript
validate: (val) => {
  const num = parseInt(val);
  return (!isNaN(num) && num > 0) || 'Must be a positive number';
}
```

---

#### 1.14 Placeholder Witness Values in Deployment
**Location:** [packages/contracts/src/deployment/deploy.ts](packages/contracts/src/deployment/deploy.ts#L142-L157)

**Issue:** Hardcoded witness values used in actual proofs:
```typescript
betAmount: 1000n,           // Placeholder
betSide: 1n,                // Placeholder
betNonce: Uint8Array(32).fill(0) // All zeros!
```

**Risk:** These values will be used in real circuit executions.

**Action Required:** Remove placeholders, implement proper runtime witness injection.

---

#### 1.15 Unbounded Memory Growth
**Location:** [packages/api/src/providers.ts](packages/api/src/providers.ts#L57-L83)

**Issue:** `MemoryPrivateStateProvider` accumulates state indefinitely:
```typescript
static states = new Map(); // Never cleared
```

**Fix:** Implement LRU cache with size limit or TTL.

---

## 2. 📊 Feature Gap Analysis

### Missing Features & Half-Baked Implementations

#### 2.1 🔴 Report System Not Implemented
**Location:** [packages/backend/src/services/admin.service.ts](packages/backend/src/services/admin.service.ts#L125)

```typescript
pendingReports: 0, // TODO: Implement report system
```

**Gap:** No system for users to report fraudulent markets or disputes.

**Needed:**
- Report submission endpoint
- Admin review dashboard
- Market flagging/suspension logic

---

#### 2.2 🟡 Wallet State Change Detection Missing
**Location:** [packages/web/src/hooks/useWallet.ts](packages/web/src/hooks/useWallet.ts#L361)

**TODO Comment:**
```typescript
// TODO: Check if ConnectedAPI provides event listeners for state changes.
// For now, event listeners are not implemented.
```

**Gap:** Multi-tab wallet changes not detected. If user disconnects in another tab, current tab won't know.

**Needed:** Implement `storage` event listener or polling for wallet state changes.

---

#### 2.3 🟡 Token Refresh Not Implemented (Frontend)
**Location:** [packages/web/src/hooks/useWallet.ts](packages/web/src/hooks/useWallet.ts#L209) + [packages/web/src/lib/api.ts](packages/web/src/lib/api.ts#L12)

**Issue:** Auth token stored in localStorage, but no refresh mechanism. When token expires:
- API calls return 401
- No automatic re-authentication
- User must manually reconnect wallet

**Needed:**
- Token expiry detection
- Refresh token flow
- Global 401 interceptor to trigger re-auth

---

#### 2.4 🟢 Test Suites Are Stubs
**Locations:**
- [packages/contracts/test/integration.test.ts](packages/contracts/test/integration.test.ts)
- [packages/contracts/test/liquidity-pool.test.ts](packages/contracts/test/liquidity-pool.test.ts)
- [packages/contracts/test/p2p-wager.test.ts](packages/contracts/test/p2p-wager.test.ts)
- [packages/contracts/test/prediction-market.test.ts](packages/contracts/test/prediction-market.test.ts)

**Issue:** All tests contain only:
```typescript
test('should do something', () => {
  expect(true).toBe(true); // Placeholder
});
```

**Impact:** No test coverage for critical contract logic:
- Overflow prevention
- Rounding errors
- Zero amount rejection
- Edge case scenarios

**Action:** Implement comprehensive test suite with real assertions.

---

#### 2.5 🟢 No Browser Fallback in CLI
**Location:** [packages/cli/src/tui/App.tsx](packages/cli/src/tui/App.tsx#L282)

```typescript
import('open').then(op => (op.default || op)(url)).catch(() => {});
// Silent catch - user not notified if browser fails to open
```

**Gap:** If `open` package fails, user doesn't know link wasn't opened.

**Needed:** Fallback to display clickable link in terminal.

---

#### 2.6 🟢 P2P Wager Odds Parsing Inconsistency
**Location:** [packages/cli/src/tui/App.tsx](packages/cli/src/tui/App.tsx#L242-L263)

**Issue:** Decimal format fallback uses hardcoded denominator:
```typescript
} else {
  // decimal fallback (e.g. 2.5 -> 250/100)
  oddsNumerator = BigInt(Math.floor(parseFloat(oddsStr) * 100) || 100);
  oddsDenominator = 100n; // Should be configurable
}
```

**Gap:** No validation that odds are reasonable bounds (e.g., max 1000:1).

---

#### 2.7 🟢 Incomplete Placeholder Signature (Web)
**Location:** [packages/web/src/pages/auth/LinkCLI.tsx](packages/web/src/pages/auth/LinkCLI.tsx#L56)

**Issue:** Uses placeholder instead of real wallet signature:
```typescript
const signature = 'WEB_PROOF_SUCCESS'; // NOT a real cryptographic signature
```

**Gap:** Terminal-to-Web pairing is not cryptographically secured.

**Action:** Implement proper wallet signature challenge-response.

---

#### 2.8 🟢 No Timeout on ZK Proof Generation
**Locations:** All CLI/TUI commands calling `api.createMarket()`, `api.placeBet()`, etc.

**Issue:** ZK proof generation can hang indefinitely with only spinner UI.

**Needed:** Timeout with user notification after e.g. 2 minutes.

---

## 3. 🧹 "The Purge" - Unwanted Files & Bloat

### 🔴 Files in Git That Shouldn't Be

#### 3.1 LevelDB Database Files Committed
**Location:** `midnight-level-db/` (root)

**Issue:** 30+ `.ldb` files, `MANIFEST-*`, and `LOG` files are tracked in git.

```bash
# Currently committed:
midnight-level-db/000005.ldb
midnight-level-db/000051.ldb
# ... (30+ files)
midnight-level-db/MANIFEST-001450
```

**Why Bad:** These are binary database files that:
- Change on every run
- Cause merge conflicts
- Increase repo size
- Contain potentially sensitive state

**Action:**
1. Remove from git:
   ```bash
   git rm -r midnight-level-db/
   ```
2. Already in `.gitignore` line 60, but wasn't retroactively applied.

---

#### 3.2 Multiple Environment Files in Root
**Location:** Root directory

**Found:**
```
.env               # Local (gitignored)
.env.example       # Template (OK to commit)
.env.local         # Local (gitignored)
.env.prepod        # Config for prepod network
.env.preprod       # Config for preprod network  
.env.preview       # Config for preview deployment
.env.production    # Config for production (TRACKED IN GIT!)
.env.undeployed    # Config for local undeployed
```

**Issue:** `.env.production` is tracked in git (though it contains only templates, not secrets).

**Recommendation:**
- Remove from git: `.env.production`, `.env.prepod`, `.env.preprod`, `.env.preview`, `.env.undeployed`
- Keep only: `.env.example`
- Store network-specific configs in `config/` folder as `.example` files

---

#### 3.3 Empty `tsc` File
**Location:** `/home/yusufakoredey/Desktop/midnight/shadow-market/tsc`

**Issue:** Empty file named `tsc` in root directory.

**Likely Cause:** Accidentally created by running `tsc` without proper PATH or typo.

**Action:** Delete it.

---

#### 3.4 Log Files Generated but Not in `.gitignore`
**Location:** `packages/backend/logs/` (multiple dated log files)

**Found:**
```
packages/backend/logs/http-2026-04-06.log
packages/backend/logs/combined-2026-04-06.log
packages/backend/logs/error-2026-04-04.log
# ... (20+ files)
```

**Status:** ✅ Already in `.gitignore` line 55 (`logs/`), so not tracked.

**Verification:**
```bash
git ls-files | grep 'logs/' # Returns nothing - good!
```

---

#### 3.5 Backup File (Already Handled)
**Status:** ✅ `packages/api/src/index.ts.backup` exists but is NOT tracked in git (`.gitignore` line 75).

**Recommendation:** Can safely delete locally if no longer needed.

---

### 🟡 Redundant or Misplaced Folders

#### 3.6 Duplicate Folder Structure
**Issue:** Root contains `src/`, `frontend/`, and `packages/` - inconsistent structure.

**Current:**
```
shadow-market/
├── src/
│   └── managed/      # Empty, purpose unclear
├── frontend/
│   └── public/       # Duplicate of packages/web/public/?
└── packages/
    ├── web/
    ├── cli/
    └── ...
```

**Recommendation:**
- All code belongs in `packages/`
- Remove `src/` (or clarify its purpose in README)
- Remove `frontend/` if duplicate of `packages/web/`

---

### 🟢 Dependency Analysis

#### 3.7 Version Mismatches
**Issue:** Different packages use different versions of shared deps:

| Package | @scure/bip39 | @types/react | React |
|---------|--------------|--------------|-------|
| web     | 1.0.0        | ^19.0.0      | ^19.0.0 |
| cli     | 2.0.1        | ^18.3.28     | ^19.2.4 |

**Recommendation:** Align versions using pnpm workspace protocol:
```json
"@scure/bip39": "workspace:*",
"react": "^19.2.4"
```

---

#### 3.8 Potentially Unused Dependencies

Manual inspection suggests possible unused deps (requires `depcheck` to confirm):

**Backend:**
- `bcryptjs` - No password hashing found in codebase (uses JWT only)
- `helmet` - Not seen in middleware chain

**Web:**
- `@hookform/resolvers` - If react-hook-form is used, this is needed. Verify usage.
- `pino` - Logging library imported but not used (console.log used instead)

**Action:** Run `depcheck` in each package:
```bash
cd packages/backend && npx depcheck
cd packages/web && npx depcheck
```

---

### 🔵 Nice-to-Have Cleanup

#### 3.9 Debug Logs Left in Production Code
**Locations:**
- [packages/web/src/pages/CreateMarket.tsx](packages/web/src/pages/CreateMarket.tsx#L78-L116) - Multiple `console.log('DEBUG:')`
- [packages/web/src/hooks/useContract.ts](packages/web/src/hooks/useContract.ts#L40-L54)
- [packages/web/src/hooks/useWallet.ts](packages/web/src/hooks/useWallet.ts#L181)
- [packages/api/src/index.ts](packages/api/src/index.ts#L219, L324, L403, L549) - Commented out logs

**Recommendation:** Wrap in environment check:
```typescript
if (import.meta.env.DEV) {
  console.log('DEBUG:', ...);
}
```

Or use a proper logging library like `pino` (already in deps).

---

#### 3.10 TypeScript Compiler Errors Related to Midnight SDK Types
**Multiple Locations:** `@ts-expect-error` and `@ts-ignore` comments

**Locations:**
- [packages/contracts/scripts/fund-wallet.ts](packages/contracts/scripts/fund-wallet.ts#L27)
- [packages/contracts/scripts/full-setup.ts](packages/contracts/scripts/full-setup.ts#L52, L441)
- [packages/contracts/scripts/initialize-contract.ts](packages/contracts/scripts/initialize-contract.ts#L126)
- [packages/contracts/src/deployment/deploy.ts](packages/contracts/src/deployment/deploy.ts#L76, L163)
- [packages/web/src/pages/admin/Dashboard.tsx](packages/web/src/pages/admin/Dashboard.tsx#L115)

**Pattern:**
```typescript
// @ts-expect-error Required for wallet sync
global.WebSocket = WebSocket as any;
```

**Issue:** Type mismatch in Midnight SDK v4 integration.

**Recommendation:**
- Create proper type declaration file for Midnight SDK extensions
- Or contribute fixes upstream to SDK

---

## 4. 🏗️ Refactoring & "Better Way" Suggestions

### 🔴 Critical Refactorings

#### 4.1 Extract Witness Context Management into Service
**Current:** [packages/api/src/witnesses.ts](packages/api/src/witnesses.ts)

**Problem:** Global mutable state (already covered in Bug 1.1).

**Better Pattern:**
```typescript
// witnesses.service.ts
export class WitnessContextManager {
  private contexts = new WeakMap<object, WitnessContext>();

  createContext(txId: object): WitnessContext {
    const context = {
      betAmount: 0n,
      betSide: 0n,
      // ...
    };
    this.contexts.set(txId, context);
    return context;
  }

  getContext(txId: object): WitnessContext | undefined {
    return this.contexts.get(txId);
  }

  clearContext(txId: object): void {
    this.contexts.delete(txId);
  }
}
```

**Usage:**
```typescript
const txContext = {};
const witness = witnessManager.createContext(txContext);
witness.setBetContext(amount, side, nonce);
await api.placeBet(..., txContext);
witnessManager.clearContext(txContext); // Automatic cleanup
```

---

#### 4.2 Database Access Layer (Backend)
**Current:** Direct Drizzle queries scattered in route handlers and services.

**Problem:** N+1 queries, inconsistent error handling, no caching strategy.

**Better Pattern:**
```typescript
// db/repositories/market.repository.ts
export class MarketRepository {
  async findById(id: string, options?: { withBets?: boolean }) {
    const query = db.select().from(markets).where(eq(markets.id, id));
    
    if (options?.withBets) {
      query.leftJoin(bets, eq(bets.marketId, markets.id));
    }
    
    return query.execute();
  }

  async findActiveWithPagination(page: number, pageSize: number) {
    return db.select().from(markets)
      .where(eq(markets.status, 'active'))
      .limit(pageSize)
      .offset(page * pageSize)
      .execute();
  }

  async updatePricesInTransaction(marketId: string, yesPrice: number, noPrice: number) {
    return db.transaction(async (tx) => {
      const market = await tx.select().from(markets)
        .where(eq(markets.id, marketId))
        .forUpdate() // Row lock
        .execute();
      
      return tx.update(markets)
        .set({ yesPrice, noPrice, updatedAt: new Date() })
        .where(eq(markets.id, marketId))
        .execute();
    });
  }
}
```

**Benefits:**
- Centralized query optimization
- Consistent error handling
- Easier to mock in tests
- Transaction management in one place

---

### 🟡 High-Value Refactorings

#### 4.3 Frontend: Separate Wallet State from Modal State
**Current:** [packages/web/src/store/wallet.store.ts](packages/web/src/store/wallet.store.ts)

**Problem:** Mixes connection state with UI state:
```typescript
interface WalletStore {
  isConnected: boolean;         // Connection state
  balance: number;              // Connection state
  isWalletModalOpen: boolean;   // UI state
  isTerminalModalOpen: boolean; // UI state
}
```

**Better Pattern:**
```typescript
// stores/wallet.store.ts
interface WalletStore {
  isConnected: boolean;
  currentAddress: string | null;
  balance: number;
  // Connection logic only
}

// stores/ui.store.ts (separate)
interface UIStore {
  modals: {
    wallet: boolean;
    terminal: boolean;
    // Other modals
  };
  openModal: (name: keyof UIStore['modals']) => void;
  closeModal: (name: keyof UIStore['modals']) => void;
}
```

**Benefits:**
- Single Responsibility Principle
- Components can subscribe to specific slices (fewer re-renders)
- Easier to test

---

#### 4.4 Unified Error Handling Middleware (Backend)
**Current:** Inconsistent error handling across routes:
```typescript
// Some routes:
} catch (error) {
  next(error);
}

// Other routes:
} catch (err: any) {
  res.status(500).json({ error: err.message });
}
```

**Better Pattern:**
```typescript
// middleware/error-handler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors,
    });
  }

  // Unexpected errors
  logger.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

// Usage in routes:
throw new AppError(404, 'Market not found');
```

**Benefits:**
- Consistent error responses
- Proper logging
- Client gets useful error codes

---

#### 4.5 React Query Cache Configuration (Frontend)
**Current:** [packages/web/src/App.tsx](packages/web/src/App.tsx) - Default React Query settings

**Problem:** No cache strategy configured, leading to excessive refetches.

**Better Pattern:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,     // Data fresh for 30s
      cacheTime: 300_000,    // Keep cache for 5 min
      retry: 2,              // Retry failed queries twice
      refetchOnWindowFocus: false, // Don't refetch when tab refocuses
      onError: (err) => {
        if (err.response?.status === 401) {
          // Trigger re-auth
        }
      }
    },
    mutations: {
      onError: (err) => {
        toast.error(err.message);
      }
    }
  }
});
```

---

#### 4.6 CLI Command Pattern Refactor
**Current:** [packages/cli/src/commands/*.ts](packages/cli/src/commands/) - Procedural command handlers

**Problem:** Shared logic (wallet access, API setup) duplicated in each command.

**Better Pattern:**
```typescript
// commands/base.command.ts
export abstract class BaseCommand {
  protected api: ShadowMarketAPI;
  protected wallet: WalletManager;

  async execute() {
    await this.setupWallet();
    await this.setupAPI();
    await this.run();
  }

  protected abstract run(): Promise<void>;

  private async setupWallet() {
    this.wallet = new WalletManager();
    await this.wallet.load();
  }

  private async setupAPI() {
    this.api = await connectToAPI(this.wallet);
  }
}

// commands/bet.command.ts
export class PlaceBetCommand extends BaseCommand {
  async run() {
    const { marketId, amount, side } = await this.promptUser();
    // this.api and this.wallet already available
    await this.api.placeBet(marketId, amount, side);
  }
}
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Easier to add global error handling
- Consistent command structure

---

### 🟢 Medium Priority Improvements

#### 4.7 Type-Safe Environment Variables
**Current:** Direct `process.env` access throughout codebase

**Problem:** No validation, can crash at runtime if env var is missing.

**Better Pattern:**
```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().regex(/^\d+$/).transform(Number),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  MIDNIGHT_NETWORK_ID: z.enum(['local', 'prepod', 'testnet', 'mainnet']),
  // ...
});

export const env = envSchema.parse(process.env);

// Usage:
const port = env.PORT; // Type-safe, validated at startup
```

**Benefits:**
- Startup validation (fail fast)
- Type safety
- Self-documenting required env vars

---

#### 4.8 WebSocket Connection with Reconnection Logic
**Current:** [packages/web/src/lib/socket.ts](packages/web/src/lib/socket.ts#L1-L15) - Basic socket.io setup

**Enhancement:**
```typescript
import { io, Socket } from 'socket.io-client';

export const createSocket = (): Socket => {
  const socket = io(import.meta.env.VITE_API_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('WebSocket connection failed:', err);
    // Could show user notification
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // Server disconnected, manual reconnect
      socket.connect();
    }
  });

  return socket;
};
```

---

#### 4.9 Structured Logging (Backend)
**Current:** Mix of `console.log` and Winston logger

**Better Pattern:**
```typescript
// logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shadow-market-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;

// Usage:
logger.info('Market created', { marketId, creatorId });
logger.error('Database error', { error, context: { userId, operation } });
```

**Benefits:**
- Structured logs for parsing/analysis
- Log levels (info, warn, error)
- Easier debugging in production

---

#### 4.10 Optimistic Updates (Frontend)
**Current:** Mutations wait for backend response before UI updates

**Better Pattern:**
```typescript
const placeBetMutation = useMutation({
  mutationFn: (data) => api.placeBet(data),
  onMutate: async (newBet) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['market', newBet.marketId]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['market', newBet.marketId]);
    
    // Optimistically update UI
    queryClient.setQueryData(['market', newBet.marketId], (old) => ({
      ...old,
      yesPool: old.yesPool + newBet.amount,
    }));
    
    return { previous };
  },
  onError: (err, newBet, context) => {
    // Rollback on error
    queryClient.setQueryData(['market', newBet.marketId], context.previous);
    toast.error('Bet failed');
  },
  onSettled: () => {
    queryClient.invalidateQueries(['market']);
  },
});
```

**Benefits:**
- Instant UI feedback
- Better UX
- Automatic rollback on error

---

### 🔵 Nice-to-Have Improvements

#### 4.11 Monorepo Build Orchestration
**Current:** Manual build order in scripts

**Recommendation:** Use Turborepo for caching and parallelization:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

**Benefits:**
- Incremental builds
- Build caching
- Parallel execution

---

#### 4.12 API Response Pagination Standard
**Current:** [packages/backend/src/routes/markets.ts](packages/backend/src/routes/markets.ts) - Inconsistent pagination

**Better Pattern:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Apply to all GET /collection routes
app.get('/api/markets', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
  
  const [data, total] = await Promise.all([
    getMarkets(page, pageSize),
    getMarketsCount()
  ]);
  
  res.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    }
  });
});
```

---

#### 4.13 Component Library Extract (Frontend)
**Current:** Components in `src/components/` with mixed concerns

**Recommendation:** Separate into:
```
packages/ui/               # Shared component library
  ├── Button/
  ├── Card/
  ├── Modal/
  └── ...

packages/web/
  ├── features/            # Feature-specific components
  │   ├── markets/
  │   ├── betting/
  │   └── admin/
  └── pages/
```

**Benefits:**
- Reusable across web/cli if needed
- Clear separation of concerns
- Easier to document with Storybook

---

#### 4.14 Contract Type Generation Automation
**Current:** Manual type imports from Midnight SDK

**Better:** Codegen from contract ABI:
```json
// package.json
{
  "scripts": {
    "contracts:compile": "compact compile",
    "contracts:codegen": "tsx scripts/generate-types.ts",
    "contracts:build": "npm run contracts:compile && npm run contracts:codegen"
  }
}
```

Generate TypeScript types from compiled contract for type-safe API calls.

---

## 📋 Summary & Prioritization

### Immediate Actions (This Week)

1. 🔴 **Fix global witness race condition** - Bug 1.1 (Risk: Fund loss)
2. 🔴 **Add division-by-zero guard** - Bug 1.2 (Risk: Crashes)
3. 🔴 **Implement WebSocket auth** - Bug 1.3 (Risk: Privacy leak)
4. 🔴 **Remove leveldb files from git** - Purge 3.1 (Risk: Repo bloat)
5. 🔴 **Fix rate limiter fail-open** - Bug 1.6 (Risk: DDoS)

### High Priority (Next Sprint)

6. 🟡 **Add optimistic locking to market updates** - Bug 1.5
7. 🟡 **Implement database repository pattern** - Refactor 4.2
8. 🟡 **Fix N+1 queries in bet fetching** - Bug 1.7
9. 🟡 **Add terminal cleanup handlers** - Bug 1.10
10. 🟡 **Upgrade admin key derivation** - Bug 1.11

### Medium Priority (This Month)

11. 🟢 **Implement report system** - Feature 2.1
12. 🟢 **Add token refresh flow** - Feature 2.3
13. 🟢 **Write comprehensive test suite** - Feature 2.4
14. 🟢 **Extract witness context service** - Refactor 4.1
15. 🟢 **Separate wallet/modal state** - Refactor 4.3

### Cleanup Tasks (Ongoing)

16. Remove debug logs or wrap in `__DEV__` checks
17. Delete `tsc` file and clarify `src/`/`frontend/` folders
18. Align dependency versions across packages
19. Run `depcheck` to find unused dependencies
20. Remove `.env.*` files (keep only `.env.example`)

---

## 🎯 Metrics Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Bugs** | 6 | 5 | 4 | 0 | 15 |
| **Features** | 1 | 3 | 4 | 0 | 8 |
| **Purge** | 3 | 2 | 5 | 0 | 10 |
| **Refactor** | 2 | 4 | 4 | 4 | 14 |
| **TOTAL** | **12** | **14** | **17** | **4** | **47** |

---

**End of Report**  
Generated by: GitHub Copilot Code Audit  
Report Date: April 8, 2026
