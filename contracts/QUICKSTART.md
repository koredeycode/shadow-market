# Contract Deployment - Quick Start

## 🚀 Deploy Your First Market

### 1. Compile the Contract

```bash
cd contracts
pnpm compile
```

### 2. Deploy to Preprod Testnet

```bash
pnpm deploy
```

Follow the prompts:

- Choose "Create new wallet" (option 1)
- **SAVE THE SEED** shown on screen
- Visit https://faucet.preprod.midnight.network/ with the wallet address
- Request testnet funds
- Wait for funds and DUST registration
- Enter your market question (e.g., "Will Bitcoin reach $100k in 2026?")
- Wait 30-90 seconds for deployment

### 3. Check Deployment

```bash
cat deployments/latest.json
```

You'll see:

```json
{
  "contractAddress": "0x...",
  "question": "Will Bitcoin reach $100k in 2026?",
  "endTime": 1743033600,
  "endTimeISO": "2026-04-03T00:00:00.000Z",
  "seed": "your-64-char-seed",
  "network": "preprod",
  "deployedAt": "2026-03-27T...",
  "walletAddress": "bech32..."
}
```

### 4. Update Backend

```bash
cd ../backend
echo "CONTRACT_ADDRESS=<address-from-latest.json>" >> .env
echo "MIDNIGHT_NETWORK=preprod" >> .env
```

### 5. Test Interaction (Optional)

```bash
cd ../contracts
pnpm interact
```

## 📁 What Got Created

```
contracts/
├── src/
│   ├── deploy.ts         # Deployment script
│   ├── interact.ts       # Interaction script
│   ├── utils.ts          # Wallet & provider utilities
│   └── managed/          # Compiled contract artifacts
│       └── market-stub/
│           ├── contract/ # Contract code
│           ├── keys/     # ZK proving keys
│           └── zkir/     # ZK intermediate representation
└── deployments/          # Deployment records
    └── latest.json       # Most recent deployment
```

## 🔄 Deploy Multiple Markets

Each deployed contract represents one prediction market. To create multiple markets:

```bash
pnpm deploy  # Creates Market #1
pnpm deploy  # Creates Market #2
pnpm deploy  # Creates Market #3
```

Each deployment creates a new contract address stored in timestamped files.

## 🌐 Network Options

**Preprod (Testnet)** - Default, recommended for testing:

```bash
pnpm deploy
```

**Local Development** - Requires running midnight-local-dev:

```bash
pnpm deploy:local
```

## 📊 Current Contract Capabilities

The stub contract supports:

- ✅ Market creation with question
- ✅ State management (OPEN → CLOSED → RESOLVED)
- ✅ Bet commitment storage
- ✅ Basic circuits (placeBet, closeMarket, resolveMarket)

Not yet implemented (requires Compact 0.29+):

- ❌ Privacy features (true ZK proofs)
- ❌ AMM pricing calculations
- ❌ Payout distribution
- ❌ Factory pattern for market creation

## 🔗 Integration Points

After deployment, integrate with:

1. **Backend API**: Update .env with CONTRACT_ADDRESS
2. **Frontend**: Connect via DApp Connector API (already done)
3. **Oracle Service**: For market resolution
4. **Indexer**: Query ledger state for market data

## 🛠️ Troubleshooting

**"Contract not compiled"**

```bash
pnpm compile
```

**"Proof server not running"**
Start on port 6300:

```bash
# Terminal 1
cd /path/to/midnight-local-dev
pnpm proof-server:start
```

**"Insufficient funds"**
Visit https://faucet.preprod.midnight.network/

**"DUST tokens not ready"**
Wait 30-60 seconds after funding for automatic DUST generation.

## 📚 More Details

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive documentation.
