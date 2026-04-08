import React from 'react';
import { Box, Text } from 'ink';
import { UserProfile } from '../types.js';
import { format } from 'date-fns';

interface PortfolioProps {
  me: UserProfile | null;
  onBack: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ me, onBack }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">USER PORTFOLIO: {me?.username?.toUpperCase() || 'ANONYMOUS'}</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      {/* Stats Header */}
      <Box flexDirection="row" marginBottom={1} padding={1} borderStyle="single" borderColor="magenta" justifyContent="space-around">
        <Box flexDirection="column" alignItems="center">
          <Text color="gray">WIN RATE</Text>
          <Text color="white" bold>{Number((me as any)?.stats?.winRate || 0).toFixed(1)}%</Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color="gray">TOTAL PROFIT</Text>
          <Text color={Number((me as any)?.stats?.totalProfitLoss || 0) >= 0 ? 'green' : 'red'} bold>
            {Number((me as any)?.stats?.totalProfitLoss || 0).toFixed(2)} NIGHT
          </Text>
        </Box>
        <Box flexDirection="column" alignItems="center">
          <Text color="gray">TOTAL VOLUME</Text>
          <Text color="white" bold>{Number((me as any)?.stats?.totalVolume || 0).toLocaleString()} NIGHT</Text>
        </Box>
      </Box>

      {/* Active Positions */}
      <Box flexDirection="column" flexGrow={1}>
        <Text color="yellow" bold underline>ACTIVE BETS & WAGERS</Text>
        {!me?.bets?.length && !me?.wagers?.length ? (
          <Box marginTop={1} padding={1} borderStyle="round" borderColor="gray">
            <Text dimColor italic>No active positions found on the ledger.</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {me?.bets?.map((b: any) => (
              <Box key={b.id} justifyContent="space-between" marginBottom={0}>
                <Box>
                  <Text color="cyan">[{b.id.slice(0, 8)}] </Text>
                  <Text color="white">BET {b.side.toUpperCase()} @ {Number(b.entryPrice * 100).toFixed(0)}% </Text>
                </Box>
                <Box>
                  <Text color="white">{b.amount} NIGHT</Text>
                </Box>
              </Box>
            ))}
            {me?.wagers?.map((w: any) => (
              <Box key={w.id} justifyContent="space-between" marginBottom={0}>
                <Box>
                  <Text color="yellow">[{w.id.slice(0, 8)}] </Text>
                  <Text color="white">WAGER {w.creatorSide.toUpperCase()} ({w.odds}) </Text>
                </Box>
                <Box>
                  <Text color="white">{w.amount} NIGHT</Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
