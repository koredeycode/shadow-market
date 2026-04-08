import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import { walletManager } from '../core/wallet.js';
import { backendClient } from '../core/backend.js';
import { getStatusColor, formatAddress } from '../utils/format.js';
import { getExplorerLink } from '@shadow-market/api';

export const marketCommands = new Command('market')
  .description('Interact with prediction markets');

marketCommands
  .command('list')
  .description('List available prediction markets from backend')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --status <status>', 'Filter by status (OPEN, LOCKED, RESOLVED)')
  .action(async (options) => {
    const spinner = ora('Fetching markets...').start();
    try {
      const filters: any = {};
      if (options.category) filters.category = options.category;
      if (options.status) filters.status = options.status.toUpperCase();

      const markets = await backendClient.getMarkets(filters);
      spinner.stop();

      if (markets.length === 0) {
        console.log(chalk.yellow('No markets found.'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Slug', 'Question', 'Status', 'Ends'],
        colWidths: [8, 20, 50, 12, 15]
      });

      markets.forEach((m: any) => {
        table.push([
          m.onchainId || m.id.split('-')[0],
          m.slug || '-',
          m.question,
          getStatusColor(m.status)(m.status),
          new Date(m.endTime).toLocaleDateString()
        ]);
      });

      console.log(table.toString());
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to list markets: ${err.message}`));
    }
  });

marketCommands
  .command('create')
  .description('Create a new prediction market on-chain')
  .action(async () => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Please login first: "sm wallet login"'));
      return;
    }

    try {
      const now = new Date();
      
      const basicAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'question',
          message: 'Market Question (e.g. Will ETH hit $10k in 2026?):',
          validate: (val: string) => val.length >= 10 || 'Question must be at least 10 characters.'
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: [
            'Politics', 'Sports', 'Crypto', 'Finance', 'Geopolitics', 
            'Tech', 'Culture', 'Economy', 'Weather', 'Elections', 'Others'
          ],
          default: 'Crypto'
        }
      ]);

      const yearAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'year',
          message: 'Resolution Year (YYYY):',
          default: now.getFullYear().toString(),
          validate: (val: string) => (parseInt(val) >= now.getFullYear()) || 'Year must be current or future.'
        }
      ]);
      
      const year = parseInt(yearAnswer.year);

      const monthAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'month',
          message: 'Resolution Month:',
          choices: [
            { name: 'January', value: 0 }, { name: 'February', value: 1 }, 
            { name: 'March', value: 2 },   { name: 'April', value: 3 },
            { name: 'May', value: 4 },     { name: 'June', value: 5 },
            { name: 'July', value: 6 },    { name: 'August', value: 7 },
            { name: 'September', value: 8 }, { name: 'October', value: 9 },
            { name: 'November', value: 10 }, { name: 'December', value: 11 }
          ],
          default: now.getMonth()
        }
      ] as any);

      const month = monthAnswer.month;

      const dayAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'day',
          message: 'Resolution Day (1-31):',
          default: now.getDate().toString(),
          validate: (val: string) => {
            const day = parseInt(val);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            return (day >= 1 && day <= daysInMonth) || `Invalid day for chosen month (max ${daysInMonth}).`;
          }
        }
      ]);

      const day = parseInt(dayAnswer.day);

      // Construct Target Date at 12:00 PM (Noon)
      const targetDate = new Date(year, month, day, 12, 0, 0);
      const resolutionTime = BigInt(targetDate.getTime());

      const { question, category } = basicAnswers as any;
      
      const spinner = ora('Initializing on-chain transaction...').start();

      // 1. Get API instance
      const api = await walletManager.getAPI();

      // 2. Set up status callback to update our spinner
      api.setStatusCallback((status: string, data?: any) => {
        switch (status) {
          case 'BALANCING_START':
            spinner.text = 'Balancing transaction (UTXO selection)...';
            break;
          case 'BALANCING_END':
            spinner.text = `Balanced in ${data?.duration}s. Proving circuit...`;
            break;
          case 'SERIALIZING':
            spinner.text = 'Serializing circuit inputs...';
            break;
        }
      });

      // 3. Execute circuit
      const result = await api.createMarket(question, resolutionTime);
      spinner.succeed(chalk.green(`Market created on-chain! ID: ${result.onchainId}`));
      const link = getExplorerLink('transactions', result.txHash);
      if (link) {
        console.log(chalk.blue.underline(`Explorer: ${link}`));
      }

      // 4. Sync with Backend
      const syncSpinner = ora('Syncing with backend reservoir...').start();
      try {
        const address = walletManager.getAddress();
        const session = walletManager.getSession();
        
        if (session?.token) {
          backendClient.setToken(session.token);
        } else {
          await backendClient.login(address);
        }

        const syncedMarket = await backendClient.createMarket({
          question: question,
          category: category,
          endTime: new Date(Number(resolutionTime)).toISOString(),
          onchainId: result.onchainId,
          txHash: result.txHash,
          resolutionSource: 'Admin Oracle',
          creatorAddress: address
        });
        syncSpinner.succeed(chalk.green('Synchronized with backend reservoir. Listing updated.'));

        const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
        const marketSlug = syncedMarket.slug || result.onchainId;
        console.log(`\n${chalk.white('View Market on Web:')}  ${chalk.cyan.underline(`${webUrl}/markets/${marketSlug}`)}`);
      } catch (syncErr: any) {
        syncSpinner.fail(chalk.yellow(`Warning: On-chain success, but backend sync failed: ${syncErr.message}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error during market creation: ${err.message}`));
    } finally {
      process.exit(0);
    }
  });

marketCommands
  .command('view <id>')
  .description('Show detailed information for a market')
  .action(async (id) => {
    const spinner = ora('Fetching market details...').start();
    try {
      const market = await backendClient.getMarket(id);
      spinner.stop();

      console.log(chalk.bold.magenta('\n🔍 Market Detail View'));
      console.log(chalk.gray('--------------------------------------------------'));
      console.log(`${chalk.white('Question:')}    ${chalk.cyan(market.question)}`);
      console.log(`${chalk.white('Category:')}    ${chalk.blue(market.category)}`);
      console.log(`${chalk.white('Status:')}      ${getStatusColor(market.status)(market.status)}`);
      console.log(`${chalk.white('IDs:')}         On-chain ID: ${chalk.yellow(market.onchainId || 'N/A')} | DB ID: ${chalk.gray(market.id)}`);
      console.log(`${chalk.white('Ends:')}        ${new Date(market.endTime).toLocaleString()}`);
      console.log(`${chalk.white('Creator:')}     ${formatAddress(market.creatorAddress || 'Unknown')}`);
      console.log(chalk.gray('--------------------------------------------------'));
      
      if (market.description) {
        console.log(`\n${chalk.white('Description:')}\n${market.description}\n`);
      }

      const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
      const marketSlug = market.slug || market.onchainId || market.id;
      console.log(`${chalk.white('View on Web:')}    ${chalk.cyan.underline(`${webUrl}/markets/${marketSlug}`)}`);
      console.log(chalk.gray('--------------------------------------------------\n'));
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to fetch market details: ${err.message}`));
    }
  });
