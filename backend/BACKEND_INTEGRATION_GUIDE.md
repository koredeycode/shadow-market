# Backend Integration - Admin Panel & Trending Features

## Overview

This backend implementation adds:

1. **Admin Panel**: Full admin dashboard with analytics, market management, user management
2. **Trending System**: Real-time trending algorithm based on volume, upvotes, and recency
3. **Upvoting**: User upvoting system for markets
4. **Activity Logging**: Comprehensive admin activity tracking

## Files Created

### Middleware

- `src/middleware/is-admin.ts` - Admin authorization middleware

### Services

- `src/services/admin.service.ts` - Admin operations (stats, market mgmt, user mgmt, activity log)

### Routes

- `src/routes/admin.ts` - Admin API endpoints

### Migrations

- `migrations/001_admin_and_trending.sql` - Database schema changes

## Files Modified

### Database Schema

- `src/db/schema.ts`
  - Added to `users` table: `isAdmin`, `isBlocked`, `kycStatus`
  - Added to `markets` table: `upvotes`, `trendingScore`, `volumeChange24h`, `isFeatured`, `isVerified`, `reportCount`
  - New table: `marketUpvotes` - Track user upvotes
  - New table: `adminActivityLog` - Track admin actions
  - New enum: `kycStatusEnum` - KYC status values

### Services

- `src/services/market.service.ts`
  - Enhanced `getTrendingMarkets()` with trending algorithm
  - Added `getNewMarkets()` - Recently created markets
  - Added `upvoteMarket()` - User upvote action
  - Added `removeUpvote()` - Remove upvote
  - Added `updateTrendingScores()` - Background trending calculation

### Routes

- `src/routes/markets.ts`
  - Added `GET /new` - Get new markets
  - Added `POST /:id/upvote` - Upvote market
  - Added `DELETE /:id/upvote` - Remove upvote

### Application

- `src/app.ts`
  - Mounted admin routes at `/api/admin`

## API Endpoints

### Admin Routes (All require authentication + admin role)

#### Dashboard

- `GET /api/admin/stats` - Platform statistics
  ```json
  {
    "totalMarkets": 150,
    "activeMarkets": 89,
    "totalVolume": "1000000",
    "totalUsers": 500,
    "platformFees": "20000"
  }
  ```

#### Market Management

- `GET /api/admin/markets` - List all markets (admin view)
  - Query params: `status`, `search`, `featured`, `verified`, `limit`, `offset`
- `POST /api/admin/markets/:id/toggle-featured` - Toggle featured status
- `POST /api/admin/markets/:id/toggle-verified` - Toggle verified status
- `POST /api/admin/markets/:id/lock` - Lock market (no more betting)
- `POST /api/admin/markets/:id/resolve` - Resolve market
  - Body: `{ "outcome": 0 | 1 }`
- `POST /api/admin/markets/:id/cancel` - Cancel market
  - Body: `{ "reason": "explanation" }`

#### User Management

- `GET /api/admin/users` - List all users
  - Query params: `search`, `blocked`, `kycStatus`, `limit`, `offset`
- `POST /api/admin/users/:id/toggle-block` - Block/unblock user
- `POST /api/admin/users/:id/kyc` - Update KYC status
  - Body: `{ "status": "APPROVED" | "REJECTED" | "PENDING" | "NONE" }`

#### Activity & Analytics

- `GET /api/admin/activity-log` - Admin activity log
  - Query params: `limit` (default 50)
- `GET /api/admin/revenue` - Revenue statistics
  - Query params: `range` - "24h" | "7d" | "30d"

### Market Routes (Public/Authenticated)

- `GET /api/markets/trending` - Trending markets (existing, enhanced)
  - Query params: `limit` (default 10)
- `GET /api/markets/new` - Newly created markets
  - Query params: `limit` (default 10)
- `POST /api/markets/:id/upvote` - Upvote market (requires authentication)
- `DELETE /api/markets/:id/upvote` - Remove upvote (requires authentication)

## Database Migration

### Apply Migration

Run the SQL migration file:

```bash
psql -U your_user -d your_database -f migrations/001_admin_and_trending.sql
```

Or using your database client/ORM migration tool.

### Migration Summary

**New Columns:**

- `users.is_admin` (BOOLEAN)
- `users.is_blocked` (BOOLEAN)
- `users.kyc_status` (ENUM)
- `markets.upvotes` (INTEGER)
- `markets.trending_score` (DECIMAL)
- `markets.volume_change_24h` (DECIMAL)
- `markets.is_featured` (BOOLEAN)
- `markets.is_verified` (BOOLEAN)
- `markets.report_count` (INTEGER)

**New Tables:**

