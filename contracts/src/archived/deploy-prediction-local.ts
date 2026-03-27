import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Rx from 'rxjs';

// Midnight.js imports
import { nativeToken } from '@midnight-ntwrk/ledger-v7';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

// Shared utilities
import { deriveAdminKey, getAdminWalletSeed } from './config.js';
import { CONFIG, createProviders, createWallet } from './utils.js';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Deploy Prediction Market (Local Network)                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.networkId !== 'undeployed') {
    console.error('\n❌ This script is for local network only!');
    console.error('   Set MIDNIGHT_NETWORK=local\n');
    process.exit(1);
  }

  // Use absolute path from project root
  const zkConfigPath = path.resolve(
    process.cwd(),
    'src',
    'managed',
    'prediction-market-simple-v22'
  );

  // Check if contract is compiled
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    console.error('\n❌ Contract not compiled! Run: pnpm compile:prediction-simple\n');
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
    const { Contract } = await import(`../managed/prediction-market-simple-v22/contract/index.js`);

    // Create witnesses for prediction market
    const witnesses = {
      userSecretKey: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        privateState.userSecret,
      ],
      betAmount: ({ privateState }: any): [any, bigint] => [
        privateState,
        privateState.betAmount || 0n,
      ],
      betSide: ({ privateState }: any): [any, bigint] => [privateState, privateState.betSide || 0n],
      betNonce: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        privateState.betNonce || new Uint8Array(32),
      ],
    };

    const CompiledContract = (await import('@midnight-ntwrk/compact-js')).CompiledContract;
    const compiledContract = CompiledContract.make('prediction-market-simple-v22', Contract).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(zkConfigPath)
    );

    // Deploy contract
    console.log('\n─── Deploying Prediction Market Contract ──────────────────────\n');

    // Constructor params: marketId, question, endTime, adminKey
    const marketId = 1n; // First market in the system
    const question = 'Multi-Market Prediction Platform';
    const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
    const adminKey = deriveAdminKey(adminSeed); // Derive admin key from wallet

    console.log(`  Market ID: ${marketId}`);
    console.log(`  Question: ${question}`);
    console.log(`  End Time: ${new Date(Number(endTime) * 1000).toISOString()}\n`);
    console.log('  Deploying...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        privateStateId: `prediction-market-${Date.now()}`,
        initialPrivateState: {
          userSecret: new Uint8Array(32).fill(0),
          betAmount: 0n,
          betSide: 0n,
          betNonce: new Uint8Array(32).fill(0),
        },
        args: [marketId, question, endTime, adminKey],
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('  ✅ Prediction Market contract deployed successfully!\n');
    console.log(`  Contract Address: ${contractAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      contractType: 'prediction-market-simple-v22',
      marketId: marketId.toString(),
      question,
      endTime: endTime.toString(),
      endTimeISO: new Date(Number(endTime) * 1000).toISOString(),
      network: CONFIG.networkId,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
    };

    const deploymentsDir = path.resolve(process.cwd(), 'deployments');
    await fs.promises.mkdir(deploymentsDir, { recursive: true });

    const deploymentPath = path.join(deploymentsDir, 'prediction-market-local.json');
    await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`  📄 Deployment saved: ${deploymentPath}\n`);

    await walletCtx.wallet.stop();

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Prediction Market Deployment Complete! ✅               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('⚠️  IMPORTANT: Call openMarket() circuit to start accepting bets!\n');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
