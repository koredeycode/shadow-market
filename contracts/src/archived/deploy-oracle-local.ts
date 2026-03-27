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
  console.log('║     Deploy Oracle Contract (Local Network)                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.networkId !== 'undeployed') {
    console.error('\n❌ This script is for local network only!');
    console.error('   Set MIDNIGHT_NETWORK=local\n');
    process.exit(1);
  }

  // Use absolute path from project root
  const zkConfigPath = path.resolve(process.cwd(), 'src', 'managed', 'oracle-simple-v22');

  // Check if contract is compiled
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    console.error('\n❌ Contract not compiled! Run: pnpm compile:oracle-simple\n');
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
    const dustBalance = state.dust?.balance(new Date()) ?? 0n;

    console.log(`  ✅ Wallet Address: ${address}`);
    console.log(`  NIGHT Balance: ${balance.toLocaleString()}`);
    console.log(`  DUST Balance: ${dustBalance.toLocaleString()}\n`);

    // Create providers with custom zkConfigPath
    console.log('  Creating providers...');
    const providers = await createProviders(walletCtx, zkConfigPath);

    // Load compiled contract
    const { Contract } = await import(`../managed/oracle-simple-v22/contract/index.js`);

    // Create witnesses (oracle uses userSecretKey witness)
    const witnesses = {
      userSecretKey: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        privateState.userSecret,
      ],
      stakeAmount: ({ privateState }: any): [any, bigint] => [privateState, 1000n], // Minimum stake
      submissionData: ({ privateState }: any): [any, bigint] => [privateState, 0n],
    };

    const CompiledContract = (await import('@midnight-ntwrk/compact-js')).CompiledContract;

    // Debug: Print path to verify
    console.log('zkConfigPath:', zkConfigPath);
    console.log('keys path:', path.join(zkConfigPath, 'keys'));
    console.log('keys exist:', fs.existsSync(path.join(zkConfigPath, 'keys')));

    const compiledContract = CompiledContract.make('oracle-simple-v22', Contract).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(zkConfigPath)
    );

    // Deploy contract
    console.log('\n─── Deploying Oracle Contract ─────────────────────────────────\n');
    console.log('  Deploying...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        privateStateId: `oracle-${Date.now()}`,
        initialPrivateState: { userSecret: new Uint8Array(32).fill(0) },
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('  ✅ Oracle contract deployed successfully!\n');
    console.log(`  Contract Address: ${contractAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      contractType: 'oracle-simple-v22',
      network: CONFIG.networkId,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
    };

    const deploymentsDir = path.resolve(process.cwd(), 'deployments');
    await fs.promises.mkdir(deploymentsDir, { recursive: true });

    const deploymentPath = path.join(deploymentsDir, 'oracle-local.json');
    await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`  📄 Deployment saved: ${deploymentPath}\n`);

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Oracle Deployment Complete! ✅                          ║');
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
