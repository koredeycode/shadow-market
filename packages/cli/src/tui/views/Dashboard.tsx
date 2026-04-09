import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Market, WalletStatus, UserProfile } from '../types.js';

interface DashboardProps {
  walletStatus: WalletStatus | null;
  me: UserProfile | null;
  markets: Market[];
  onSelectTab: (tab: string) => void;
  onMarketSelect: (market: Market) => void;
  compact?: boolean;
  isAdmin?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  walletStatus,
  me,
  markets,
  onSelectTab,
  onMarketSelect,
  compact = false
}) => {
  const formatBalance = (amount: bigint, suffix: string) => {
    // Assuming 6 decimals for the protocol tokens
    const value = Number(amount) / 1_000_000;
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + suffix;
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" width="100%">
        <Text bold underline color="white">Market Overview</Text>
        <Box marginTop={1} flexDirection="column">
          {markets.slice(0, 5).length === 0 ? (
            <Box marginTop={1} height={5} borderStyle="round" borderColor="gray" justifyContent="center">
              <Text dimColor italic>Syncing markets from Shadow Indexer...</Text>
            </Box>
          ) : (
            markets.slice(0, 5).map((m: any) => (
              <Box key={m.id} marginBottom={1}>
                <Text color="magenta">[{m.onchainId ? m.onchainId.slice(0, 8) : m.id.split('-')[0]}] </Text>
                <Text bold color="white">{m.question.substring(0, 45)}{m.question.length > 45 ? '...' : ''}</Text>
                <Box marginLeft={2}>
                  <Text color="green">{(Number(m.yesPrice || 0.5) * 100).toFixed(0)}%</Text>
                  <Text color="gray"> / </Text>
                  <Text color="red">{(Number(m.noPrice || 0.5) * 100).toFixed(0)}%</Text>
                </Box>
              </Box>
            ))
          )}
        </Box>
        <Box marginTop={1}>
          <Text color="cyan" dimColor>Press [m] for all markets</Text>
        </Box>
      </Box>

      {me && !compact && (
        <Box marginTop={1} borderStyle="round" borderColor="white" padding={1} flexDirection="column">
           <Text bold color="magenta">USER ACCOUNT: {me.username || 'Anonymous'}</Text>
           <Box marginTop={1} justifyContent="space-between">
              <Text color="gray">RECENT BETS: {me.bets?.length || 0}</Text>
              <Text color="gray">TOTAL WAGERS: {me.wagers?.length || 0}</Text>
           </Box>
        </Box>
      )}

      {!compact && (
        <Box marginTop={2} flexDirection="column">
          <Text color="yellow" bold underline>Terminal Quick Actions</Text>
          <Box marginTop={1}>
            <SelectInput
               items={[
                 { label: 'BROWSE MARKETS', value: 'markets' },
                 { label: 'CREATE MARKET', value: 'create' },
                 { label: 'PORTFOLIO', value: 'portfolio' },
                 { label: 'WALLET HUB', value: 'wallet' },
                 { label: 'INTELLIGENCE (ANALYTICS)', value: 'analytics' },
                 { label: 'SYSTEM HELP', value: 'help' },
               ] as any}
               onSelect={(i: any) => onSelectTab(i.value)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
