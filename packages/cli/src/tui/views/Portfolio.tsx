import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { UserProfile } from '../types.js';

interface PortfolioProps {
  me: UserProfile | null;
  onBack: () => void;
  onSelectBet: (bet: any) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ me, onBack, onSelectBet }) => {
  const betItems = (me?.bets || []).map((b: any) => ({
    label: `[${b.id.slice(0, 8)}] BET ${b.side.toUpperCase()} @ ${(Number(b.entryPrice) * 100).toFixed(0)}% | ${b.amount} NIGHT`,
    value: b.id,
    bet: b
  }));

  const wagerItems = (me?.wagers || []).map((w: any) => ({
    label: `[${w.id.slice(0, 8)}] WAGER ${w.creatorSide.toUpperCase()} (${w.odds}) | ${w.amount} NIGHT`,
    value: w.id,
    wager: w
  }));

  const items = [
    ...betItems,
    ...wagerItems,
    { label: '--- BACK ---', value: 'back' }
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">USER PORTFOLIO: {me?.username?.toUpperCase() || 'ANONYMOUS'}</Text>
        <Box flexDirection="row">
           <Text color="gray">[ESC] TO BACK </Text>
        </Box>
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
        <Text color="yellow" bold underline>ACTIVE LEDGER POSITIONS</Text>
        {!items.length || (items.length === 1 && items[0].value === 'back') ? (
          <Box marginTop={1} padding={1} borderStyle="round" borderColor="gray">
            <Text dimColor italic>No active positions found on the ledger.</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            <SelectInput 
                items={items as any} 
                onSelect={(item: any) => {
                    if (item.value === 'back') onBack();
                    else if (item.bet) onSelectBet(item.bet);
                    // Wagers could be handled similarly if we have a WagerDetail view
                }} 
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};
