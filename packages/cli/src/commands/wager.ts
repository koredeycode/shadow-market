import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import { walletManager } from '../core/wallet.js';
import { backendClient } from '../core/backend.js';
import { getStatusColor, formatCurrency } from '../utils/format.js';

export const wagerCommands = new Command('wager')
  .description('Manage P2P prediction wagers');

wagerCommands
  .command('list <marketId>')
  .description('List open P2P wagers for a market')
  .action(async (marketId) => {
    const spinner = ora('Fetching wagers...').start();
    try {
      const wagers = await backendClient.getWagers(marketId);
      spinner.stop();

      if (wagers.length === 0) {
        console.log(chalk.yellow('No open wagers found for this market.'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Side', 'Amount', 'Odds', 'Ends In'],
        colWidths: [8, 10, 15, 12, 10]
      });

      wagers.forEach((w: any) => {
        table.push([
          w.onchainId || w.id.split('-')[0],
          w.side.toUpperCase() === 'YES' ? chalk.green('YES') : chalk.red('NO'),
          formatCurrency(Number(w.amount)),
          `${w.oddsNumerator}:${w.oddsDenominator}`,
          `${w.duration}h`
        ]);
      });

      console.log(chalk.bold(`\n🤝 Open wagers for Market #${marketId}:`));
      console.log(table.toString());
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to list wagers: ${err.message}`));
    }
  });

wagerCommands
  .command('create <marketId>')
  .description('Create a new P2P wager offering')
  .action(async (marketId) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    try {
      const answers = await inquirer.prompt([
        {
          type: 'number',
          name: 'amount',
          message: 'Wager Amount (tokens):',
          validate: (val) => (val && val > 0) || 'Amount must be greater than zero.'
        },
        {
          type: 'list',
          name: 'side',
          message: 'Your Prediction:',
          choices: ['YES', 'NO']
        },
        {
          type: 'input',
          name: 'odds',
          message: 'Odds Numerator : Denominator (e.g. 1:1, 2:1):',
          default: '1:1',
          validate: (val) => {
            const parts = val.split(':');
            return (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) || 'Invalid odds format.';
          }
        }
      ]);

      const [numerator, denominator] = answers.odds.split(':').map(BigInt);
      const spinner = ora('Generating ZK proof for P2P wager...').start();

      // 1. Get API
      const api = await walletManager.getAPI();

      // 2. Set callbacks
      api.setStatusCallback((status: string, data?: any) => {
        if (status === 'BALANCING_END') {
          spinner.text = 'Proof ready. Submitting to network...';
        }
      });

      // 3. Create wager on-chain
      const result = await api.createWager(
        marketId,
        answers.side === 'YES',
        BigInt(answers.amount),
        numerator,
        denominator
      );

      spinner.succeed(chalk.green(`P2P Wager created on-chain! ID: ${result.onchainId}`));
      console.log(chalk.gray(`TX Hash: ${result.txHash}`));

      // 4. Sync with Backend
      const syncSpinner = ora('Syncing wager metadata...').start();
      try {
        const address = walletManager.getAddress();
        if (!backendClient.getToken()) await backendClient.login(address);

        await backendClient.createP2PWager({
          marketId,
          amount: answers.amount.toString(),
          side: answers.side.toLowerCase(),
          odds: [Number(numerator), Number(denominator)],
          duration: 24, // Default 24h
          onchainId: result.onchainId,
          txHash: result.txHash
        });
        syncSpinner.succeed(chalk.green('Wager listed on backend. Others can now accept it.'));
      } catch (syncErr: any) {
        syncSpinner.fail(chalk.yellow(`On-chain success, but backend sync failed: ${syncErr.message}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error creating P2P wager: ${err.message}`));
    }
  });

wagerCommands
  .command('accept <wagerId>')
  .description('Accept an existing P2P wager offer')
  .action(async (wagerId) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    const spinner = ora(`Accepting P2P wager #${wagerId}...`).start();
    try {
      const api = await walletManager.getAPI();
      const txHash = await api.acceptWager(wagerId);

      spinner.succeed(chalk.green(`Wager #${wagerId} accepted on-chain!`));
      console.log(chalk.gray(`TX Hash: ${txHash}`));

      // Sync backend
      const syncSpinner = ora('Finalizing position in reservoir...').start();
      try {
        const address = walletManager.getAddress();
        if (!backendClient.getToken()) await backendClient.login(address);
        await backendClient.acceptP2PWager(wagerId, txHash);
        syncSpinner.succeed(chalk.green('Position finalized. Luck be with you!'));
      } catch (syncErr: any) {
        syncSpinner.fail(chalk.yellow(`On-chain success, but sync failed: ${syncErr.message}`));
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to accept wager: ${err.message}`));
    }
  });
