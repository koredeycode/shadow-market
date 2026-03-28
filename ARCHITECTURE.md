# ShadowMarket Architecture

### System Overview

ShadowMarket is a privacy-preserving prediction market platform built on the Midnight Network. The system implements a three-tier architecture with smart contracts, backend services, and a React frontend.

```
+-----------------------------------------------------------------+
|                         User Interface                          |
|  +---------------+  +----------------+  +---------------------+ |
|  |  React App   |  |  MUI v7        |  |  TanStack Query     | |
|  |  (Vite)      |  |  Components    |  |  (Data Fetching)    | |
|  +---------------+  +----------------+  +---------------------+ |
+-----------------------------------------------------------------+
          |                  |            |
          |        HTTPS/WSS |            | API Calls
          |                  |            |
+-----------------------------------------------------------------+
|                       Backend Services                          |
|  +--------------+  +----------------+  +---------------------+  |
|  |  Express     |  |  Socket.io     |  |  Background Jobs    |  |
|  |  REST API    |  |  WebSocket     |  |  (Price Sync)       |  |
|  +--------------+  +----------------+  +---------------------+  |
|        |                |                      |                |
|        |  +---------------------------------------------+       |
|        |  |         Redis (Cache & Rate Limit)          |       |
|        |  +---------------------------------------------+       |
|        |                                                        |
|        |  +-------------------------------------------+         |
|        +--|  PostgreSQL (Drizzle ORM)                 |         |
|           |  - Users, Markets, Positions, Wagers      |         |
|           +-------------------------------------------+         |
+-----------------------------------------------------------------+
                               |
                               | Contract Calls
                               |
+-----------------------------------------------------------------+
|                    Midnight Network                             |
|  +--------------+  +----------------+  +---------------------+  |
|  |  Shadow      |  |  Prediction    |  |    P2PWager         |  |
|  |  Market      |  |    Market      |  |     Oracle          |  |
|  +--------------+  +----------------+  +---------------------+  |
|                                                                 |
|  +-------------------------------------------------------+      |
|  |      Zero-Knowledge Proof Server                      |      |
|  |      (Pedersen Commitments, ZK-SNARKs)               |      |
|  +-------------------------------------------------------+      |
+-----------------------------------------------------------------+
```

---

## Component Architecture

### 1. Smart Contracts (Compact)

#### MarketFactory.compact

**Purpose**: Factory pattern for creating prediction markets  
**Responsibilities**:

- Create new prediction markets
- Track market registry
- Emit market creation events

**Key Functions**:

```compact
export circuit createMarket(
  question: String,
  endTime: Field,
  minBet: Field,
  maxBet: Field
): MarketId
```

#### PredictionMarket.compact

**Purpose**: Core prediction market with AMM  
**Responsibilities**:

- AMM liquidity pool (constant product formula)
- Private bet placement with ZK commitments
- Market lifecycle management (PENDING � OPEN � LOCKED � RESOLVED)
- Winnings calculation and distribution

**Key Functions**:

```compact
export circuit placeBet(
  amount: Field,          // Hidden via Pedersen commitment
  side: Field,            // YES (1) or NO (0)
  commitment: Bytes<32>,  // ZK proof
  nonce: Field            // Random nonce
): PositionId

export circuit claimWinnings(positionId: Field): Field
```

**AMM Formula**:

```
x * y = k  (constant product)
where:
  x = YES tokens in pool
  y = NO tokens in pool
  k = constant product

Price calculation:
  yesPrice = x / (x + y)
  noPrice = y / (x + y)
```

#### P2PWager.compact

**Purpose**: Peer-to-peer betting with custom odds  
**Responsibilities**:

- Create P2P wager offers
- Match wager with counterparty
- Escrow funds until settlement
- Calculate payouts based on odds

**Key Functions**:

```compact
export circuit createWager(
  marketId: Field,
  amount: Field,
  odds: [Field, Field],  // [numerator, denominator]
  side: Field,
  duration: Field
): WagerId

export circuit acceptWager(wagerId: Field): []
```

#### Oracle.compact

**Purpose**: Decentralized outcome resolution  
**Responsibilities**:

- Oracle registration with stake
- Multi-oracle consensus (3+ confirmations)
- Dispute mechanism
- Time-locked resolution

**Key Functions**:

