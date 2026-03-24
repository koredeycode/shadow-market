# 🌙 ShadowMarket

> **Privacy-Preserving Prediction Markets on Midnight Network**

A decentralized prediction market and peer-to-peer wagering platform that leverages zero-knowledge proofs to enable anonymous betting, confidential position sizes, and provably fair outcomes.

## 🎯 What is ShadowMarket?

ShadowMarket combines the best of prediction markets (like Polymarket) with the privacy guarantees of Midnight Network. Users can:

- **Bet on Future Events** - Sports, politics, crypto prices, or any verifiable outcome
- **Keep Positions Private** - Zero-knowledge proofs hide bet amounts and identities
- **Wager Peer-to-Peer** - Direct betting with custom odds, no intermediaries
- **Trade via AMM** - Automated market maker with dynamic pricing
- **Prove Fairness** - Cryptographic proof of correct outcome resolution

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start local Midnight network
pnpm network:start

# Setup database
pnpm db:generate
pnpm db:migrate

# Compile contracts
pnpm contracts:compile

# Start development servers
pnpm dev
```

Visit:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Midnight Network:** http://localhost:9944

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │  Privacy-first trading interface
└────────┬────────┘
         │
┌────────▼────────┐
│  Express API    │  REST + WebSocket + GraphQL
└────────┬────────┘
         │
┌────────▼────────┐
│  Midnight.js    │  SDK for contract interaction
└────────┬────────┘
         │
┌────────▼────────┐
│ Smart Contracts │  Compact language (ZK circuits)
│  • MarketFactory│  • PredictionMarket
│  • P2PWager     │  • LiquidityPool
│  • Oracle       │
└────────┬────────┘
         │
┌────────▼────────┐
│ Midnight Network│  Privacy blockchain
└─────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Contracts** | Compact 0.29+, ZK Circuits |
| **Backend** | Node.js 22+, TypeScript, Express, PostgreSQL, Redis |
| **Frontend** | React 19, TypeScript, Vite, Material-UI, TanStack Query |
| **Blockchain** | Midnight Network, Midnight.js SDK, Lace Wallet |
| **DevOps** | Docker, Docker Compose |

## ✨ Key Features

### Privacy Features
- ✅ **Anonymous Betting** - Addresses don't reveal identity
- ✅ **Hidden Amounts** - ZK commitments conceal bet sizes
- ✅ **Private Strategies** - Positions revealed only on claim
- ✅ **Confidential Profits** - Others can't see your P&L

### Market Features
- ✅ **Binary Markets** - YES/NO predictions
- ✅ **Automated Market Maker** - Constant product formula (Uniswap-style)
- ✅ **Peer-to-Peer Wagers** - Custom odds, direct matching
- ✅ **Liquidity Pools** - Earn fees as LP provider
- ✅ **Decentralized Oracles** - Multi-oracle consensus for outcomes

## 📁 Project Structure

```
shadow-market/
├── contracts/          # Smart contracts (Compact)
├── api/                # Shared API utilities
├── backend/            # Backend services (Express + Drizzle)
├── frontend/           # React web app
├── local-network/      # Local Midnight network setup
├── scripts/            # Development & deployment scripts
└── docs/               # Documentation
```

## 🧪 Development

```bash
# Development
pnpm dev              # Start all services
pnpm dev:contracts    # Watch & compile contracts
pnpm dev:backend      # Start backend with hot-reload
pnpm dev:frontend     # Start frontend dev server

# Testing
pnpm test             # Run all tests
pnpm test:contracts   # Test smart contracts
pnpm test:backend     # Test API endpoints
pnpm test:frontend    # Test React components

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Network
pnpm network:start    # Start local Midnight network
pnpm network:stop     # Stop network
pnpm network:logs     # View network logs
```

## 🔒 Privacy Model

| Data | Visibility |
|------|-----------|
| Market exists | 🟢 Public |
| Your bet amount | 🔴 Private (ZK commitment) |
| Your bet direction (YES/NO) | 🔴 Private (until claim) |
| Your profit/loss | 🔴 Private |
| Total market liquidity | 🟢 Public (aggregated) |
| Current prices | 🟢 Public (from AMM) |
| Final outcome | 🟢 Public |

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **Midnight Network** - For the privacy-preserving blockchain platform
- **Polymarket** - Inspiration for prediction market UX
- **Augur** - Pioneer in decentralized prediction markets
- **Uniswap** - AMM algorithm inspiration

---

**Built with 🌙 for the Midnight Hackathon**

*"Bet on the future, keep it to yourself"*
