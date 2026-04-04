#!/usr/bin/env node

/**
 * 🕶️ Shadow Market CLI
 * 
 * Command line interface for the Shadow Market prediction platform.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { marketCommands } from './commands/market.js';
import { betCommands } from './commands/bet.js';
import { adminCommands } from './commands/admin.js';
import { walletCommands } from './commands/wallet.js';
import { wagerCommands } from './commands/wager.js';
import { startTUI } from './tui/index.js';

// Load .env files if present
dotenv.config();

const program = new Command();

program
  .name('shadow-market')
  .description('Shadow Market Protocol | Midnight Prediction Platform')
  .version('0.1.0');

// Header ASCII Art
const art = `
  ${chalk.magenta('███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗')}
  ${chalk.magenta('██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║')}
  ${chalk.magenta('███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║')}
  ${chalk.magenta('╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║')}
  ${chalk.magenta('███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝')}
  ${chalk.magenta('╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ')}
        ${chalk.bold.white('M  A  R  K  E  T      P  R  O  T  O  C  O  L')}
`;

console.log(art);
console.log(chalk.gray('  Prediction markets with privacy on Midnight Network'));
console.log(chalk.gray('  Type "shadow-market --help" for available commands\n'));

// Command Groups
program.addCommand(walletCommands);
program.addCommand(marketCommands);
program.addCommand(betCommands);
program.addCommand(wagerCommands);
program.addCommand(adminCommands);

program
  .command('tui')
  .description('Launch interactive TUI dashboard')
  .action(() => {
    startTUI();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
