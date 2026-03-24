# ShadowMarket API Reference

Complete API reference for the ShadowMarket backend API. For interactive documentation, see the OpenAPI specification at [backend/openapi.yaml](./backend/openapi.yaml).

## 📖 Table of Contents

1. [Authentication](#authentication)
2. [Markets API](#markets-api)
3. [Wagers API](#wagers-api)
4. [Positions API](#positions-api)
5. [Oracles API](#oracles-api)
6. [Analytics API](#analytics-api)
7. [WebSocket Events](#websocket-events)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

ShadowMarket uses JWT (JSON Web Tokens) for authentication.

### Authentication Flow

1. **Connect Wallet**: User connects Lace wallet
2. **Request Challenge**: GET `/api/auth/challenge`
3. **Sign Challenge**: User signs challenge with wallet
4. **Verify Signature**: POST `/api/auth/verify`
5. **Receive Tokens**: Get access token and refresh token

### Endpoints

#### Get Authentication Challenge

```http
GET /api/auth/challenge?address=<wallet_address>
```

**Response**:
```json
{
  "challenge": "Sign this message to authenticate: 0x7a8f3b2e...",
  "expiresAt": "2026-03-24T12:15:00.000Z"
}
```

#### Verify Signature

```http
POST /api/auth/verify
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x8f4a3c2e...",
  "challenge": "Sign this message to authenticate: 0x7a8f3b2e..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user_123",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Using Access Tokens

Include the access token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Markets API

### List Markets

Get a paginated list of markets with filtering and sorting.

```http
GET /api/markets?status=OPEN&category=CRYPTO&sort=volume&page=1&limit=20
```

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status: `OPEN`, `LOCKED`, `RESOLVED`, `CANCELLED` | All |
| `category` | string | Filter by category: `CRYPTO`, `SPORTS`, `POLITICS`, etc. | All |
| `search` | string | Search in question text | - |
| `sort` | string | Sort by: `volume`, `liquidity`, `endTime`, `createdAt` | `createdAt` |
| `order` | string | Sort order: `asc`, `desc` | `desc` |
| `page` | number | Page number (1-indexed) | 1 |
| `limit` | number | Items per page (1-100) | 20 |

**Response**:
```json
{
  "markets": [
    {
      "id": "market_123",
      "question": "Will Bitcoin reach $100,000 by December 31, 2026?",
      "description": "Market resolves YES if BTC price >= $100k on Dec 31, 2026 23:59 UTC",
      "category": "CRYPTO",
      "status": "OPEN",
      "yesPrice": 65.5,
      "noPrice": 34.5,
      "yesPool": 1250000,
      "noPool": 850000,
      "volume": 5000000,
      "liquidity": 2100000,
      "endTime": "2026-12-31T23:59:59.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### Get Market Details

Get detailed information about a specific market.

```http
GET /api/markets/:id
```

**Response**:
```json
{
  "id": "market_123",
  "question": "Will Bitcoin reach $100,000 by December 31, 2026?",
  "description": "Market resolves YES if BTC price >= $100k on Dec 31, 2026 23:59 UTC",
  "category": "CRYPTO",
  "status": "OPEN",
  "yesPrice": 65.5,
  "noPrice": 34.5,
  "yesPool": 1250000,
  "noPool": 850000,
  "volume": 5000000,
  "liquidity": 2100000,
  "minBet": 1000,
  "maxBet": 100000,
  "fees": 0.003,
  "resolutionSource": "CoinGecko API",
  "endTime": "2026-12-31T23:59:59.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-03-24T12:00:00.000Z",
  "creator": {
    "id": "user_456",
    "address": "0x..."
  },
  "tags": ["bitcoin", "cryptocurrency", "2026"],
  "wagerCount": 1234,
  "participantCount": 567
}
```

### Get Market Chart Data

Get historical price data for charting.

```http
GET /api/markets/:id/chart?interval=1h&from=2026-03-01&to=2026-03-24
```

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `interval` | string | Time interval: `5m`, `15m`, `1h`, `4h`, `1d` | `1h` |
| `from` | string | Start date (ISO 8601) | 24h ago |
| `to` | string | End date (ISO 8601) | Now |

**Response**:
```json
{
  "marketId": "market_123",
  "interval": "1h",
  "data": [
    {
      "timestamp": "2026-03-24T10:00:00.000Z",
      "yesPrice": 64.2,
      "noPrice": 35.8,
      "volume": 125000
    },
    {
      "timestamp": "2026-03-24T11:00:00.000Z",
      "yesPrice": 65.5,
      "noPrice": 34.5,
      "volume": 98000
    }
  ]
}
```

### Create Market

Create a new prediction market (requires authentication).

```http
POST /api/markets
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "Will it rain in San Francisco on April 1, 2026?",
  "description": "Market resolves YES if >= 0.1 inches of rain recorded",
  "category": "WEATHER",
  "endTime": "2026-04-01T23:59:59.000Z",
  "minBet": 1000,
  "maxBet": 50000,
  "resolutionSource": "Weather.com API",
  "tags": ["weather", "san-francisco", "rain"]
}
```

**Response**: Same as Get Market Details (201 Created)

---

## 💰 Wagers API

### Place AMM Bet

Place a bet against the AMM liquidity pool.

```http
POST /api/wagers
Authorization: Bearer <token>
Content-Type: application/json

{
  "marketId": "market_123",
  "amount": 10000,
  "side": "YES",
  "commitment": "0x7a8f3b2e...",
  "slippageTolerance": 0.01,
  "proof": {
    "pi_a": ["0x...", "0x...", "0x..."],
    "pi_b": [["0x...", "0x..."], ["0x...", "0x..."], ["0x...", "0x..."]],
    "pi_c": ["0x...", "0x...", "0x..."]
  }
}
```

**Request Fields**:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `marketId` | string | Market ID | Yes |
| `amount` | number | Bet amount in tokens | Yes |
| `side` | string | `YES` or `NO` | Yes |
| `commitment` | string | Pedersen commitment (hex) | Yes |
| `slippageTolerance` | number | Max acceptable slippage (0-1) | No (default: 0.01) |
| `proof` | object | ZK proof of sufficient balance | Yes |

**Response**:
```json
{
  "id": "wager_789",
  "marketId": "market_123",
  "userId": "user_456",
  "type": "AMM",
  "side": "YES",
  "commitment": "0x7a8f3b2e...",
  "entryPrice": 65.5,
  "expectedPayout": 15254,
  "status": "ACTIVE",
  "createdAt": "2026-03-24T12:00:00.000Z",
  "transactionHash": "0x9f2e4a..."
}
```

### Create P2P Wager

Create a peer-to-peer wager offer.

```http
POST /api/wagers/p2p
Authorization: Bearer <token>
Content-Type: application/json

{
  "marketId": "market_123",
  "side": "YES",
  "stake": 10000,
  "odds": {
    "numerator": 3,
    "denominator": 1
  },
  "expiresAt": "2026-03-25T12:00:00.000Z"
}
```

**Response**:
```json
{
  "id": "wager_p2p_101",
  "marketId":="market_123",
  "creatorId": "user_456",
  "side": "YES",
  "creatorStake": 10000,
  "counterpartyStake": 3333,
  "odds": {
    "numerator": 3,
    "denominator": 1
  },
  "status": "OPEN",
  "expiresAt": "2026-03-25T12:00:00.000Z",
  "createdAt": "2026-03-24T12:00:00.000Z"
}
```

### Accept P2P Wager

Accept an open P2P wager.

```http
POST /api/wagers/p2p/:id/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "commitment": "0x8c5d4f...",
  "proof": {
    "pi_a": ["0x...", "0x...", "0x..."],
    "pi_b": [["0x...", "0x..."], ["0x...", "0x..."], ["0x...", "0x..."]],
    "pi_c": ["0x...", "0x...", "0x..."]
  }
}
```

**Response**:
```json
{
  "id": "wager_p2p_101",
  "status": "MATCHED",
  "counterpartyId": "user_789",
  "counterpartyCommitment": "0x8c5d4f...",
  "matchedAt": "2026-03-24T12:05:00.000Z",
  "transactionHash": "0xa3e7b9..."
}
```

### Cancel P2P Wager

Cancel your open P2P wager (before it's accepted).

```http
DELETE /api/wagers/p2p/:id
Authorization: Bearer <token>
```

**Response**: 204 No Content

---

## 📈 Positions API

### Get User Positions

Get all positions for the authenticated user.

```http
GET /api/positions?status=ACTIVE&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters**:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | `ACTIVE`, `SETTLED`, `CLAIMED` | All |
| `marketId` | string | Filter by specific market | - |
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (1-100) | 20 |

**Response**:
```json
{
  "positions": [
    {
      "id": "position_321",
      "userId": "user_456",
      "marketId": "market_123",
      "wagerId": "wager_789",
      "side": "YES",
      "entryPrice": 65.5,
      "currentPrice": 68.2,
      "status": "ACTIVE",
      "isWinner": null,
      "createdAt": "2026-03-24T12:00:00.000Z",
      "settledAt": null,
      "market": {
        "id": "market_123",
        "question": "Will Bitcoin reach $100,000 by December 31, 2026?",
        "status": "OPEN",
        "endTime": "2026-12-31T23:59:59.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Portfolio Statistics

Get aggregated statistics for the user's portfolio.

```http
GET /api/positions/stats
Authorization: Bearer <token>
```

**Response**:
```json
{
  "totalValue": 125000,
  "totalProfitLoss": 15000,
  "profitLossPercentage": 13.6,
  "winRate": 0.68,
  "totalVolume": 450000,
  "activePositions": 12,
  "settledPositions": 33,
  "totalWins": 22,
  "totalLosses": 11,
  "averagePositionSize": 10500,
  "biggestWin": 25000,
  "biggestLoss": -8000,
  "currentStreak": {
    "type": "WIN",
    "count": 4
  }
}
```

### Claim Winnings

Claim winnings from settled positions.

```http
POST /api/positions/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "positionIds": ["position_321", "position_322"]
}
```

**Response**:
```json
{
  "claimed": [
    {
      "positionId": "position_321",
      "amount": 15254,
      "transactionHash": "0xb4f8c3..."
    },
    {
      "positionId": "position_322",
      "amount": 8900,
      "transactionHash": "0xc5e9d4..."
    }
  ],
  "totalAmount": 24154
}
```

---

## 🔮 Oracles API

### Register as Oracle

Register to become an oracle (requires stake).

```http
POST /api/oracles/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "stake": 100000,
  "dataSource": "CoinGecko API, Weather.com API, ESPN API",
  "categories": ["CRYPTO", "SPORTS", "WEATHER"]
}
```

**Response**:
```json
{
  "id": "oracle_555",
  "userId": "user_456",
  "stake": 100000,
  "reputation": 0,
  "reports": 0,
  "successRate": 0,
  "status": "ACTIVE",
  "categories": ["CRYPTO", "SPORTS", "WEATHER"],
  "registeredAt": "2026-03-24T12:00:00.000Z"
}
```

### Submit Outcome Report

Submit an outcome report for a market.

```http
POST /api/oracles/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "marketId": "market_123",
  "outcome": true,
  "evidence": "BTC price was $105,234 at 2026-12-31 23:59:59 UTC per CoinGecko",
  "dataSource": "https://api.coingecko.com/api/v3/coins/bitcoin/history?date=31-12-2026"
}
```

**Response**:
```json
{
  "id": "report_777",
  "oracleId": "oracle_555",
  "marketId": "market_123",
  "outcome": true,
  "evidence": "BTC price was $105,234 at 2026-12-31 23:59:59 UTC per CoinGecko",
  "status": "PENDING",
  "submittedAt": "2026-01-01T00:05:00.000Z"
}
```

---

 ## 📉 Analytics API

### Get Platform Statistics

Get platform-wide statistics.

```http
GET /api/analytics/platform
```

**Response**:
```json
{
  "totalMarkets": 1567,
  "activeMarkets": 234,
  "totalVolume": 125000000,
  "totalLiquidity": 45000000,
  "totalUsers": 12345,
  "totalWagers": 98765,
  "volume24h": 2500000,
  "volumeChange24h": 12.5,
  "topCategories": [
    { "category": "CRYPTO", "volume": 55000000, "markets": 450 },
    { "category": "SPORTS", "volume": 38000000, "markets": 389 },
    { "category": "POLITICS", "volume": 20000000, "markets": 156 }
  ],
  "recentActivity": [
    {
      "type": "BET_PLACED",
      "marketId": "market_123",
      "amount": 15000,
      "timestamp": "2026-03-24T11:58:00.000Z"
    }
  ]
}
```

---

## 🔌 WebSocket Events

Connect to the WebSocket server for real-time updates.

### Connection

```javascript
const ws = new WebSocket('wss://api.shadowmarket.io');

ws.on('open', () => {
  console.log('Connected to ShadowMarket WebSocket');
});
```

### Subscribe to Market Updates

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  marketId: 'market_123'
}));
```

### Events

#### Market Price Update

```json
{
  "event": "market:priceUpdate",
  "data": {
    "marketId": "market_123",
    "yesPrice": 66.2,
    "noPrice": 33.8,
    "yesPool": 1265000,
    "noPool": 845000,
    "timestamp": "2026-03-24T12:05:00.000Z"
  }
}
```

#### New Bet Placed

```json
{
  "event": "market:betPlaced",
  "data": {
    "marketId": "market_123",
    "side": "YES",
    "priceImpact": 0.7,
    "volume": 10000,
    "timestamp": "2026-03-24T12:05:00.000Z"
  }
}
```

#### Market Locked

```json
{
  "event": "market:locked",
  "data": {
    "marketId": "market_123",
    "finalYesPrice": 68.5,
    "finalNoPrice": 31.5,
    "timestamp": "2026-12-31T23:59:59.000Z"
  }
}
```

#### Market Resolved

```json
{
  "event": "market:resolved",
  "data": {
    "marketId": "market_123",
    "outcome": true,
    "resolvedAt": "2027-01-02T00:00:00.000Z"
  }
}
```

---

## ⚠️ Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bet amount must be at least 1,000 tokens",
    "field": "amount",
    "timestamp": "2026-03-24T12:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., wager already accepted) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 🚦 Rate Limiting

ShadowMarket implements tiered rate limiting:

### Rate Limit Tiers

| Tier | Requests per 15min | Applies To |
|------|-------------------|------------|
| **Tier 1** | 1000 | Authenticated users (read operations) |
| **Tier 2** | 100 | Authenticated users (write operations) |
| **Tier 3** | 50 | Market creation, oracle operations |
| **Tier 4** | 10 | Anonymous users |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1711281600
```

### Rate Limit Exceeded

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 12 minutes.",
    "retryAfter": 720,
    "timestamp": "2026-03-24T12:00:00.000Z"
  }
}
```

---

## 🛠️ SDK Examples

### JavaScript/TypeScript

```typescript
import { ShadowMarketClient } from '@shadowmarket/sdk';

const client = new ShadowMarketClient({
  apiUrl: 'https://api.shadowmarket.io',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});

// List markets
const markets = await client.markets.list({
  status: 'OPEN',
  category: 'CRYPTO',
  page: 1,
  limit: 20
});

// Place bet
const wager = await client.wagers.placeBet({
  marketId: 'market_123',
  amount: 10000,
  side: 'YES',
  slippageTolerance: 0.01
});

// Get positions
const positions = await client.positions.list({
  status: 'ACTIVE'
});
```

---

## 📚 Additional Resources

- **OpenAPI Spec**: [backend/openapi.yaml](./backend/openapi.yaml)
- **Interactive API Docs**: https://api.shadowmarket.io/docs
- **Developer Setup**: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Version**: 1.0.0  
**Last Updated**: March 24, 2026  
**Support**: support@shadowmarket.io
