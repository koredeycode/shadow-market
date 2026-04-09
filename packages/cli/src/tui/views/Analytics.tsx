import React from 'react';
import { Box, Text } from 'ink';

interface AnalyticsProps {
  stats: any;
  onBack: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, onBack }) => {
  if (!stats) return (
    <Box padding={2}>
      <Text color="yellow">Retrieving global protocol Intelligence...</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" paddingX={1}>
       <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">INTELLIGENCE TERMINAL // CROSS-NETWORK ANALYTICS</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" width="25%" borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">VOLUME</Text>
          <Box marginTop={1}>
            <Text bold color="white">${Number(stats.totalVolume).toLocaleString()}</Text>
          </Box>
          <Text color="green" dimColor>+12.4% 24H</Text>
        </Box>
        <Box flexDirection="column" width="25%" borderStyle="single" borderColor="gray" paddingX={1} marginLeft={1}>
          <Text color="gray">PROTOCOLS</Text>
          <Box marginTop={1}>
            <Text bold color="white">{stats.totalMarkets}</Text>
          </Box>
          <Text color="gray" dimColor>ACTIVE</Text>
        </Box>
        <Box flexDirection="column" width="25%" borderStyle="single" borderColor="gray" paddingX={1} marginLeft={1}>
          <Text color="gray">IDENTITIES</Text>
          <Box marginTop={1}>
            <Text bold color="white">{stats.totalUsers}</Text>
          </Box>
          <Text color="gray" dimColor>AUTHORIZED</Text>
        </Box>
        <Box flexDirection="column" width="25%" borderStyle="single" borderColor="gray" paddingX={1} marginLeft={1}>
          <Text color="gray">TVL</Text>
          <Box marginTop={1}>
            <Text bold color="white">${Number(stats.totalValueLocked).toLocaleString()}</Text>
          </Box>
          <Text color="gray" dimColor>SAFEGUARDED</Text>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} flexGrow={1}>
        <Text color="yellow" bold underline>NETWORK THROUGHPUT HISTORY</Text>
        <Box marginTop={1} flexDirection="column">
            <Text color="blue">▃▅▇█▆▅▃▂ </Text>
            <Text dimColor>24h activity trend</Text>
        </Box>
        
        <Box marginTop={2} flexDirection="column">
          <Text bold color="white">TOP PERFORMANCE SECTORS</Text>
          <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
             <Text color="magenta">CRYPTO</Text>
             <Text color="white">42.5% Vol</Text>
          </Box>
          <Box flexDirection="row" justifyContent="space-between">
             <Text color="magenta">POLITICS</Text>
             <Text color="white">28.1% Vol</Text>
          </Box>
          <Box flexDirection="row" justifyContent="space-between">
             <Text color="magenta">AI_AGENTS</Text>
             <Text color="white">15.4% Vol</Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="center">
        <Text dimColor italic>Shadow Market Intelligence Unit // End-to-End Visibility Enabled</Text>
      </Box>
    </Box>
  );
};