```compact
export circuit submitReport(
  marketId: Field,
  outcome: Field,        // 0 or 1
  proofData: Bytes<32>   // Signature from data source
): ReportId

export circuit confirmReport(marketId: Field): []
export circuit disputeReport(marketId: Field, disputeStake: Field): []
```

---

### 2. Backend Services (Node.js + TypeScript)

#### API Layer (Express)

**REST Endpoints**:

- `/api/markets` - Market CRUD operations
- `/api/wagers` - Betting and P2P wagering
- `/api/positions` - User positions and portfolio
- `/api/oracles` - Oracle registration and reporting
- `/api/users` - User profile management
- `/api/analytics` - Platform statistics

**Middleware Stack**:

```typescript
app.use(helmet()); // Security headers
app.use(cors()); // CORS configuration
app.use(rateLimits.api); // Rate limiting
app.use(express.json()); // JSON parsing
app.use(sanitizeRequest); // Input sanitization
app.use(authenticate); // JWT auth (optional)
app.use(errorHandler); // Global error handler
```

#### WebSocket Server (Socket.io)

**Real-time Events**:

```typescript
// Client � Server
socket.emit('subscribe:market', { marketId });
socket.emit('unsubscribe:market', { marketId });

// Server � Client
socket.on('market:update', { marketId, yesPrice, noPrice, volume });
socket.on('market:trade', { marketId, side, amount, price });
socket.on('market:locked', { marketId });
socket.on('market:resolved', { marketId, outcome });
```

#### Database Layer (Drizzle ORM)

**Schema**:

```
users
  ��� positions (1:N)
  ��� createdMarkets (1:N)
  ��� createdWagers (1:N)
  ��� reports (1:N)

markets
  ��� positions (1:N)
  ��� wagers (1:N)
  ��� pricePoints (1:N)
  ��� reports (1:N)

wagers
  ��� creator (N:1 users)
  ��� taker (N:1 users)
  ��� market (N:1 markets)
```

**Indexes**:

- `idx_markets_status` - Fast status filtering
- `idx_markets_category` - Category browsing
- `idx_positions_user_market` - User position lookups
- `idx_wagers_status` - Open wager queries
- `idx_price_points_market_time` - Chart data retrieval

#### Background Jobs

**Price Sync Job** (every 10 seconds):

```typescript
async function syncMarketPrices() {
  const openMarkets = await getOpenMarkets();

  for (const market of openMarkets) {
    const onchainData = await contract.getMarketState(market.onchainId);

    await db
      .update(markets)
      .set({
        yesPrice: onchainData.yesPrice,
        noPrice: onchainData.noPrice,
        totalVolume: onchainData.volume,
      })
      .where(eq(markets.id, market.id));

    // Record price point for charts
    await recordPricePoint(market.id, onchainData);

    // Notify WebSocket clients
    io.to(`market:${market.id}`).emit('market:update', onchainData);
  }
}
```

**Position Settlement Job** (every 30 seconds):

```typescript
async function settlePositions() {
  const resolvedMarkets = await getResolvedMarkets();

  for (const market of resolvedMarkets) {
    const positions = await getUnsettledPositions(market.id);

    for (const position of positions) {
      // Decrypt position side (YES/NO)
      const side = await decrypt(position.sideEncrypted);

      // Calculate payout
      const payout = calculatePayout(position, market.outcome);

      // Update position
      await db
        .update(positions)
        .set({
          isSettled: true,
          payout,
          profitLoss: payout - BigInt(position.amount),
        })
        .where(eq(positions.id, position.id));
    }
  }
}
```

---

### 3. Frontend (React + TypeScript)

#### State Management

**Zustand Stores**:

```typescript
// Wallet Store
interface WalletStore {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Market Store
interface MarketStore {
  markets: Market[];
  selectedMarket: Market | null;
  setMarkets: (markets: Market[]) => void;
  updatePrice: (marketId: string, prices: PriceUpdate) => void;
}
```

**TanStack Query**:

```typescript
// Data fetching with caching
const { data: markets } = useQuery({
  queryKey: ['markets', filters],
  queryFn: () => api.markets.getAll(filters),
  staleTime: 10000, // 10 seconds
  refetchInterval: 5000, // Refresh every 5s
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: api.wagers.placeBet,
  onMutate: async newBet => {
    // Optimistic update
    await queryClient.cancelQueries(['positions']);
    const previous = queryClient.getQueryData(['positions']);
    queryClient.setQueryData(['positions'], old => [...old, newBet]);
    return { previous };
  },
  onError: (err, newBet, context) => {
    // Rollback on error
    queryClient.setQueryData(['positions'], context.previous);
  },
});
```

