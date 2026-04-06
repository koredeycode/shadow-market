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
      <Box justifyContent="space-between">
        {!compact && (
          <Box flexDirection="column" width="60%">
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
        )}

        <Box flexDirection="column" width={compact ? "100%" : "35%"} borderStyle="single" borderColor="blue" paddingX={1}>
           <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
              <Text bold color="cyan">WALLET HUB</Text>
           </Box>
           {walletStatus ? (
             <Box flexDirection="column">
                <Text color="gray">Balance:</Text>
                <Text color="green" bold>{formatBalance(walletStatus.balance, 'tN')}</Text>
                
                <Box marginTop={1} flexDirection="column">
                  <Text color="gray">Dust:</Text>
                  <Text color="yellow">{formatBalance(walletStatus.dust, 'tD')}</Text>
                </Box>
                
                <Box marginTop={1} flexDirection="column">
                  <Text color="gray">Status:</Text>
                  <Text color={walletStatus.isSynced ? 'green' : 'yellow'}>{walletStatus.isSynced ? 'Synced' : 'Syncing'}</Text>
                </Box>
             </Box>
           ) : (
                <Box flexDirection="column" alignItems="center" justifyContent="center" height={5}>
                    <Text color="red" bold italic>Login Required</Text>
                </Box>
           )}
        </Box>
      </Box>

      {me && !compact && (
        <Box marginTop={1} borderStyle="round" borderColor="white" padding={1} flexDirection="column">
           <Text bold color="magenta">USER ACCOUNT: {me.username || 'Anonymous'}</Text>
           <Box marginTop={1} justifyContent="space-between">
              <Text color="gray">Recent Bets: {me.bets?.length || 0}</Text>
              <Text color="gray">Total Wagers: 0</Text>
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
               ] as any}
               onSelect={(i: any) => onSelectTab(i.value)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
