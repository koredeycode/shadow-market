# ShadowMarket Developer Setup Guide

Complete guide for setting up your local development environment for ShadowMarket.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Smart Contracts Setup](#smart-contracts-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Full Stack](#running-the-full-stack)
7. [Database Management](#database-management)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Common Issues](#common-issues)

---

## 🔧 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or 20.x | Runtime environment |
| npm | 9.x+ | Package manager |
| PostgreSQL | 16+ | Database |
| Redis | 7.x+ | Caching and rate limiting |
| Docker | 24.x+ (optional) | Containerization |
| Git | 2.40+ | Version control |

### Install Node.js

**Using nvm (recommended)**:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

**Using package manager**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# macOS
brew install node@20

# Verify installation
node --version
npm --version
```

### Install PostgreSQL

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS**:
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Docker** (alternative):
```bash
docker run --name shadow-market-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shadow_market_dev \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Install Redis

**Ubuntu/Debian**:
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS**:
```bash
brew install redis
brew services start redis
```

**Docker** (alternative):
```bash
docker run --name shadow-market-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Midnight Network Tools

**Install Midnight SDK**:
```bash
npm install -g @midnight-ntwrk/midnight-js-sdk
```

**Verify installation**:
```bash
midnight --version
```

---

## 📦 Repository Setup

### Clone the Repository

```bash
git clone https://github.com/yourusername/shadow-market.git
cd shadow-market
```

### Install Dependencies

**Root dependencies**:
```bash
npm install
```

This installs dependencies for all workspaces (contracts, backend, frontend).

**Verify workspace structure**:
```bash
npm run list
```

You should see:
- `contracts/` - Smart contract code
- `backend/` - Express API server
- `frontend/` - React application

---

## 📜 Smart Contracts Setup

### Navigate to Contracts

```bash
cd contracts
```

### Install Contract Dependencies

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

This compiles `.compact` files and generates TypeScript bindings in `managed/`.

**Expected output**:
```
✓ Compiled MarketFactory
✓ Compiled PredictionMarket
✓ Compiled P2PWager
✓ Compiled LiquidityPool
✓ Compiled Oracle
✓ Generated TypeScript bindings
```

### Run Contract Tests

```bash
npm test
```

**Expected**: 120+ tests passing.

### Deploy to Local Network

**Start local Midnight node**:
```bash
# In a separate terminal
midnight-node --dev
```

**Deploy contracts**:
```bash
npm run deploy:local
```

**Save deployment addresses**:
```bash
# Output will show:
# MarketFactory: 0x...
# Oracle: 0x...
# Copy these to backend/.env
```

---

## 🔌 Backend Setup

### Navigate to Backend

```bash
cd ../backend
```

### Install Backend Dependencies

```bash
npm install
```

### Configure Environment

**Create `.env` file**:
```bash
cp .env.example .env
```

**Edit `.env`**:
```env
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shadow_market_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Midnight Network
MIDNIGHT_RPC_URL=http://localhost:8545
MIDNIGHT_NETWORK=devnet
MARKET_FACTORY_ADDRESS=0x... # From contract deployment
ORACLE_ADDRESS=0x...         # From contract deployment

# Encryption
ENCRYPTION_KEY=your-256-bit-encryption-key  # 32 bytes, base64

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window

# Logging
LOG_LEVEL=debug
```

**Generate secure secrets**:
```bash
# JWT secrets
openssl rand -base64 32
openssl rand -base64 32

# Encryption key
openssl rand -base64 32
```

### Setup Database

**Create database**:
```bash
createdb shadow_market_dev
```

**Run migrations**:
```bash
npm run db:push
```

This creates all tables using Drizzle ORM schema.

**Verify schema**:
```bash
npm run db:studio
```

Opens Drizzle Studio at http://localhost:4983

### Seed Development Data (Optional)

```bash
npm run db:seed
```

This creates:
- 5 sample markets
- 3 test users
- 10 sample wagers

### Start Backend Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

**Verify backend is running**:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-24T12:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

---

## ⚛️ Frontend Setup

### Navigate to Frontend

```bash
cd ../frontend
```

### Install Frontend Dependencies

```bash
npm install
```

### Configure Environment

**Create `.env` file**:
```bash
cp .env.example .env
```

**Edit `.env`**:
```env
# API
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Midnight Network
VITE_MIDNIGHT_NETWORK=devnet
VITE_MIDNIGHT_RPC_URL=http://localhost:8545

# Contract Addresses
VITE_MARKET_FACTORY_ADDRESS=0x...  # From deployment
VITE_ORACLE_ADDRESS=0x...           # From deployment

# Feature Flags
VITE_ENABLE_P2P=true
VITE_ENABLE_ANALYTICS=true

# Environment
VITE_ENV=development
```

### Start Development Server

```bash
npm run dev
```

Frontend will be available at http://localhost:5173

**Verify frontend**:
- Open http://localhost:5173 in browser
- Should see ShadowMarket homepage
- Check browser console for errors

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

**Preview production build**:
```bash
npm run preview
```

---

## 🚀 Running the Full Stack

### Option 1: Manual (3 Terminals)

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Background Services**:
```bash
# PostgreSQL (if not using system service)
docker start shadow-market-postgres

# Redis (if not using system service)
docker start shadow-market-redis

# Midnight local node
midnight-node --dev
```

### Option 2: Docker Compose

**Create `docker-compose.yml`** (in root):
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: shadow_market_dev
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/shadow_market_dev
      REDIS_URL: redis://redis:6379

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres-data:
  redis-data:
```

**Start all services**:
```bash
docker-compose up -d
```

**View logs**:
```bash
docker-compose logs -f
```

**Stop all services**:
```bash
docker-compose down
```

### Option 3: npm Scripts

**Add to root `package.json`**:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "test:all": "npm run test --workspaces"
  }
}
```

**Install concurrently**:
```bash
npm install -D concurrently
```

**Start everything**:
```bash
npm run dev
```

---

## 🗄️ Database Management

### Common Operations

**View current schema**:
```bash
cd backend
npm run db:studio
```

**Generate migration**:
```bash
npm run db:generate
```

**Apply migration**:
```bash
npm run db:migrate
```

**Reset database** (⚠️ destroys all data):
```bash
npm run db:drop
npm run db:push
npm run db:seed
```

### Backup and Restore

**Backup**:
```bash
pg_dump shadow_market_dev > backup.sql
```

**Restore**:
```bash
psql shadow_market_dev < backup.sql
```

### Query Database Directly

```bash
psql shadow_market_dev
```

**Useful queries**:
```sql
-- List all markets
SELECT id, question, status, end_time FROM markets;

