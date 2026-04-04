# Shadow Market: Web Dashboard (`packages/web`)

The **Shadow Market Web Head** is a feature-rich React dashboard built with **Vite** for the modern web. It is designed to be the most accessible way for users to participate in prediction markets.

---

## 🛠️ Tech Stack

- **React / TypeScript**: Component-based architecture for advanced state management.
- **Vite**: Ultra-fast build and development server.
- **Tailwind CSS**: Modern utility-first styling for a sleek, responsive design.
- **Zustand**: Lightweight global state management for trade and wallet sync.

---

## 🏗️ Components

- **`/pages`**: Individual screens for markets, wallets, and user profiles.
- **`/components/charts`**: Visualizations for trade volumes and outcome odds.
- **`/components/trade`**: Trading panels for placing bets and managing wagers.
- **`/hooks`**: Custom React hooks for interacting with the **Headless SDK**.

---

## ⚙️ Development

### 1. Requirements
Ensure you have the latest Node.js and Pnpm versions.

### 2. Configuration
Copy `.env.example` to `.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_NETWORK_ID=local-net
```

### 3. Local Development
```bash
pnpm dev
```

### 4. Build for Production
```bash
pnpm build
```

---

## 🧪 Testing

To run the web test suite:
```bash
pnpm test
```
