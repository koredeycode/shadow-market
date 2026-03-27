import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';

// Midnight.js imports
import { nativeToken } from '@midnight-ntwrk/ledger-v7';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

// Shared utilities
import {
  compiledContract,
  CONFIG,
  createProviders,
  createSimpleMarketPrivateState,
  createWallet,
  zkConfigPath,
} from './utils.js';

// ─── Local Test Deploy Script ──────────────────────────────────────────────────
// Uses the genesis master wallet seed for quick local testing

const GENESIS_MASTER_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Test Deploy SimpleMarket (Local Network)                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.networkId !== 'undeployed') {
    console.error('\n❌ This script is for local network only!');
    console.error('   Set MIDNIGHT_NETWORK=local\n');
    process.exit(1);
  }

  // Check if contract is compiled
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    console.error('\n❌ Contract not compiled! Run: pnpm compile:simple\n');
    process.exit(1);
  }

  if (!compiledContract) {
    console.error('\n❌ Failed to load compiled contract\n');
    process.exit(1);
  }

  try {
    console.log(`Network: ${CONFIG.networkId}`);
    console.log(`Indexer: ${CONFIG.indexer}\n`);

    // Use master wallet (already has funds)
    console.log('─── Using Genesis Master Wallet ────────────────────────────────\n');
    const walletCtx = await createWallet(GENESIS_MASTER_SEED);

    console.log('  Syncing with network...');
    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter(s => s.isSynced)
      )
    );

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance = state.unshielded.balances[nativeToken().raw] ?? 0n;
    const dustBalance = state.dust?.balance(new Date()) ?? 0n;

    console.log(`  ✅ Wallet Address: ${address}`);
    console.log(`  NIGHT Balance: ${balance.toLocaleString()}`);
    console.log(`  DUST Balance: ${dustBalance.toLocaleString()}\n`);

    if (balance === 0n) {
      console.error('  ❌ Master wallet has no funds! Network may not be ready.\n');
      process.exit(1);
    }

    // Create providers
    console.log('  Creating providers...');
    const providers = await createProviders(walletCtx);

    // Deploy contract
    console.log('\n─── Deploying Contract ─────────────────────────────────────────\n');

    const question = 'Will Bitcoin reach $100k by end of 2026?';
    const endTime = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // +7 days

    console.log(`  Question: ${question}`);
    console.log(`  End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
    console.log('\n  Deploying...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        privateStateId: `market-test-${Date.now()}`,
        initialPrivateState: createSimpleMarketPrivateState(),
        args: [question, endTime],
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('  ✅ Contract deployed successfully!\n');
    console.log(`  Contract Address: ${contractAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      question,
      endTime: endTime.toString(),
      endTimeISO: new Date(Number(endTime) * 1000).toISOString(),
      seed: GENESIS_MASTER_SEED,
      network: CONFIG.networkId,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
    };

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const deploymentsDir = path.resolve(__dirname, '..', 'deployments');
    await fs.promises.mkdir(deploymentsDir, { recursive: true });

    const deploymentPath = path.join(deploymentsDir, 'local-latest.json');
    await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`  📄 Deployment saved: ${deploymentPath}\n`);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Deployment Complete! ✅                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();
