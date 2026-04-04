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
  console.log('║   Deploy Unified Prediction Market (Local Network)          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (CONFIG.networkId !== 'undeployed') {
    console.error('\n❌ This script is for local network only!');
    console.error('   Set MIDNIGHT_NETWORK=local\n');
    process.exit(1);
  }

  // Use absolute path from project root
  const zkConfigPath = path.resolve(process.cwd(), 'src', 'managed', 'unified-prediction-market');

  // Check if contract is compiled
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    console.error('\n❌ Contract not compiled! Run: pnpm compile:unified\n');
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
    const { Contract } = await import(`../managed/unified-prediction-market/contract/index.js`);

    // Create witnesses for unified prediction market
    const witnesses = {
      userSecretKey: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        privateState.userSecret,
      ],
      betAmount: ({ privateState }: any): [any, bigint] => [privateState, 1000n],
      betSide: ({ privateState }: any): [any, bigint] => [privateState, 1n],
      betNonce: ({ privateState }: any): [any, Uint8Array] => [
        privateState,
        new Uint8Array(32).fill(0),
      ],
      wagerAmountInput: ({ privateState }: any): [any, bigint] => [privateState, 1000n],
    };

    const CompiledContract = (await import('@midnight-ntwrk/compact-js')).CompiledContract;

    // Debug: Print path to verify
    console.log('zkConfigPath:', zkConfigPath);
    console.log('keys path:', path.join(zkConfigPath, 'keys'));
    console.log('keys exist:', fs.existsSync(path.join(zkConfigPath, 'keys')));

    const compiledContract = CompiledContract.make('unified-prediction-market', Contract).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(zkConfigPath)
    );

    // Deploy contract
    console.log('\n─── Deploying Contract ─────────────────────────────────────────\n');
    console.log('  📦 Contract: unified-prediction-market');
    console.log('  🔨 Deploying...\n');

    const deployed = await deployContract(
      providers as any,
      {
        compiledContract: compiledContract as any,
        privateStateId: `unified-market-${Date.now()}`,
        initialPrivateState: { userSecret: new Uint8Array(32).fill(0) },
      } as any
    );

    const contractAddress = deployed.deployTxData.public.contractAddress;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ DEPLOYMENT SUCCESS                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`  Contract Address: ${contractAddress}\n`);
    console.log('─── Contract Details ───────────────────────────────────────────\n');
    console.log('  Type: unified-prediction-market');
    console.log('  Features:');
    console.log('    • Multiple markets');
    console.log('    • Pool betting (YES/NO pools)');
    console.log('    • P2P wagers (custom odds)');
    console.log('    • Complete lifecycle management\n');
    console.log('  Circuits:');
    console.log('    • initialize()');
    console.log('    • createMarket(endTime, minBet)');
    console.log('    • placeBet(marketId, side)');
    console.log('    • createWager(marketId, side, oddsNum, oddsDenom)');
    console.log('    • acceptWager(wagerId)');
    console.log('    • cancelWager(wagerId)');
    console.log('    • lockMarket(marketId)');
    console.log('    • resolveMarket(marketId, outcome)');
    console.log('    • claimPoolWinnings(betId)');
    console.log('    • claimWagerWinnings(wagerId)\n');
    console.log('─── Next Steps ─────────────────────────────────────────────────\n');
    console.log('  1. Initialize contract with admin key:');
    console.log('     Call initialize() circuit\n');
    console.log('  2. Create your first market:');
    console.log('     Call createMarket(endTime, minBet)\n');
    console.log('  3. Start accepting bets:');
    console.log('     Users can placeBet() or createWager()\n');
    console.log('════════════════════════════════════════════════════════════════\n');

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      contractType: 'unified-prediction-market',
      network: CONFIG.networkId,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
      features: {
        multipleMarkets: true,
        poolBetting: true,
        p2pWagers: true,
      },
      circuits: [
        'initialize',
        'createMarket',
        'placeBet',
        'createWager',
        'acceptWager',
        'cancelWager',
        'lockMarket',
        'resolveMarket',
        'claimPoolWinnings',
        'claimWagerWinnings',
      ],
    };

    const deploymentsDir = path.resolve(process.cwd(), 'deployments');
    await fs.promises.mkdir(deploymentsDir, { recursive: true });

    const deploymentPath = path.join(deploymentsDir, 'unified-prediction-market-local.json');
    await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`  📄 Deployment info saved to: ${deploymentPath}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║                    ❌ DEPLOYMENT FAILED                      ║');
    console.error('╚══════════════════════════════════════════════════════════════╝\n');
    console.error(error);
    process.exit(1);
  }
}

main();
