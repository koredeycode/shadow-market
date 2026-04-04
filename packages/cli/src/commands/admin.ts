import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { walletManager } from '../core/wallet.js';

export const adminCommands = new Command('admin')
  .description('Administrative tools for Shadow Market owners');

adminCommands
  .command('initialize')
  .description('Initialize the deployed contract (Admin Only)')
  .action(async () => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    const spinner = ora('Initializing master contract...').start();
    try {
      const api = await walletManager.getAPI();
      const txHash = await api.initialize();
      spinner.succeed(chalk.green(`Contract successfully initialized! TX: ${txHash}`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Initialization failed: ${err.message}`));
    }
  });

adminCommands
  .command('resolve <marketId>')
  .description('Resolve a market with a specific outcome')
  .action(async (marketId) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    try {
      const { outcome } = await inquirer.prompt([
        {
          type: 'list',
          name: 'outcome',
          message: `Resolve market #${marketId} as:`,
          choices: [
            { name: 'YES', value: true },
            { name: 'NO', value: false }
          ]
        }
      ]);

      const spinner = ora(`Resolving market #${marketId} to ${outcome ? 'YES' : 'NO'}...`).start();
      const api = await walletManager.getAPI();

      const txHash = await api.resolveMarket(marketId, outcome);
      spinner.succeed(chalk.green(`Market resolved successfully! TX: ${txHash}`));
      
      console.log(chalk.gray('Note: You may need to refresh the backend manually or wait for the indexer to sync.'));
    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error resolving market: ${err.message}`));
    }
  });

adminCommands
  .command('lock <marketId>')
  .description('Lock a market to prevent further betting')
  .action(async (marketId) => {
    if (!walletManager.isLoggedIn()) {
       console.log(chalk.yellow('Please login first: "sm wallet login"'));
       return;
    }

    const spinner = ora(`Locking market #${marketId}...`).start();
    try {
      const api = await walletManager.getAPI();
      const txHash = await api.lockMarket(marketId);
      spinner.succeed(chalk.green(`Market locked! TX: ${txHash}`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to lock market: ${err.message}`));
    }
  });
