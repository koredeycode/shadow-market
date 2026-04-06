#!/bin/bash

# Shadow Market Redeploy Automation Script
# This script compiles, deploys, and updates environment variables with the new contract address.
# It handles network-specific database resets and global CLI installation.

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 0. Check Network Parameter
NETWORK=${1:-undeployed}
START_STEP=${2:-1}

case $NETWORK in
  undeployed)
    DB_PORT=5434
    DB_NAME="shadowmarket_undeployed"
    ;;
  preview)
    DB_PORT=5435
    DB_NAME="shadowmarket_preview"
    ;;
  preprod)
    DB_PORT=5436
    DB_NAME="shadowmarket_preprod"
    ;;
  *)
    echo -e "${RED}Error: Unknown network '$NETWORK'. Use: undeployed | preview | preprod${NC}"
    exit 1
    ;;
esac

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}          SHADOW MARKET REDEPLOYMENT AUTOMATION               ${NC}"
echo -e "${BLUE}          Target Network: ${YELLOW}${NETWORK}${BLUE} (DB: ${DB_PORT})${NC}"
echo -e "${BLUE}          Starting from Step: ${YELLOW}${START_STEP}${NC}"
echo -e "${BLUE}==============================================================${NC}"

# Navigate to root directory
cd "$(dirname "$0")/../.."

# HELPER: Check if we should run this step
should_run() {
    if [[ "$START_STEP" =~ ^[0-9]+$ ]]; then
        if [ "$START_STEP" -le "$1" ]; then return 0; else return 1; fi
    fi
    # Support "skip" as a alias for starting at step 2
    if [ "$START_STEP" == "skip" ] && [ "$1" -eq 1 ]; then return 1; fi
    return 0
}

# 1. Compile Contracts
if should_run 1; then
    echo -e "\n${YELLOW}[1/11] Compiling contracts...${NC}"
    pnpm -C packages/contracts run compile
    pnpm -C packages/contracts build
else
    echo -e "\n${YELLOW}[1/11] Skipping contract compilation...${NC}"
fi

# 2. Synchronize Network Configuration
if should_run 2; then
    echo -e "\n${YELLOW}[2/11] Synchronizing network configuration for ${NETWORK}...${NC}"

    # Source of truth root files to update
    ROOT_ENV=".env"
    NETWORK_ENV=".env.${NETWORK}"
    LOCAL_ENV=".env.local"

    if [ ! -f "$NETWORK_ENV" ]; then
        echo -e "${RED}Error: Missing ${NETWORK_ENV} — cannot deploy to '${NETWORK}' without a network config file.${NC}"
        echo -e "${RED}Create ${NETWORK_ENV} with MIDNIGHT_NODE_URL, MIDNIGHT_INDEXER_URL, etc.${NC}"
        exit 1
    fi

    get_env_var() {
        local file=$1
        local var_name=$2
        if [ -f "$file" ]; then
            grep "^${var_name}=" "$file" | cut -d'=' -f2-
        fi
    }

    update_env_var() {
        local file=$1
        local var_name=$2
        local new_val=$3

        if [ -f "$file" ]; then
            if grep -q "^${var_name}=" "$file"; then
                sed -i "s|^${var_name}=.*|${var_name}=${new_val}|" "$file"
            else
                echo "${var_name}=${new_val}" >> "$file"
            fi
        fi
    }

    # Use the literal network name as the SDK network ID
    # SDK v2.0.0 uses preview/preprod/undeployed directly for HRP (mn_addr_preview, etc.)
    NETWORK_ID="$NETWORK"

    # Sync Network ID
    update_env_var "$ROOT_ENV" "MIDNIGHT_NETWORK_ID" "$NETWORK_ID"
    update_env_var "$NETWORK_ENV" "MIDNIGHT_NETWORK_ID" "$NETWORK_ID"
    update_env_var "$LOCAL_ENV" "MIDNIGHT_NETWORK_ID" "$NETWORK_ID"
    update_env_var "$ROOT_ENV" "VITE_NETWORK_ID" "$NETWORK_ID"
    update_env_var "$NETWORK_ENV" "VITE_NETWORK_ID" "$NETWORK_ID"
    update_env_var "$LOCAL_ENV" "VITE_NETWORK_ID" "$NETWORK_ID"

    # Sync URLs from the network-specific file to root .env and current session
    VARS=("MIDNIGHT_INDEXER_URL" "MIDNIGHT_INDEXER_WS_URL" "MIDNIGHT_NODE_URL" "MIDNIGHT_PROOF_SERVER_URL")
    for var in "${VARS[@]}"; do
        VAL=$(get_env_var "$NETWORK_ENV" "$var")
        if [ ! -z "$VAL" ]; then
            update_env_var "$ROOT_ENV" "$var" "$VAL"
            update_env_var "$LOCAL_ENV" "$var" "$VAL"
            export "$var=$VAL"
            echo -e "  Syncing ${BLUE}${var}${NC} -> ${VAL:0:40}..."
        fi
    done
