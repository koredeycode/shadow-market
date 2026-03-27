import * as fs from 'node:fs';
import * as path from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import * as Rx from 'rxjs';

// Midnight.js imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

// Shared utilities
import { compiledContract, createProviders, createWallet } from './utils.js';

// ─── Main Interact Script ──────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Interact with Deployed ShadowMarket Contract            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (!compiledContract) {
    console.error('\n❌ Failed to load compiled contract. Run: pnpm compile\n');
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    // Load deployment info
    const deploymentsDir = path.resolve(process.cwd(), 'deployments');
    const latestFile = path.join(deploymentsDir, 'latest.json');

    if (!fs.existsSync(latestFile)) {
      console.error('\n❌ No deployment found! Run: pnpm deploy\n');
      process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
    console.log(`Network: ${deployment.network}`);
    console.log(`Contract Address: ${deployment.contractAddress}`);
    console.log(`Market Question: ${deployment.question}\n`);

    // Setup wallet
    const seed = await rl.question('Enter your seed (from deployment): ');
    console.log('\nCreating wallet...');
    const walletCtx = await createWallet(seed.trim());

    console.log('Syncing with network...');
    await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));

    console.log('Setting up providers...');
    const providers = await createProviders(walletCtx);

    // Find deployed contract
    console.log('Connecting to deployed contract...');
    const contract = await findDeployedContract(providers as any, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.contractAddress,
      privateStateId: `market-${deployment.contractAddress}`,
    });

    console.log('✅ Connected to contract!\n');

    // Interactive menu
    let running = true;
    while (running) {
      console.log('─── Actions ────────────────────────────────────────────────────');
      console.log('  [1] View market state');
      console.log('  [2] Place a bet');
      console.log('  [3] Close market (owner only)');
      console.log('  [4] Resolve market (owner only)');
      console.log('  [5] Exit');
      const action = await rl.question('\n  > ');

      switch (action.trim()) {
        case '1':
          console.log('\nViewing market state...');
          // TODO: Query ledger state
          console.log('(State viewing not yet implemented - requires contract API)\n');
          break;

        case '2':
          const amount = await rl.question('  Bet amount (in tokens): ');
          const side = await rl.question('  Bet side (1=YES, 0=NO): ');

          console.log('\nPlacing bet...');
          try {
            // TODO: Call placeBet circuit
            console.log('(Bet placement not yet implemented - requires circuit API)\n');
          } catch (error) {
            console.error('Error placing bet:', error);
          }
          break;

        case '3':
          console.log('\nClosing market...');
          try {
            // TODO: Call closeMarket circuit
            console.log('(Market closing not yet implemented - requires circuit API)\n');
          } catch (error) {
            console.error('Error closing market:', error);
          }
          break;

        case '4':
          const outcome = await rl.question('  Outcome (1=YES, 0=NO): ');
          console.log('\nResolving market...');
          try {
            // TODO: Call resolveMarket circuit
            console.log('(Market resolution not yet implemented - requires circuit API)\n');
          } catch (error) {
            console.error('Error resolving market:', error);
          }
          break;

        case '5':
          running = false;
          break;

        default:
          console.log('\nInvalid option\n');
      }
    }

    await walletCtx.wallet.stop();
    console.log('\n─── Session Ended ──────────────────────────────────────────────\n');
  } catch (error) {
    console.error('\n❌ Interaction failed:', error);
    throw error;
  } finally {
    rl.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