#### Component Architecture

**Page Components**:

- `Home` - Landing page with featured markets
- `Markets` - Market browser with filters
- `MarketDetail` - Single market view with chart
- `Portfolio` - User positions and P&L
- `Analytics` - Platform statistics

**Feature Components**:

- `PlaceBetModal` - AMM betting interface
- `CreateP2PWagerModal` - P2P wager creation
- `MarketCard` - Market preview card
- `MarketChart` - Price history chart (Recharts)
- `PositionsList` - User positions table
- `WalletModal` - Wallet connection

**Layout Components**:

- `Layout` - Main layout with navbar
- `Navbar` - Navigation and wallet button
- `ErrorBoundary` - Global error catcher
- `LoadingState` - Loading indicators
- `EmptyState` - Empty data placeholder

---

## � Security Architecture

### Zero-Knowledge Privacy

**Pedersen Commitments**:

```
commitment = Hash(amount || side || nonce)

where:
  amount = bet amount (hidden)
  side = YES (1) or NO (0) (hidden)
  nonce = random value (hidden)
```

Only the commitment is stored on-chain. The actual values remain private until claim time.

**ZK Proof Flow**:

1. User generates commitment locally
2. Frontend creates ZK proof of sufficient balance
3. Proof submitted to smart contract
4. Contract verifies proof without revealing amount
5. Position created with commitment hash

### Authentication & Authorization

**JWT Authentication**:

```
Header: Authorization: Bearer <jwt_token>

Token payload:
{
  userId: string,
  address: string,
  iat: number,      // Issued at
  exp: number       // Expires (15 minutes)
}
```

**Refresh Token Flow**:

```
1. User logs in with wallet signature
2. Server issues JWT (15 min) + refresh token (7 days)
3. JWT stored in memory, refresh token in httpOnly cookie
4. On JWT expiry, client requests new JWT with refresh token
5. Server validates refresh token, issues new JWT
6. On refresh token expiry, user must re-authenticate
```

### Rate Limiting

**Redis-based Rate Limiting**:

```
Key: ratelimit:{IP}:{endpoint}
Value: request_count
TTL: window_duration

Algorithm:
1. Increment counter for key
2. If first request, set TTL
3. If count > limit, return 429
4. Otherwise, allow request
```

**Rate Limit Tiers**:

- Auth endpoints: 5 requests / 15 minutes
- API endpoints: 60 requests / minute
- Write operations: 20 requests / minute
- Expensive operations: 5 requests / minute

---

## Data Flow

### Place Bet Flow

```
1. User Interface
   �
   ��> User enters bet amount and side
   ��> Frontend generates ZK commitment
   �   commitment = Hash(amount || side || nonce)
   �
   ��> Frontend calls API
   �   POST /api/wagers
   �   { marketId, amount, side, commitment }
   �
2. Backend API
   �
   ��> Validate request (Zod schema)
   �   - Check amount within min/max
   �   - Verify market is OPEN
   �   - Authenticate user
   �
   ��> Call smart contract
   �   contract.placeBet({ amount, side, commitment, nonce })
   �
   ��> Wait for transaction confirmation
   �
   ��> Store encrypted position in database
   �   positions.insert({
   �     userId, marketId,
   �     amountEncrypted,  // AES-256-GCM
   �     sideEncrypted,    // AES-256-GCM
   �     commitment
   �   })
   �
   ��> Notify WebSocket clients
   �   io.emit('market:trade', { marketId, price, volume })
   �
   ��> Return success response
       { success: true, data: { positionId, ... } }
   �
3. Smart Contract
   �
   ��> Verify commitment is unique
   ��> Verify user has sufficient balance (ZK proof)
   ��> Calculate new AMM prices
   �   newYesPrice = (yesPool + amount) / totalPool
   ��> Update market state
   ��> Emit PositionCreated event
   ��> Return positionId
   �
4. User Interface (Update)
   �
   ��> Query invalidation triggers refetch
   ��> Updated positions displayed
   ��> Price chart updates in real-time
   ��> Toast notification shown
```

### Market Resolution Flow

