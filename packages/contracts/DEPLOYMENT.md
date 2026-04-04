# Contract Deployment Guide

This directory contains the deployment infrastructure for ShadowMarket smart contracts on the Midnight Network.

## Prerequisites

1. **Compile the contract**:

   ```bash
   pnpm compile
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start local proof server** (if not already running):
   ```bash
   # In a separate terminal, from workspace root
   cd /path/to/midnight-local-dev
   pnpm proof-server:start
   ```

## Network Configuration

The deployment scripts support two networks:

- **Preprod** (default): Midnight pre-production testnet
- **Local**: Local development network

Set network via environment variable:

```bash
export MIDNIGHT_NETWORK=preprod  # or 'local'
```

## Deployment Process

### 1. Deploy to Preprod

```bash
pnpm deploy
```

Follow the interactive prompts:

1. Choose to create new wallet or restore from seed
2. **Save the seed** - you'll need it later!
3. Fund wallet at https://faucet.preprod.midnight.network/
4. Wait for DUST token registration
5. Enter market question
6. Contract deploys (takes 30-90 seconds)

Deployment info saved to `deployments/latest.json`.

### 2. Deploy to Local Network

First, ensure your local Midnight network is running:

```bash
cd /path/to/midnight-local-dev
pnpm network:start
```

Then deploy:

```bash
pnpm deploy:local
```

## Interacting with Deployed Contract

```bash
pnpm interact
```

This provides an interactive menu to:

- View market state
- Place bets
- Close market
- Resolve market

## Deployment Files

After deployment, you'll find:

```
deployments/
  +- latest.json                    # Latest deployment info
  +- deployment-2026-03-27T....json # Timestamped deployment record
```

Each deployment file contains:

- `contractAddress`: Deployed contract address
- `question`: Market question
- `seed`: Wallet seed (keep secure!)
- `network`: Network used (preprod/local)
- `deployedAt`: Deployment timestamp
- `walletAddress`: Deployer wallet address

## Using in Backend

Update `backend/.env` with deployed contract address:

```env
CONTRACT_ADDRESS=<contractAddress from latest.json>
MIDNIGHT_NETWORK=preprod
```

## Network Configuration Details

### Preprod Network

- Indexer: https://indexer.preprod.midnight.network/api/v3/graphql
- RPC: https://rpc.preprod.midnight.network
- Faucet: https://faucet.preprod.midnight.network/
- Network ID: `preprod`

### Local Network

- Indexer: http://127.0.0.1:8088/api/v3/graphql
- RPC: http://127.0.0.1:9944
- Network ID: `undeployed`

## Troubleshooting

### Contract not compiled

```bash
pnpm compile
```

### Proof server not running

Start proof server on port 6300:

```bash
cd /path/to/midnight-local-dev
pnpm proof-server:start
```

### Insufficient funds

- **Preprod**: Visit faucet.preprod.midnight.network
- **Local**: Use midnight-local-dev funding utilities

### DUST registration pending

Wait 30-60 seconds for DUST token generation after funding wallet.

## Next Steps

After deployment:

1.  Contract is live on Midnight Network
2.  Update backend with contract address
3.  Test contract interaction via `pnpm interact`
4.  Integrate contract calls into API endpoints

## Contract Stub Limitations

The current `market-stub.compact` is a simplified version with:

- Basic state tracking (OPEN, CLOSED, RESOLVED)
- Bet commitment storage
- Market lifecycle (place bet, close, resolve)
- No privacy features (witnesses disclosed)
- No AMM pricing calculations
- No payout distribution

Full contract implementation will require Compact language version 0.29+.
