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
  const items = [
    ...markets.map(m => ({ 
      label: `[${m.category.toUpperCase().slice(0, 4)}] ${m.question.substring(0, 40)}${m.question.length > 40 ? '..' : ''} | YES: ${(Number(m.yesPrice || 0.5) * 100).toFixed(0)}% | Vol: ${(Number(m.totalVolume || 0) / 1_000_000).toFixed(1)}k`, 
      value: m 
    })),
    { label: '--- BACK ---', value: 'back' }
  ];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} justifyContent="space-between" borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">ACTIVE PREDICTION PROTOCOLS</Text>
        <Text color="gray">Found {markets.length} instances</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <SelectInput
          items={items as any}
          onSelect={(item: any) => {
              if (item.value === 'back') onBack();
              else onSelect(item.value);
          }}
        />
      </Box>
      <Box marginTop={1} justifyContent="space-between">
         <Text color="gray" dimColor>[ESC] Back [↑/↓] Select [ENTER] Details</Text>
         <Text color="cyan" dimColor>Verified LedgerHub Sync</Text>
      </Box>
    </Box>
  );
};