else
    echo -e "\n${YELLOW}[2/11] Skipping network synchronization...${NC}"
fi

# Set network variables for Step 3 and beyond regardless of whether Step 2 ran
NETWORK_ID="$NETWORK"
export MIDNIGHT_NETWORK_ID=$NETWORK_ID
export NETWORK_ID=$NETWORK_ID

# Load existing URLs to ensure they are available to step 3 if step 2 was skipped
source_env() {
    if [ -f "$1" ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ ^MIDNIGHT_ ]]; then
                export "$line"
            fi
        done < "$1"
    fi
}
source_env ".env.${NETWORK}"

# Set SDK network name to match the literal network
export MIDNIGHT_NETWORK="$NETWORK"
export NODE_ENV="$NETWORK"

# 3. Deploy and Initialize
if should_run 3; then
    echo -e "\n${YELLOW}[3/11] Deploying and initializing contract to ${NETWORK}...${NC}"
    pnpm -C packages/contracts run deploy
else
    echo -e "\n${YELLOW}[3/11] Skipping deployment...${NC}"
fi

# 4. Extract New Contract Address
if should_run 4; then
    echo -e "\n${YELLOW}[4/11] Extracting new contract address...${NC}"
    DEPLOYMENT_FILE="packages/contracts/deployments/shadow-market-${NETWORK}.json"

    if [ ! -f "$DEPLOYMENT_FILE" ]; then
        echo -e "${RED}Error: Deployment file $DEPLOYMENT_FILE not found!${NC}"
        exit 1
    fi

    NEW_ADDRESS=$(jq -r '.contractAddress' "$DEPLOYMENT_FILE")

    if [ -z "$NEW_ADDRESS" ] || [ "$NEW_ADDRESS" == "null" ]; then
        echo -e "${RED}Error: Could not extract contract address from $DEPLOYMENT_FILE${NC}"
        exit 1
    fi

    echo -e "${GREEN}New Contract Address: ${NEW_ADDRESS}${NC}"

    # 5. Update Contract Address in Environment Files
    echo -e "\n${YELLOW}[5/11] Updating contract address in environment files...${NC}"
    
    # Update Contract Address in all Env files
    update_addr() {
        local file=$1
        local addr=$2
        if [ -f "$file" ]; then
            sed -i "s|^MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=.*|MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=${addr}|" "$file" 2>/dev/null || true
            sed -i "s|^VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=.*|VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=${addr}|" "$file" 2>/dev/null || true
            # Add if not present
            grep -q "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=" "$file" || echo "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=${addr}" >> "$file"
            grep -q "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=" "$file" || echo "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS=${addr}" >> "$file"
        fi
    }
    update_addr ".env" "$NEW_ADDRESS"
    update_addr ".env.${NETWORK}" "$NEW_ADDRESS"
    update_addr ".env.local" "$NEW_ADDRESS"
fi

# 6. Reset Database
if should_run 6; then
    echo -e "\n${YELLOW}[6/11] Resetting database for ${NETWORK}...${NC}"
    export DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/${DB_NAME}"

    # Ensure database exists
    echo -e "  Checking if database ${BLUE}${DB_NAME}${NC} exists on port ${BLUE}${DB_PORT}${NC}..."
    PGPASSWORD=postgres psql -h localhost -p "$DB_PORT" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    PGPASSWORD=postgres psql -h localhost -p "$DB_PORT" -U postgres -c "CREATE DATABASE ${DB_NAME}"

    echo -e "  Clearing drizzle migration files for a clean slate..."
    rm -rf packages/backend/drizzle/migrations/*

    pnpm db:clear
    pnpm db:migrate
fi

# 7. Copy ZK Proof Configurations
if should_run 7; then
    echo -e "\n${YELLOW}[7/11] Copying ZK proof configurations to frontend...${NC}"
    pnpm copy-zkconfig
fi

# 8. Build API
if should_run 8; then
    echo -e "\n${YELLOW}[8/11] Building API...${NC}"
    pnpm build:api
fi

# 9. Build Backend
if should_run 9; then
    echo -e "\n${YELLOW}[9/11] Building Backend...${NC}"
    pnpm build:backend
fi

# 10. Build Frontend
if should_run 10; then
    echo -e "\n${YELLOW}[10/11] Building Frontend...${NC}"
    pnpm build:frontend
fi

# 11. Build & Install CLI Globally
if should_run 11; then
    echo -e "\n${YELLOW}[11/11] Building and installing Cliff CLI globally...${NC}"
    pnpm -C packages/cli build
    cd packages/cli && npm install -g . && cd ../..
fi

# Final checks
echo -e "\n${GREEN}==============================================================${NC}"
echo -e "${GREEN}            REDEPLOYMENT STEP COMPLETED SUCCESSFULLY!         ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo -e "${BLUE}Network:          ${YELLOW}${NETWORK}${NC}"
echo -e "${BLUE}Project-wide environment files have been synchronized.${NC}\n"
