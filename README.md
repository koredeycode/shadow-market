# 🌑 Shadow Market
### Private Prediction Markets on Midnight

**Shadow Market** is a privacy-first, decentralized prediction market built on the **Midnight Network**. Leveraging Zero-Knowledge (ZK) technology, it allows traders to predict and wager on outcomes without revealing their positions, identity, or bet sizes to the public ledger.

---

## 🔗 Quick Links

- **🌐 Live Demo**: [shadow-market-demo.vercel.app](https://shadow-market-demo.vercel.app/)
- **📺 Demo Video**: [Watch on YouTube](https://youtu.be/5QBzzfqzUcY)

[![Shadow Market Demo](https://img.youtube.com/vi/5QBzzfqzUcY/0.jpg)](https://youtu.be/5QBzzfqzUcY)

---

## ✨ Key Innovations

- **The "Tri-Head" Architecture**: A compositing design that provides three distinct ways to trade:
    - 🌐 **Web Dashboard**: High-fidelity, visual trading with social features.
    - 📟 **Terminal UI (TUI)**: Low-latency, keyboard-driven interface for power users.
    - 🛠️ **CLI Tooling**: Programmable interactions for automation and integrations.
- **Zero-Knowledge Privacy**: Built using Midnight's **COMPACT** language, ensuring that your financial strategies and identity remain shielded.
- **ZK Claims**: Prove you are the winner of a bet and claim rewards without linking your identity to the transaction.
- **Cross-Head Session Sync**: Securely link your terminal session to your web wallet using cryptographic signatures—no private keys ever leave your browser.

---

## 🏗️ Project Structure

The project is managed as a **pnpm** monorepo:

```bash
shadow-market/
├── packages/
│   ├── api/          # 🧠 "Headless" SDK: Shared ZK logic & on-chain handlers.
│   ├── backend/      # 🖥️ Off-chain indexing, WebSockets, and Session API.
│   ├── cli/          # 📟 Terminal Head: Interactive Ink-based TUI.
│   ├── web/          # 🌐 Web Head: React + Vite trading dashboard.
│   ├── contracts/    # 📜 Midnight Ledger: Compact contracts and circuits.
│   └── scripts/      # 🛠️ Automation: Bootstrapping and deployment.
├── ARCHITECTURE.md    # 🗺️ Technical deep-dive on compositing strategy.
├── DEV_GUIDE.md        # 🛠️ Step-by-step local development & testing.
└── README.md          # 📍 Project entry point.
```

---

## 🚀 Quick Start (Demo Mode)

To get Shadow Market running locally:

### 1. Prerequisites
- **Node.js** (v20+)
- **pnpm** (v8+)
- **Docker** (for PostgreSQL and Midnight node)

### 2. Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Spin up infrastructure
docker-compose up -d
```

### 3. Start the Engines
```bash
# 1. Start the Backend API (Terminal 1)
pnpm --filter backend dev

# 2. Start the Web Dashboard (Terminal 2)
pnpm --filter web dev

# 3. Start the Terminal UI (Terminal 3)
pnpm --filter cli dev:tui
```

---

## 🛠️ Developer Resources

- **[Architecture Deep-Dive](./ARCHITECTURE.md)**: Understand the Tri-Head pattern.
- **[Local Test Protocol](./DEV_GUIDE.md)**: How to run ZK circuits locally.
- **[CLI Reference](./packages/cli/README.md)**: Commands for the terminal interface.

---

## ⚖️ License

Shadow Market is licensed under the MIT License. Built for the **Midnight Network Hackathon 2024**.

---

**Shadow Market | Privacy as a Standard**