-- Check wager counts
SELECT status, COUNT(*) FROM wagers GROUP BY status;

-- View recent positions
SELECT * FROM positions ORDER BY created_at DESC LIMIT 10;

-- Check user balances
SELECT user_id, COUNT(*) as position_count, SUM(amount) as total_staked
FROM positions GROUP BY user_id;
```

---

## 🧪 Testing

### Contract Tests

```bash
cd contracts
npm test
```

**Watch mode**:
```bash
npm test -- --watch
```

**Coverage**:
```bash
npm run test:coverage
```

### Backend Tests

```bash
cd backend
npm test
```

**Run specific test file**:
```bash
npm test -- markets.test.ts
```

**Integration tests**:
```bash
npm run test:integration
```

### Frontend Tests

```bash
cd frontend
npm test
```

**Component tests**:
```bash
npm run test:unit
```

**E2E tests**:
```bash
npm run test:e2e
```

**Update snapshots**:
```bash
npm test -- -u
```

### Run All Tests

**From root**:
```bash
npm test --workspaces
```

---

## 🐛 Debugging

### Backend Debugging

**VS Code launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

**Using inspector**:
```bash
cd backend
node --inspect dist/index.js
```

Then open `chrome://inspect` in Chrome.

### Frontend Debugging

**React DevTools**:
1. Install React DevTools extension
2. Open DevTools → Components tab
3. Inspect component state/props

**Redux DevTools** (if using Redux):
1. Install Redux DevTools extension
2. Open DevTools → Redux tab

**Network debugging**:
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Inspect API requests/responses

### Database Debugging

**Enable query logging**:

In `backend/src/db/index.ts`:
```typescript
export const db = drizzle(pool, {
  schema,
  logger: true, // Enable query logging
});
```

**PostgreSQL logs**:
```bash
tail -f /var/log/postgresql/postgresql-16-main.log
```

### WebSocket Debugging

**Using wscat**:
```bash
npm install -g wscat
wscat -c ws://localhost:3001
```

**In browser console**:
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => console.log('Received:', event.data);
ws.send(JSON.stringify({ type: 'subscribe', marketId: '123' }));
```

---

## 🔥 Common Issues

### Issue: Port Already in Use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Issue: Database Connection Failed

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check credentials
psql -U postgres -h localhost

# Reset password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
```

### Issue: Redis Connection Failed

**Error**:
```
Error: Redis connection to localhost:6379 failed
```

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server

# Or use Docker
docker start shadow-market-redis
```

### Issue: Contract Compilation Failed

**Error**:
```
Error: Cannot find module '@midnight-ntwrk/compact'
```

**Solution**:
```bash
# Reinstall dependencies
cd contracts
rm -rf node_modules package-lock.json
npm install

# Verify Midnight SDK
npm list @midnight-ntwrk/midnight-js-sdk
```

### Issue: Frontend Build Fails

**Error**:
```
Module not found: Can't resolve '@mui/material'
```

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: CORS Errors

**Error** (in browser console):
```
Access to fetch at 'http://localhost:3001' has been blocked by CORS policy
```

**Solution**:

Check `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

Or allow all origins (development only):
```env
CORS_ORIGIN=*
```

### Issue: Wallet Not Connecting

**Problem**: Lace wallet doesn't connect

**Solutions**:
1. Ensure Lace extension is installed
2. Refresh the page
3. Check browser console for errors
4. Try different browser
5. Clear browser cache/cookies

### Issue: Tests Failing

**Error**:
```
TypeError: Cannot read property 'mockImplementation' of undefined
```

**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install

# Run tests with verbose output
npm test -- --verbose
```

---

## 📚 Additional Resources

### Documentation
- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./backend/openapi.yaml)
- [User Guide](./USER_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### Tools
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) - Database GUI
- [Postman Collection](./docs/postman_collection.json) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

### Community
- Discord: [discord.gg/shadowmarket](#)
- GitHub Discussions: [github.com/shadowmarket/discussions](#)
- Stack Overflow: Tag `shadowmarket`

---

## 🎯 Next Steps

1. ✅ Complete this setup guide
2. 🔨 Make your first commit
3. 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md)
4. 🐛 Check [open issues](https://github.com/shadowmarket/issues)
5. 💡 Pick a "good first issue"
6. 🚀 Submit your first PR!

---

**Version**: 1.0.0  
**Last Updated**: March 24, 2026  
**Questions?**: dev@shadowmarket.io
