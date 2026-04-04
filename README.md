# 🌑 Shadow Market

A privacy-first, decentralized prediction market built on the **Midnight Network**. 

Shadow Market uses Zero-Knowledge (ZK) technology to enable private trading of binary and multi-choice outcomes while ensuring trustless settlement.

---

## 🏗️ Project Structure

The project is organized as a **Pnpm Monorepo** using the "Tri-Head" architecture.

```bash
shadow-market/
├── packages/
│   ├── api/          # 🧠 "Headless" SDK: Shared logic & on-chain handlers.
│   ├── backend/      # 🖥️ Off-chain database, API server, and WebSockets.
│   ├── cli/          # 📟 Terminal Head: Interactive TUI and CLI tools.
│   ├── web/          # 🌐 Web Head: React + Vite trading dashboard.
│   ├── contracts/    # 📜 Midnight Ledger: Compact contracts and circuits.
│   └── scripts/      # 🛠️ Maintenance and deployment automation scripts.
├── pnpm-workspace.yaml
├── ARCHITECTURE.md    # 🗺️ Technical deep-dive on design patterns.
└── README.md          # 📍 You are here.
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Pnpm** (v8+)
- **Midnight Compiler** (`compact`)

### 2. Initialization
Install all dependencies for all heads:
```bash
pnpm install
```

### 3. Running the Terminal (TUI)
For the low-latency trading experience:
```bash
pnpm --filter cli dev
```

### 4. Running the Web App
For the visual trading experience:
```bash
pnpm --filter web dev
```

---

## ⚡ Key Features

- **Private Wagers**: Your bet amount and side are never revealed publicly.
- **ZK Claims**: Prove you won a bet and claim your reward without revealing your identity.
- **Tri-Head Access**: Trade via Web, Terminal, or CLI depending on your style.
- **Offline Mode**: A local-first architecture for the backend ensures high availability.

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System design and technical specs.
- **[Back-end Guide](./packages/backend/README.md)**: Database and API schema.
- **[Terminal Guide](./packages/cli/README.md)**: TUI keybindings and commands.
- **[Contract Guide](./packages/contracts/README.md)**: Compact language details.

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## ⚖️ License

Shadow Market is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
