#!/bin/bash

# Shadow Market Redeploy Automation Script
# This script compiles, deploys, and updates environment variables with the new contract address.

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}          SHADOW MARKET REDEPLOYMENT AUTOMATION               ${NC}"
echo -e "${BLUE}==============================================================${NC}"

# 1. Compile Contracts
echo -e "\n${YELLOW}[1/5] Compiling contracts...${NC}"
pnpm contracts:compile
pnpm contracts:build

# 2. Deploy and Initialize
echo -e "\n${YELLOW}[2/5] Deploying and initializing contract to local network...${NC}"
# This runs the deploy.ts script which also calls initialize()
pnpm contracts:deploy:local

# 3. Extract New Contract Address
echo -e "\n${YELLOW}[3/5] Extracting new contract address...${NC}"
DEPLOYMENT_FILE="deployments/shadow-market-undeployed.json"

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

# 4. Update Environment Files
echo -e "\n${YELLOW}[4/5] Updating environment files...${NC}"

update_env_var() {
    local file=$1
    local var_name=$2
    local new_val=$3

    if [ -f "$file" ]; then
        if grep -q "^${var_name}=" "$file"; then
            # Update existing variable
            sed -i "s|^${var_name}=.*|${var_name}=${new_val}|" "$file"
            echo -e "  Updated ${BLUE}${var_name}${NC} in ${file}"
        else
            # Append if not exists
            echo "${var_name}=${new_val}" >> "$file"
            echo -e "  Added ${BLUE}${var_name}${NC} to ${file}"
        fi
    fi
}

# Update Root .env.local
update_env_var ".env.local" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var ".env.local" "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

# Update Root .env
update_env_var ".env" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var ".env" "MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

# Update Backend .env
update_env_var "backend/.env" "UNIFIED_CONTRACT_ADDRESS" "$NEW_ADDRESS"

# Update Frontend .env
update_env_var "frontend/.env" "VITE_UNIFIED_CONTRACT_ADDRESS" "$NEW_ADDRESS"
update_env_var "frontend/.env" "VITE_MIDNIGHT_SHADOW_MARKET_CONTRACT_ADDRESS" "$NEW_ADDRESS"

# 5. Copy ZK Proof Configurations
echo -e "\n${YELLOW}[5/5] Copying ZK proof configurations to frontend...${NC}"
pnpm copy-zkconfig

echo -e "\n${GREEN}==============================================================${NC}"
echo -e "${GREEN}            REDEPLOYMENT COMPLETED SUCCESSFULLY!              ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo -e "${BLUE}Contract Address: ${NEW_ADDRESS}${NC}"
echo -e "${BLUE}ZK proof artifacts have been synced to frontend/public/zk-config${NC}"
echo -e "${BLUE}You can now restart your dev servers.${NC}\n"
