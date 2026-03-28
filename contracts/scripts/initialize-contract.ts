/**
 * Initialize the unified prediction market contract
 *
 * This script calls the initialize() circuit on the deployed contract
 * to set it up for use. Must be run once after deployment.
 */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { pipe } from '@midnight-ntwrk/midnight-js-utils';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProviders } from '../src/deployment/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Initialize Unified Prediction Market Contract             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Load deployment info
    const deploymentPath = path.join(
      __dirname,
      '../deployments/unified-prediction-market-local.json'
    );

    if (!fs.existsSync(deploymentPath)) {
      throw new Error('Contract not deployed. Run "npm run deploy" first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    const contractAddress = deployment.contractAddress;

    console.log('📋 Contract Address:', contractAddress);
    console.log('🌐 Network: undeployed\n');

    // Create providers
    console.log('🔧 Creating providers...');
    const providers = await createProviders();

    // Find the deployed contract
    console.log('🔍 Finding deployed contract...');
    const contract = await pipe(findDeployedContract(providers, contractAddress), result => {
      if (result.type === 'error') {
        throw new Error(`Failed to find contract: ${result.error}`);
      }
      return result.deployed;
    });

    console.log('✅ Contract found!\n');

    // Call initialize circuit
    console.log('🚀 Calling initialize() circuit...');
    const txData = await contract.callTx.initialize();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                ✅ INITIALIZATION SUCCESS                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('  Transaction Hash:', txData.public.txHash);
    console.log('  Block Height:', txData.public.blockHeight);
    console.log('\n  Contract is now ready to use!');
    console.log('  - Create markets with createMarket()');
    console.log('  - Accept bets with placeBet()');
    console.log('  - Create wagers with createWager()\n');
  } catch (error: any) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║                ❌ INITIALIZATION FAILED                      ║');
    console.error('╚══════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

main();