```
1. Oracle
   �
   ��> Monitor markets reaching end time
   ��> Fetch outcome from data source
   ��> Generate cryptographic proof
   �   proof = Sign(outcome || marketId, oraclePrivateKey)
   �
   ��> Submit report
   �   POST /api/oracles/report
   �   { marketId, outcome, proofData }
   �
2. Smart Contract
   �
   ��> Verify oracle is registered
   ��> Verify market is LOCKED
   ��> Verify proof signature
   ��> Store report with status PENDING
   ��> Wait for confirmations (24 hours)
   �
3. Confirmation Phase
   �
   ��> Other oracles confirm or dispute
   ��> If 3+ confirmations � status = CONFIRMED
   ��> If disputed � arbitration process
   �
   ��> Once confirmed, market status � RESOLVED
   ��> Emit MarketResolved event
   �
4. Settlement
   �
   ��> Background job detects resolved market
   ��> Calculate payouts for all positions
   �   for each position:
   �     if position.side == market.outcome:
   �       payout = positions * market.totalPool / winningPool
   �     else:
   �       payout = 0
   �
   ��> Update positions with payout amounts
   ��> Users can now claim winnings
   ��> Notify users via WebSocket
```

---

## Deployment Architecture

### Production Environment

```
+---------------------------------------------------------------+
|                      Load Balancer (Nginx)                    |
|                     SSL Termination (Let's Encrypt)           |
+---------------------------------------------------------------+
                |                      |
        +------------------+     +------------------+
        |  Frontend        |     |  Backend         |
        |  (Static)        |     |  (Node.js)       |
        |  - Nginx         |     |  - PM2 Cluster   |
        |  - CDN           |     |  - 4 instances   |
        +------------------+     +------------------+
                                         |
                        +---------------------------------+
                        |                |                |
                +----------------+ +------------+  +----------------+
                |  PostgreSQL    | |   Redis    |  |  Midnight      |
                |  (Primary)     | |  Cluster   |  |  Network       |
                |  + Replica     | |            |  |                |
                +----------------+ +------------+  +----------------+
```

### Scaling Strategy

**Horizontal Scaling**:

- Backend: PM2 cluster mode (4-8 instances)
- Database: Read replicas for queries
- Redis: Cluster mode for high availability
- CDN: Static asset distribution

**Vertical Scaling**:

- Database: Increase CPU/RAM for complex queries
- Redis: Increase memory for larger cache
- Backend: Increase instance size for computations

**Caching Strategy**:

- **L1 Cache**: In-memory (Node.js) - 1 second TTL
- **L2 Cache**: Redis - 1-5 minutes TTL
- **L3 Cache**: CDN - 1 hour TTL (static assets)

---

## Performance Optimizations

### Frontend

- Code splitting with lazy loading
- Vendor chunking (React, MUI, Charts)
- Service worker for offline support
- Image lazy loading
- Virtual scrolling for large lists

### Backend

- Database query optimization (indexes)
- Response caching (Redis)
- Connection pooling (PostgreSQL)
- Batch processing for bulk operations
- WebSocket connection pooling

### Smart Contract

- Gas optimization
- Batch transaction processing
- State compression
- Efficient data structures

---

## Data Consistency

### Eventual Consistency Model

The system uses eventual consistency between blockchain state and database:

```
Blockchain (Source of Truth)
    |
Background Sync Job (10s interval)
    |
PostgreSQL Database
    |
WebSocket Broadcasts
    |
Frontend UI Updates
```

**Handling Conflicts**:

- Blockchain state always wins
- Database serves as query optimization layer
- WebSocket provides real-time updates
- Frontend shows optimistic updates, then confirms

---

## Technology Stack Summary

### Smart Contracts

- **Language**: Compact 0.29+
- **Network**: Midnight Network
- **Privacy**: Zero-knowledge proofs (ZK-SNARKs)

### Backend

- **Runtime**: Node.js 22+
- **Framework**: Express 4.18
- **Database**: PostgreSQL 16
- **ORM**: Drizzle 0.30+
- **Cache**: Redis 7
- **WebSocket**: Socket.io 4.6
- **Validation**: Zod 3.22

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite 6
- **UI Library**: Material-UI 7
- **State**: Zustand 4.4
- **Data**: TanStack Query 5.17
- **Router**: React Router 6.21
- **Forms**: React Hook Form 7.49
- **Charts**: Recharts 2.10

### DevOps

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: (To be added: Sentry, DataDog)

---

**Last Updated**: March 24, 2026  
**Version**: 1.0.0  
**Author**: ShadowMarket Team
