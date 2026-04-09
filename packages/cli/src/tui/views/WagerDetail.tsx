import React from 'react';
import { Box, Text, useInput } from 'ink';
import { format } from 'date-fns';

interface WagerDetailProps {
  wager: any;
  onBack: () => void;
  userAddress: string;
  onClaim?: (wager: any) => void;
  onMatch?: (wager: any) => void;
  onWithdraw?: (wager: any) => void;
}

export const WagerDetail: React.FC<WagerDetailProps> = ({ 
  wager, 
  onBack, 
  userAddress,
  onClaim,
  onMatch,
  onWithdraw
}) => {
  if (!wager) return null;

  const isProfitable = parseFloat(wager.profitLoss || '0') >= 0;
  const side = wager.creatorSide || 'unknown';
  const question = wager.market?.question;
  const timestamp = wager.createdAt;
  const odds = `${wager.odds[0]}:${wager.odds[1]}`;
  
  const status = wager.status;
  const marketStatus = wager.market?.status;

  const isCreator = wager.creator?.address?.toLowerCase() === userAddress?.toLowerCase();
  
  const canClaim = marketStatus === 'RESOLVED' && status !== 'SETTLED' && status !== 'CANCELLED';
  const canMatch = !isCreator && status === 'OPEN';
  const canWithdraw = isCreator && status === 'OPEN';

  useInput((input, key) => {
    if (key.escape) onBack();
    if (input === 'c' && canClaim && onClaim) onClaim(wager);
    if (input === 'm' && canMatch && onMatch) onMatch(wager);
    if (input === 'w' && canWithdraw && onWithdraw) onWithdraw(wager);
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between" width="100%">
        <Text bold color="cyan">P2P WAGER RECEIPT: {wager.id.toUpperCase().slice(0, 12)}</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="white">{question || 'Synchronizing market data...'}</Text>
        <Box marginTop={1} justifyContent="space-between">
           <Text dimColor>Market ID: {wager.marketId}</Text>
           <Text color="yellow">Status: {status}</Text>
        </Box>
      </Box>

      <Box flexDirection="row" marginBottom={1}>
        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">P2P POSITION DATA</Text>
          <Box justifyContent="space-between" marginTop={1}>
            <Text>SIDE:</Text>
            <Text color={side === 'yes' ? 'green' : 'red'} bold>{side.toUpperCase()}</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>STAKE:</Text>
            <Text color="white" bold>{wager.amount} NIGHT</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>ODDS:</Text>
            <Text color="white" bold>{odds}</Text>
          </Box>
        </Box>

        <Box flexDirection="column" width="50%" borderStyle="single" borderColor="magenta" paddingX={1} marginLeft={1}>
          <Text color="gray">PERFORMANCE</Text>
          <Box justifyContent="space-between" marginTop={1}>
            <Text>PNL:</Text>
            <Text color={isProfitable ? 'green' : 'red'} bold>
              {isProfitable ? '+' : ''}{Number(wager.profitLoss || 0).toFixed(4)} NIGHT
            </Text>
          </Box>
          <Box justifyContent="space-between">
            <Text>VALUE:</Text>
            <Text color="white" bold>{Number(wager.currentValue || wager.amount).toFixed(4)} NIGHT</Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1}>
        <Text color="gray">SHADOW LEDGER PROOF</Text>
        <Box marginTop={1} flexDirection="column">
           <Text color="cyan">Transaction Hash:</Text>
           <Text color="white" wrap="wrap" dimColor>{wager.txHash || 'PENDING_INDEXER_SYNC'}</Text>
        </Box>
        <Box marginTop={1} justifyContent="space-between">
           <Text color="gray">On-chain ID: {wager.onchainId || 'ZK_SHIELDED'}</Text>
           <Text color="gray">Created: {timestamp ? format(new Date(timestamp), 'PPP p') : 'Unknown'}</Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" alignItems="center">
        {canClaim && (
          <Box borderStyle="round" borderColor="green" paddingX={2}>
            <Text bold color="green">[c] CLAIM P2P PAYOUT</Text>
          </Box>
        )}
        {canMatch && (
          <Box borderStyle="round" borderColor="blue" paddingX={2}>
            <Text bold color="blue">[m] MATCH P2P OFFER</Text>
          </Box>
        )}
        {canWithdraw && (
          <Box borderStyle="round" borderColor="red" paddingX={2}>
            <Text bold color="red">[w] WITHDRAW OFFER</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor italic>Verified Peer-to-Peer Transaction • No Central Escrow</Text>
        </Box>
      </Box>
    </Box>
  );
};
