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
echo -e "${BLUE}==============================================================${NC}"

# Navigate to root directory
cd "$(dirname "$0")/../.."

# 1. Compile Contracts
echo -e "\n${YELLOW}[1/11] Compiling contracts...${NC}"
pnpm -C packages/contracts run compile
pnpm -C packages/contracts build

# 2. Deploy and Initialize
echo -e "\n${YELLOW}[2/11] Deploying and initializing contract to ${NETWORK}...${NC}"
export MIDNIGHT_NETWORK=$NETWORK
pnpm -C packages/contracts run deploy

# 3. Extract New Contract Address
echo -e "\n${YELLOW}[3/11] Extracting new contract address...${NC}"
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

# 4. Update Environment Files (Root Unified Strategy)
echo -e "\n${YELLOW}[4/11] Updating environment files...${NC}"

update_env_var() {
    local file=$1
    local var_name=$2
    local new_val=$3

    if [ -f "$file" ]; then
        if grep -q "^${var_name}=" "$file"; then
            sed -i "s|^${var_name}=.*|${var_name}=${new_val}|" "$file"
            echo -e "  Updated ${BLUE}${var_name}${NC} in ${file}"
        else
            echo "${var_name}=${new_val}" >> "$file"
            echo -e "  Added ${BLUE}${var_name}${NC} to ${file}"
        fi
    fi
}

# Source of truth root files to update
ROOT_ENV=".env"
NETWORK_ENV=".env.${NETWORK}"
LOCAL_ENV=".env.local"

# Update Contract Address in Root Environment
update_env_var "$ROOT_ENV" "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var "$ROOT_ENV" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

update_env_var "$NETWORK_ENV" "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var "$NETWORK_ENV" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

update_env_var "$LOCAL_ENV" "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var "$LOCAL_ENV" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

# 5. Reset Database
echo -e "\n${YELLOW}[5/11] Resetting database for ${NETWORK}...${NC}"
export DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/${DB_NAME}"

# Ensure database exists
echo -e "  Checking if database ${BLUE}${DB_NAME}${NC} exists on port ${BLUE}${DB_PORT}${NC}..."
PGPASSWORD=postgres psql -h localhost -p "$DB_PORT" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
PGPASSWORD=postgres psql -h localhost -p "$DB_PORT" -U postgres -c "CREATE DATABASE ${DB_NAME}"

pnpm db:clear
pnpm db:migrate

# 6. Copy ZK Proof Configurations
echo -e "\n${YELLOW}[6/11] Copying ZK proof configurations to frontend...${NC}"
pnpm copy-zkconfig

# 7. Build API
echo -e "\n${YELLOW}[7/11] Building API...${NC}"
pnpm build:api

# 8. Build Backend
echo -e "\n${YELLOW}[8/11] Building Backend...${NC}"
pnpm build:backend

# 9. Build Frontend
echo -e "\n${YELLOW}[9/11] Building Frontend...${NC}"
pnpm build:frontend

# 10. Build & Install CLI Globally
echo -e "\n${YELLOW}[10/11] Building and installing Cliff CLI globally...${NC}"
pnpm -C packages/cli build
cd packages/cli && npm install -g . && cd ../..

# 11. Final checks
echo -e "\n${GREEN}==============================================================${NC}"
echo -e "${GREEN}            REDEPLOYMENT COMPLETED SUCCESSFULLY!              ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo -e "${BLUE}Network:          ${YELLOW}${NETWORK}${NC}"
echo -e "${BLUE}Contract Address: ${YELLOW}${NEW_ADDRESS}${NC}"
echo -e "${BLUE}DB Port:          ${YELLOW}${DB_PORT}${NC}"
echo -e "${BLUE}CLI:              ${YELLOW}shadow-market${BLUE} command is now global.${NC}"
echo -e "${BLUE}Project-wide environment files have been synchronized.${NC}\n"
