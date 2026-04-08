import { Command } from 'commander';
import chalk from 'chalk';
import { walletManager } from '../core/wallet.js';

export const identityCommand = new Command('identity');

identityCommand
  .description('Manage your ZK Identity Key for privacy-preserving markets')
  .addCommand(
    new Command('backup')
      .description('Show your identity key for backup')
      .action(() => {
        const key = walletManager.getIdentityKey();
        if (!key) {
          console.log(chalk.red('Error: No identity key found. Please login first.'));
          return;
        }
        
        console.log('\n' + chalk.yellow('⚠️  PRIVATE IDENTITY KEY BACKUP  ⚠️'));
        console.log(chalk.gray('--------------------------------------------------'));
        console.log(chalk.white('This key identifies you on-chain while keeping your'));
        console.log(chalk.white('wallet address private. DO NOT SHARE THIS KEY.'));
        console.log(chalk.gray('--------------------------------------------------'));
        console.log(chalk.bold.magenta(key));
        console.log(chalk.gray('--------------------------------------------------'));
        console.log(chalk.green('Keep this safe! Import it on other machines or the web app.\n'));
      })
  )
  .addCommand(
    new Command('import')
      .description('Import an existing identity key')
      .argument('<hex>', '32-byte hex identity key')
      .action((hex) => {
        try {
          walletManager.setIdentityKey(hex);
          console.log(chalk.green('\n✅ Identity key imported successfully!'));
          console.log(chalk.gray('This key will now be used for your private transactions.\n'));
        } catch (err: any) {
          console.log(chalk.red(`\n❌ Error: ${err.message}\n`));
        }
      })
  )
  .addCommand(
    new Command('generate')
      .description('Generate a new random identity key')
      .action(() => {
        const hex = walletManager.generateNewIdentity();
        console.log(chalk.green('\n✅ New identity key generated and saved!'));
        console.log(chalk.white('Key: ') + chalk.bold.magenta(hex));
        console.log(chalk.yellow('Remember to back this up using "identity backup".\n'));
      })
  );
