import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { walletManager } from '../core/wallet.js';

export const betCommands = new Command('bet')
  .description('Place bets on prediction markets');

betCommands
  .command('place <marketId>')
  .description('Place a bet on an AMM pool')
  .option('-v, --value <amount>', 'Amount to bet in tokens')
  .option('-s, --side <side>', 'Bet side (YES or NO)')
  .action(async (marketId, options) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    try {
      // 1. Gather inputs
      let amount = options.value;
      let side = options.side?.toUpperCase();

      if (!amount || !side) {
        const answers = await inquirer.prompt([
          {
            type: 'number',
            name: 'amount',
            message: 'Bet Amount (tokens):',
            validate: (val) => (val && val > 0) || 'Amount must be greater than zero.'
          },
          {
            type: 'list',
            name: 'side',
            message: 'Select Side:',
            choices: ['YES', 'NO']
          }
        ]);
        amount = answers.amount;
        side = answers.side;
      }

      const betOutcome = side === 'YES';
      const betAmount = BigInt(amount);
      const spinner = ora(`Preparing bet for market #${marketId}...`).start();

      // 2. Initialize API
      const api = await walletManager.getAPI();

      // 3. Execution update callbacks
      api.setStatusCallback((status: string, data?: any) => {
        switch (status) {
          case 'BALANCING_START':
            spinner.text = 'Calculating ZK proof constraints...';
            break;
          case 'BALANCING_END':
            spinner.text = `Proven in ${data?.duration}s. Verifying and submitting...`;
            break;
          case 'SERIALIZING':
            spinner.text = 'Serializing transaction...';
            break;
        }
      });

      // 4. Place bet
      const result = await api.placeBet(marketId, betAmount, betOutcome);
      spinner.succeed(chalk.green(`Bet placed successfully! Bet ID: ${result.onchainId}`));
      console.log(chalk.gray(`TX Hash: ${result.txHash}`));

    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error placing bet: ${err.message}`));
    }
  });

betCommands
  .command('claim <betId>')
  .description('Claim winnings from a resolved market bet')
  .action(async (betId) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    const spinner = ora(`Claiming winnings for bet #${betId}...`).start();
    try {
      const api = await walletManager.getAPI();
      const txHash = await api.claimWinnings(betId);
      spinner.succeed(chalk.green(`Winnings claimed! Transaction: ${txHash}`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to claim winnings: ${err.message}`));
    }
  });
