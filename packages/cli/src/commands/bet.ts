import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { walletManager } from '../core/wallet.js';
import { backendClient } from '../core/backend.js';

export const betCommands = new Command('bet')
  .description('Place bets on prediction markets');

betCommands
  .command('place [marketId] [side] [amount]')
  .description('Place a bet on an AMM pool')
  .option('-v, --value <amount>', 'Amount to bet in tokens')
  .option('-s, --side <side>', 'Bet side (YES or NO)')
  .action(async (marketIdArg, sideArg, amountArg, options) => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    try {
      // Intelligent argument parsing
      let marketId = marketIdArg;
      let side = (sideArg || options.side)?.toUpperCase();
      let amount = amountArg || options.value;

      // Handle transposed args: "place YES 1 10" -> marketId=1, side=YES, amount=10
      if (marketId && (marketId.toUpperCase() === 'YES' || marketId.toUpperCase() === 'NO')) {
          const actualSide = marketId.toUpperCase();
          const actualId = sideArg;
          const actualAmount = amountArg;
          
          side = actualSide;
          marketId = actualId;
          amount = actualAmount;
      }

      // 1. Gather missing inputs
      const questions = [];
      if (!marketId || isNaN(parseInt(marketId))) {
          questions.push({
            type: 'input',
            name: 'marketId',
            message: 'Market ID (on-chain index):',
            validate: (val: string) => (val && !isNaN(parseInt(val))) || 'Please enter a valid numeric Market ID.'
          });
      }
      if (!amount) {
          questions.push({
            type: 'number',
            name: 'amount',
            message: 'Bet Amount (tokens):',
            validate: (val: number) => (val && val > 0) || 'Amount must be greater than zero.'
          });
      }
      if (!side) {
          questions.push({
            type: 'list',
            name: 'side',
            message: 'Select Side:',
            choices: ['YES', 'NO']
          });
      }

      if (questions.length > 0) {
        const answers = await inquirer.prompt(questions as any);
        if (answers.marketId) marketId = answers.marketId;
        if (answers.amount) amount = answers.amount;
        if (answers.side) side = answers.side;
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

      // Sync with backend
      const syncSpinner = ora('Syncing with backend...').start();
      try {
        const session = walletManager.getSession();
        if (session?.token) {
          backendClient.setToken(session.token);
        } else {
          await backendClient.login(walletManager.getAddress());
        }

        await backendClient.placeBet(marketId, {
          side: side.toLowerCase(),
          amount: amount.toString(),
          txHash: result.txHash,
          onchainId: result.onchainId
        });
        syncSpinner.succeed(chalk.green('Portfolio updated on backend.'));
        
        const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
        console.log(`\n${chalk.white('View Market & Position:')}  ${chalk.cyan.underline(`${webUrl}/markets/${marketId}`)}`);
      } catch (syncErr: any) {
        syncSpinner.fail(chalk.yellow(`Warning: Bet placed on-chain, but backend sync failed: ${syncErr.message}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error placing bet: ${err.message}`));
    } finally {
      process.exit(0);
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
