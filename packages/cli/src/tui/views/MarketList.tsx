import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { Market } from '../types.js';

interface MarketListProps {
  markets: Market[];
  onSelect: (market: Market) => void;
  onBack: () => void;
}

export const MarketList: React.FC<MarketListProps> = ({ markets, onSelect, onBack }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1} justifyContent="space-between" borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">Select Market to Bet</Text>
        <Text color="gray">Found {markets.length} active</Text>
      </Box>
      <SelectInput
        items={markets.map(m => ({ 
          label: `${m.question.substring(0, 50)}${m.question.length > 50 ? '...' : ''} [${(Number(m.yesPrice || 0.5) * 100).toFixed(0)}%]`, 
          value: m 
        }))}
        onSelect={(item) => onSelect(item.value)}
      />
      <Box marginTop={1}>
         <Text color="gray" dimColor>Press [ESC] to go back.</Text>
      </Box>
    </Box>
  );
};
