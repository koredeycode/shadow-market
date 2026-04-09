# Shadow Market: Terminal & CLI (`packages/cli`)

The **Shadow Market Terminal** is a high-performance, low-latency trading interface for power traders who prefer a "Bloomberg terminal" style experience.

---

## 🚀 Two Interaction Modes

### 1. **Shadow Terminal** (Recommended)
A visually rich terminal dashboard built with **Ink** (React for the CLI).
```bash
pnpm dev
```

### 2. **Command-Line Interface (CLI)**
A set of automation tools built with **Commander.js**.
```bash
pnpm start create-market ...
```

---

## 📟 Terminal Controller & Keybindings

The Shadow Terminal is built on a responsive component system that adapts to terminal resizing.

| Key | Action |
| :--- | :--- |
| `j`/`k` | Navigate through market lists. |
| `Enter` | Select market and view details. |
| `b` | Place a **Bet** on the selected market. |
| `w` | Open the **Wallet** and view balances. |
| `c` | **Claim** winnings from finished markets. |
| `q` | Quit the application. |

---

## 🛠️ Code Organization

- **`/src/tui`**: The React-based Ink components for the terminal dashboard.
- **`/src/commands`**: The command-line scripts for automation and devops.
- **`/src/core`**: Terminal-specific state management and layout logic.
- **`/src/utils`**: Terminal styling and output formatting utilities.

---

## ⚙️ Configuration

Set your `BACKEND_URL` and `NETWORK_ID` in `packages/cli/.env.local` to connect to the devnet or local network.
