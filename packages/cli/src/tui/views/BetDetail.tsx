import React from 'react';
import { Box, Text, useInput } from 'ink';
import { format } from 'date-fns';

interface BetDetailProps {
  bet: any;
  onBack: () => void;
  userAddress: string;
  onClaim?: (bet: any) => void;
}

export const BetDetail: React.FC<BetDetailProps> = ({ 
  bet, 
  onBack, 
  userAddress,
  onClaim
}) => {
  if (!bet) return null;

  const isProfitable = parseFloat(bet.profitLoss || '0') >= 0;
  const side = bet.side || 'unknown';
  const question = bet.marketQuestion;
  const timestamp = bet.entryTimestamp;
  const entryPrice = `${(Number(bet.entryPrice || 0) * 100).toFixed(1)}%`;
  
  const status = bet.isSettled ? 'SETTLED' : 'ACTIVE';
  const marketStatus = bet.marketStatus;

  const canClaim = marketStatus === 'RESOLVED' && status !== 'SETTLED';

  useInput((input, key) => {
    if (key.escape) onBack();
    if (input === 'c' && canClaim && onClaim) onClaim(bet);
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between" width="100%">
        <Text bold color="cyan">POOL BET RECEIPT: {bet.id.toUpperCase().slice(0, 12)}</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="white">{question || 'Synchronizing market data...'}</Text>
        <Box marginTop={1} justifyContent="space-between">
           <Text dimColor>Market ID: {bet.marketId}</Text>
           <Text color="yellow">Status: {status}</Text>
        </Box>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">AMM POSITION DATA</Text>
          <Box justifyContent="space-between" marginTop={1}>
            <Text>SIDE:</Text>
            <Text color={side === 'yes' ? 'green' : 'red'} bold>{side.toUpperCase()}</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>STAKE:</Text>
            <Text color="white" bold>{bet.amount} NIGHT</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>ENTRY:</Text>
            <Text color="white" bold>{entryPrice}</Text>
          </Box>
        </Box>

        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="magenta" paddingX={1} marginLeft={1}>
          <Text color="gray">PERFORMANCE</Text>
          <Box justifyContent="space-between" marginTop={1}>
            <Text>PNL:</Text>
            <Text color={isProfitable ? 'green' : 'red'} bold>
              {isProfitable ? '+' : ''}{Number(bet.profitLoss || 0).toFixed(4)} NIGHT
            </Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>VALUE:</Text>
            <Text color="white" bold>{Number(bet.currentValue || bet.amount).toFixed(4)} NIGHT</Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1}>
        <Text color="gray">ON-CHAIN PROOF</Text>
        <Box marginTop={1} flexDirection="column">
           <Text color="cyan">Transaction Hash:</Text>
           <Text color="white" wrap="wrap" dimColor>{bet.txHash || 'PENDING_INDEXER_SYNC'}</Text>
        </Box>
        <Box marginTop={1} justifyContent="space-between">
           <Text color="gray">Contract Reference: {bet.onchainId || 'ZK_SHIELDED_POOL'}</Text>
           <Text color="gray">Time: {timestamp ? format(new Date(timestamp), 'PPP p') : 'Unknown'}</Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" alignItems="center">
        {canClaim && (
          <Box borderStyle="round" borderColor="green" paddingX={2}>
            <Text bold color="green">[c] CLAIM POOL PAYOUT</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor italic>Verified by Midnight Network Transactions • Confidentiality Guaranteed</Text>
        </Box>
      </Box>
    </Box>
  );
};