- `market_upvotes` (marketId, userId, createdAt)
- `admin_activity_log` (id, adminId, action, targetType, targetId, details, ipAddress, createdAt)

**New Indexes:**

- Markets: trending_score, upvotes, is_featured, is_verified
- Users: is_admin, is_blocked
- Market upvotes: market_id, user_id
- Activity log: admin_id, target, created_at

## Trending Algorithm

The trending score is calculated using:

```typescript
trendingScore = volumeChange24h * 0.4 + upvoteChange * 30 + recencyScore * 0.3;
```

Where:

- **volumeChange24h**: Change in volume over last 24 hours (40% weight)
- **upvoteChange**: Number of upvotes (weighted by 30, contributes 30% conceptually)
- **recencyScore**: Age-based score (0-100, newer = higher, 30% weight)

### Background Updates

The `updateTrendingScores()` method should be called periodically (e.g., via cron job every 15 minutes) to keep trending scores fresh.

Example cron setup:

```typescript
import cron from 'node-cron';
import { MarketService } from './services/market.service';

const marketService = new MarketService();

// Update trending scores every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  await marketService.updateTrendingScores();
  console.log('Trending scores updated');
});
```

## Admin Setup

### Creating an Admin User

Update a user to have admin privileges:

```sql
UPDATE users SET is_admin = TRUE WHERE address = 'admin_wallet_address';
```

Or via API (requires database access):

```typescript
await db.update(users).set({ isAdmin: true }).where(eq(users.address, 'admin_wallet_address'));
```

## Smart Contract Integration (TODO)

The following admin actions need to call smart contract circuits:

1. **Lock Market** (`adminService.lockMarket`)
   - Should call unified contract `lockMarket` circuit
   - Contract: `cd9dae0f85be015b6b6c6b4008de30fc0be98d55bbf6b61f0fbda0e359f9aea7`

2. **Resolve Market** (`adminService.resolveMarket`)
   - Should call unified contract `resolveMarket` circuit
   - Pass outcome (0 = NO, 1 = YES)

To implement:

```typescript
// In admin.service.ts
import { unifiedContract } from '../contracts/unified-contract';

async lockMarket(marketId: string, adminId: string) {
  // Update database
  const updated = await db.update(markets)...;

  // Call smart contract
  await unifiedContract.lockMarket({
    marketId: updated.onchainId,
    // ... other params
  });

  return updated;
}
```

## Security Considerations

1. **Admin Authentication**: All admin routes are protected by `authenticate` + `isAdmin` middleware
2. **Activity Logging**: All admin actions are logged with IP addresses
3. **Validation**: All inputs are validated using Zod schemas
4. **SQL Injection**: Using Drizzle ORM prevents SQL injection
5. **Rate Limiting**: Consider adding rate limits to admin endpoints
6. **CORS**: Ensure CORS is properly configured for admin panel domain

## Testing

### Test Admin Endpoints

```bash
# Get admin stats
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/admin/stats

# Lock a market
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/admin/markets/:id/lock

# Resolve market
curl -X POST \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"outcome": 1}' \
  http://localhost:3000/api/admin/markets/:id/resolve
```

### Test Upvoting

```bash
# Upvote a market
curl -X POST \
  -H "Authorization: Bearer <user_token>" \
  http://localhost:3000/api/markets/:id/upvote

# Remove upvote
curl -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  http://localhost:3000/api/markets/:id/upvote
```

## Frontend Integration

The frontend already expects these endpoints and has been configured with:

- Admin dashboard at `/admin`
- Admin market management at `/admin/markets`
- Trending/New tabs on home page
- Upvote buttons on market cards
- Real-time updates (10s-30s intervals)

All API client methods match these backend endpoints.

## Performance Optimization

1. **Trending Score Caching**: Consider caching trending scores in Redis
2. **Database Indexes**: All critical fields are indexed
3. **Pagination**: All list endpoints support pagination
4. **Query Optimization**: Use `select()` to limit returned columns when possible

## Monitoring

Add monitoring for:

- Admin action frequency
- Trending algorithm performance
- Upvote rate trends
- API response times
- Database query performance

## Next Steps

1. ✅ Apply database migration
2. ✅ Create admin user account
3. ⏳ Implement smart contract integration for lock/resolve
4. ⏳ Set up cron job for trending score updates
5. ⏳ Add rate limiting to admin endpoints
6. ⏳ Set up monitoring and logging
7. ⏳ Write integration tests
8. ⏳ Deploy and test in staging environment

## Support

For issues or questions:

- Check error logs: `backend/logs/`
- Review activity log: `GET /api/admin/activity-log`
- Verify database schema: `\d+ markets` and `\d+ users` in psql
- Check TypeScript compilation: `npm run build`
