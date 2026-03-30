/**
 * Initialize the unified prediction market contract
 *
 * This script calls the initialize() circuit on the deployed contract
 * to set it up for use. Must be run once after deployment.
 */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWallet, createProviders } from '../deployment/utils.js';
import { getAdminWalletSeed } from '../deployment/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('\n+--------------------------------------------------------------+');
  console.log('|   Initialize Shadow Market Contract                          |');
  console.log('+--------------------------------------------------------------+\n');

  try {
    // Load deployment info
    const deploymentPath = path.join(
      __dirname,
      '../deployments/shadow-market-local.json'
    );

    if (!fs.existsSync(deploymentPath)) {
      throw new Error('Contract not deployed. Run "npm run deploy" first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    const contractAddress = deployment.contractAddress;

    console.log('Contract Address:', contractAddress);
    console.log('Network: undeployed\n');

    // Create wallet and providers
    console.log('🔧 Creating wallet and providers...');
    const seed = getAdminWalletSeed();
    console.log('Using admin seed from environment...');
    const walletCtx = await createWallet(seed);
    const providers = await createProviders(walletCtx);

    // Find the deployed contract
    console.log('Finding deployed contract...');
    const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
    const { compiledShadowMarketContract } = await import('../src/index.js');
    
    // Bind witnesses to the compiled contract
    const compiledWithWitnesses = compiledShadowMarketContract.pipe(
      CompiledContract.withWitnesses((providers as any).witnesses)
    );

    const result = await findDeployedContract(providers as any, {
      compiledContract: compiledWithWitnesses,
      contractAddress: contractAddress,
      privateStateId: 'shadow-market-private-state',
      initialPrivateState: { userSecretKey: new Uint8Array(32).fill(0) },
    } as any);
    
    const contract = result;

    if (!contract) {
      throw new Error(`Failed to find contract at ${contractAddress}`);
    }

    console.log('Contract found!\n');

    // Call initialize circuit
    console.log('Calling initialize() circuit...');
    const txData = await (contract.callTx.initialize as any)();

    console.log('\n+--------------------------------------------------------------+');
    console.log('|                INITIALIZATION SUCCESS                        |');
    console.log('+--------------------------------------------------------------+\n');
    console.log('  Transaction Hash:', txData.public.txHash);
    console.log('  Block Height:', txData.public.blockHeight);
    console.log('\n  Contract is now ready to use!');
    console.log('  - Create markets with createMarket()');
    console.log('  - Accept bets with placeBet()');
    console.log('  - Create wagers with createWager()\n');
  } catch (error: any) {
    console.error('\n+--------------------------------------------------------------+');
    console.error('|                INITIALIZATION FAILED                         |');
    console.error('+--------------------------------------------------------------+\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

main();
