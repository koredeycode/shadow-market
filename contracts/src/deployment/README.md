# Deployment Scripts

This folder contains deployment scripts for Shadow Market contracts.

## Current Deployment

### deploy-unified-local.ts

Deploys the unified prediction market contract to the local Midnight network.

**Usage:**
```bash
pnpm deploy
```

**What it does:**
1. Loads admin wallet from `.env` (or uses genesis wallet)
2. Syncs wallet with local network
3. Deploys unified prediction market contract
4. Saves deployment info to `deployments/unified-prediction-market-local.json`

**Prerequisites:**
- Local Midnight network running (Docker containers)
- Contract compiled (`pnpm compile`)
- Optional: `.env` file with `ADMIN_WALLET_SEED`

## Shared Utilities

### config.ts
Environment configuration loader:
- `getAdminWalletSeed()` - Load admin seed from .env
- `getPrivateStatePassword()` - Load private state password
- `loadEnvConfig()` - Parse .env file

### utils.ts
Deployment utilities:
- `createWallet()` - Initialize wallet from seed
- `createProviders()` - Setup contract providers
- Network configuration constants

## Legacy Deployment Scripts

Previous 4-contract deployment scripts have been archived to `../archived/`:
- `deploy-oracle-local.ts`
- `deploy-factory-local.ts`
- `deploy-prediction-local.ts`
- `deploy-p2p-local.ts`

## Environment Configuration

Create a `.env` file in the contracts root:

```bash
ADMIN_WALLET_SEED=0000000000000000000000000000000000000000000000000000000000000001
MIDNIGHT_NETWORK=local
MIDNIGHT_INDEXER_URL=http://127.0.0.1:8088/api/v3/graphql
PRIVATE_STATE_PASSWORD=dev-pw-x9k2m7n4q8
```

## Deployment Info

Deployment metadata is saved to `deployments/` folder:
- `unified-prediction-market-local.json` - Current deployment
- `archived/` - Old deployment files

Each deployment file contains:
- Contract address
- Contract type
- Network ID
- Deployment timestamp
- Deployer wallet address
- Circuit list
