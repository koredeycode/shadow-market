import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Rx from 'rxjs';

// Midnight.js imports
import { nativeToken } from '@midnight-ntwrk/ledger-v7';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

// Shared utilities
import { getAdminWalletSeed } from './config.js';
import { CONFIG, createProviders, createWallet } from './utils.js';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Deploy Market Factory (Local Network)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.networkId !== 'undeployed') {
    console.error('\n❌ This script is for local network only!');
    console.error('   Set MIDNIGHT_NETWORK=local\n');
    process.exit(1);
  }

  // Use absolute path from project root
  const zkConfigPath = path.resolve(process.cwd(), 'src', 'managed', 'market-factory-simple-v22');

  // Check if contract is compiled
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    console.error('\n❌ Contract not compiled! Run: pnpm compile:factory-simple\n');
    process.exit(1);
  }

  try {
    console.log(`Network: ${CONFIG.networkId}`);
    console.log(`Indexer: ${CONFIG.indexer}\n`);

    // Use admin wallet from config
    const adminSeed = getAdminWalletSeed();
    console.log('─── Using Admin Wallet ─────────────────────────────────────────\n');
    console.log(
      `  Admin Seed: ${adminSeed.substring(0, 8)}...${adminSeed.substring(adminSeed.length - 8)}`
    );
    const walletCtx = await createWallet(adminSeed);

    console.log('  Syncing with network...');
    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter(s => s.isSynced)
      )
    );

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance = state.unshielded.balances[nativeToken().raw] ?? 0n;

    console.log(`  ✅ Wallet Address: ${address}`);
    console.log(`  NIGHT Balance: ${balance.toLocaleString()}\n`);

    // Create providers with custom zkConfigPath
    console.log('  Creating providers...');
    const providers = await createProviders(walletCtx, zkConfigPath);

    // Load compiled contract
    const { Contract } = await import(`../managed/market-factory-simple-v22/contract/index.js`);

    // Create witnesses
    const witnesses = {
      userSecretKey: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        privateState.userSecret,
      ],
    };

    const CompiledContract = (await import('@midnight-ntwrk/compact-js')).CompiledContract;
    const compiledContract = CompiledContract.make('market-factory-simple-v22', Contract).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(zkConfigPath)
    );

    // Deploy contract
    console.log('\n─── Deploying Factory Contract ────────────────────────────────\n');
    console.log('  Deploying...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        privateStateId: `factory-${Date.now()}`,
        initialPrivateState: { userSecret: new Uint8Array(32).fill(0) },
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('  ✅ Factory contract deployed successfully!\n');
    console.log(`  Contract Address: ${contractAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      contractType: 'market-factory-simple-v22',
      network: CONFIG.networkId,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
    };

    const deploymentsDir = path.resolve(process.cwd(), 'deployments');
    await fs.promises.mkdir(deploymentsDir, { recursive: true });

    const deploymentPath = path.join(deploymentsDir, 'factory-local.json');
    await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`  📄 Deployment saved: ${deploymentPath}\n`);

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Factory Deployment Complete! ✅                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('⚠️  IMPORTANT: Call initialize() circuit to set admin!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
