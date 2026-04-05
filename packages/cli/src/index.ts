#!/usr/bin/env node

/**
 * 🕶️ Shadow Market CLI
 * 
 * Command line interface for the Shadow Market prediction platform.
 * Optimized for startup speed by lazy-loading all command modules.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';

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

const isHelpRequested = process.argv.length <= 2 || process.argv.includes('--help') || process.argv.includes('-h');

if (isHelpRequested) {
  console.log(art);
  console.log(chalk.gray('  Prediction markets with privacy on Midnight Network'));
  console.log(chalk.gray('  Type "shadow-market --help" for available commands\n'));
}

// Optimized loader pattern:
// 1. Define placeholders with names and descriptions (this makes --help fast).
// 2. Load the actual complex sub-command logic ONLY when the command is called.

// Using .command() and .action() with process.argv re-parsing
const registerLazyCommand = (name: string, description: string, loader: () => Promise<any>) => {
  program
    .command(name)
    .description(description)
    .allowUnknownOption() // Essential to pass through sub-command options
    .action(async () => {
      const subModule = await loader();
      const subCmd = Object.values(subModule).find(v => v instanceof Command) as Command;
      
      if (!subCmd) throw new Error(`Could not find command object for ${name}`);
      
      // Create a fresh program as container to avoid parent collisions
      const runner = new Command();
      runner.addCommand(subCmd);
      await runner.parseAsync(process.argv);
    });
};

registerLazyCommand('wallet', 'Manage your wallet and session', () => import('./commands/wallet.js'));
registerLazyCommand('market', 'Interact with prediction markets', () => import('./commands/market.js'));
registerLazyCommand('bet', 'Place bets on prediction markets', () => import('./commands/bet.js'));
registerLazyCommand('wager', 'Manage P2P prediction wagers', () => import('./commands/wager.js'));
registerLazyCommand('admin', 'Administrative tools for Shadow Market owners', () => import('./commands/admin.js'));

program
  .command('tui')
  .description('Launch interactive TUI dashboard')
  .action(async () => {
    const { startTUI } = await import('./tui/index.js');
    startTUI();
  });

program.parse(process.argv);
