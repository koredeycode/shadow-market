import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { backendClient } from '../core/backend.js';
import { walletManager } from '../core/wallet.js';

export const walletCommands = new Command('wallet')
  .description('Manage your wallet and session');

walletCommands
  .command('login')
  .description('Login to Shadow Market')
  .option('-m, --mnemonic <phrase>', 'Login with recovery phrase')
  .option('-k, --key <hex>', 'Login with private key')
  .option('-e, --env', 'Login using environment variables (.env)')
  .option('-l, --link', 'Link with browser session (Recommended)')
  .action(async (options) => {
    if (options.link) {
      await handleLinkFlow();
      return;
    }

    if (options.env) {
      const success = await walletManager.login('env', '');
      if (success) {
        console.log(chalk.green('✔ Logged in from environment variables.'));
        console.log(chalk.cyan(`Address: ${walletManager.getAddress()}`));
      }
      return;
    }

    if (options.mnemonic || options.key) {
       const method = options.mnemonic ? 'mnemonic' : 'hex';
       const data = options.mnemonic || options.key;
       const success = await walletManager.login(method, data);
       if (success) {
         console.log(chalk.green('✔ Successfully logged in.'));
         console.log(chalk.cyan(`Address: ${walletManager.getAddress()}`));
       }
       return;
    }

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'How would you like to login?',
        choices: [
          { name: 'Seed Phrase', value: 'mnemonic' },
          { name: 'Private Key', value: 'key' }
        ]
      }
    ]);

    const isMnemonic = choice === 'mnemonic';
    const { data } = await inquirer.prompt([
      {
        type: 'password',
        name: 'data',
        message: isMnemonic ? 'Enter seed phrase (12+ words):' : 'Enter 128-char Master Hex Seed:',
        validate: (input) => {
          if (isMnemonic) return input.split(' ').length >= 12 || 'Invalid phrase';
          return input.length === 128 || `Invalid length: Hex seed must be exactly 128 characters (64 bytes). You entered ${input.length} characters.`;
        }
      }
    ]);

    const success = await walletManager.login(choice, data);
    if (success) {
      console.log(chalk.green('✔ Successfully logged in.'));
      console.log(chalk.cyan(`Address: ${walletManager.getAddress()}`));
      
      // Auto-trigger link flow silently to sync with backend
      await handleLinkFlow();
    }
  });

walletCommands
  .command('status')
  .description('Check current wallet status')
  .action(async () => {
    if (!walletManager.isLoggedIn()) {
      console.log(chalk.yellow('Not logged in. Use "sm wallet login"'));
      return;
    }

    const spinner = ora('Fetching wallet state...').start();
    try {
      const status = await walletManager.getStatus();
      spinner.stop();

      console.log(chalk.bold.magenta('\n🕶️ SHADOW WALLET STATUS'));
      console.log(chalk.gray('--------------------------------------------------'));
      console.log(`${chalk.white('Address:')}    ${chalk.cyan(status.address)}`);
      console.log(`${chalk.white('Balance:')}    ${chalk.green(status.balance.toString())} tNight`);
      console.log(`${chalk.white('DUST:')}       ${chalk.yellow(status.dust.toString())} tDUST`);
      console.log(`${chalk.white('Sync:')}       ${status.isSynced ? chalk.green('Synced') : chalk.red('Syncing...')}`);
      console.log(chalk.gray('--------------------------------------------------\n'));
    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to fetch status: ${err.message}`));
    }
  });

walletCommands
  .command('logout')
  .description('Clear local session')
  .action(() => {
    walletManager.logout();
    console.log(chalk.green('✔ Successfully logged out. Session cleared.'));
  });

async function handleLinkFlow() {
  if (!walletManager.isLoggedIn()) {
    console.log(chalk.red('\n✖ Error: You must be logged in to your local wallet first.'));
    console.log(chalk.white('Please run ') + chalk.cyan('shadow-market wallet login') + chalk.white(' and select "Mnemonic" or "Key" first.'));
    console.log(chalk.gray('Linking verifies your local wallet against your web profile.\n'));
    return;
  }

  const address = walletManager.getAddress();
  const codeSpinner = ora(`Generating link code for ${chalk.cyan(address)}...`).start();
  try {
    const { code, expiresAt } = await backendClient.getLinkCode(address);
    codeSpinner.stop();

    const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
    const linkUrl = `${webUrl}/auth/link?code=${code}`;
    
    console.log(chalk.bold.magenta('\n🔗 LINK YOUR ACCOUNT'));
    console.log(chalk.white('1. Open this URL in your browser:'));
    console.log(chalk.cyan.underline(linkUrl));
    console.log(chalk.white(`2. Enter code: ${chalk.bold.yellow(code)}`));
    console.log(chalk.gray(`(Valid for 10 minutes until ${new Date(expiresAt).toLocaleTimeString()})\n`));

    // Offer to open automatically
    try {
      const { shouldOpen } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldOpen',
          message: 'Open browser automatically?',
          default: true
        }
      ]);

      if (shouldOpen) {
        const { default: open } = await import('open');
        await open(linkUrl);
        console.log(chalk.green('✔ Browser opened.'));
      }
    } catch (err) {
      // ignore if inquirer fails or cancelled
    }

    const pollSpinner = ora('Waiting for browser authorization...').start();
    
    // Polling logic
    const pollInterval = setInterval(async () => {
      try {
        const result = await backendClient.pollLinkStatus(code);
        if (result.status === 'AUTHORIZED') {
          clearInterval(pollInterval);
          pollSpinner.text = 'Finalizing session...';
          
          // Set backend token
          backendClient.setToken(result.token);
          
          // Get user address from token/backend
          const user = await backendClient.getMe();
          
          // Initialize wallet/session (we still need the seed for on-chain actions if we want to run them in CLI)
          // For now, we'll store the linked status. 
          // Note: In a real flow, the browser might pass back a delegated key or the user might still need to provide a local seed 
          // for ZK proofs if they aren't offloaded. 
          // Here, we'll mark as linked and prompt for a "session seed" if they want to perform ZK actions.
          
          walletManager.setLinkedSession(result.token, user.address);
          
          pollSpinner.succeed(chalk.green(`✔ Linked successfully to ${chalk.bold(user.username || user.address)}`));
        } else if (result.status === 'EXPIRED') {
          clearInterval(pollInterval);
          pollSpinner.fail(chalk.red('Linking code expired. Please try again.'));
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 3000);

  } catch (err: any) {
    codeSpinner.fail(chalk.red(`Failed to generate link: ${err.message}`));
  }
}
