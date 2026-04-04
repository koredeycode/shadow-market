# Shadow Market: Backend Server (`packages/backend`)

The **Shadow Market Backend** is the off-chain companion that manages transient data, database-backed indexing, and real-time state synchronization via WebSockets.

---

## 🛠️ Features

- **Off-chain Discovery**: Synchronizes on-chain market IDs with off-chain descriptions and metadata.
- **Database Indexer**: Uses **Drizzle ORM** with PostgreSQL (via Docker) to store and query market state fast.
- **Real-Time Sync**: Provides **WebSocket** updates to the Web and TUI heads for instant trade status notifications.

---

## ⚙️ Development

### 1. Requirements
Ensure you have Docker and Docker Compose installed for the database:
```bash
docker compose up -d
```

### 2. Configuration
Copy `.env.example` to `.env.local` and set your database connection details.

### 3. Database Migration
```bash
pnpm db:push
```

### 4. Running the Server
```bash
pnpm dev
```

---

## 📂 Code Organization

- **`/src/db`**: Schema definitions and migrations.
- **`/src/routes`**: API endpoints for market lookups and metadata.
- **`/src/services`**: Business logic for indexing and WebSocket dispatch.
- **`/src/middleware`**: Authentication and error handling.
- **`/src/validation`**: Z-schema validation for incoming data.

---

## 🧪 Testing

To run the backend test suite:
```bash
pnpm test
```
