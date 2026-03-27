import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';

// Midnight.js imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

// Shared utilities
import { compiledContract, createProviders, createWallet } from './utils.js';

// ─── Verify Deployment Script ──────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Verify SimpleMarket Deployment                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Load deployment info
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const deploymentsDir = path.resolve(__dirname, '..', 'deployments');
    const latestFile = path.join(deploymentsDir, 'local-latest.json');

    if (!fs.existsSync(latestFile)) {
      console.error('\n❌ No deployment found!\n');
      process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
    console.log(`Network: ${deployment.network}`);
    console.log(`Contract Address: ${deployment.contractAddress}`);
    console.log(`Market Question: ${deployment.question}`);
    console.log(`End Time: ${deployment.endTimeISO}\n`);

    // Use genesis master wallet (same as deployment)
    console.log('Creating wallet...');
    const walletCtx = await createWallet(deployment.seed);

    console.log('Syncing...');
    await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));

    console.log('Setting up providers...');
    const providers = await createProviders(walletCtx);

    // Find deployed contract
    console.log('Connecting to contract...\n');

    // For verification, we create a fresh private state
    const contract = await findDeployedContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        contractAddress: deployment.contractAddress,
        privateStateId: `market-verify-${Date.now()}`,
        initialPrivateState: { userSecret: new Uint8Array(32).fill(0) },
      } as any
    );

    console.log('✅ Contract found and verified!\n');

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Verification Complete! ✅                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
