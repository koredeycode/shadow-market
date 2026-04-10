import React from 'react';
import { Box, Text } from 'ink';
import { WalletStatus } from '../types.js';
import { walletManager } from '../../core/wallet.js';

interface WalletProps {
  walletStatus: WalletStatus | null;
  onBack: () => void;
}

export const Wallet: React.FC<WalletProps> = ({ walletStatus, onBack }) => {
  const formatNight = (dust: bigint | string | number) => {
    const val = typeof dust === 'bigint' ? dust : BigInt(dust);
    return (Number(val) / 1_000_000).toFixed(2);
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="yellow" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="yellow">ZK-WALLET HUB</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" padding={1}>
        <Box justifyContent="space-between">
           <Text color="gray">NETWORK STATUS:</Text>
           <Text color={walletStatus?.isSynced ? 'green' : 'red'} bold>
             {walletStatus?.isSynced ? 'SYNCHRONIZED' : 'OUTSIDE CONSENSUS'}
           </Text>
        </Box>
        <Box justifyContent="space-between" marginTop={1}>
           <Text color="gray">LEDGER ADDRESS:</Text>
           <Text color="cyan">{walletStatus?.address || 'UNKNOWN'}</Text>
        </Box>
        <Box justifyContent="space-between" marginTop={1}>
           <Text color="gray">CONNECTED TO:</Text>
           <Text color="white">{walletStatus?.network || 'MIDNIGHT TESTNET'}</Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" borderStyle="bold" borderColor="cyan" padding={1}>
        <Box justifyContent="space-between">
           <Text color="cyan" bold>AVAILABLE BALANCE:</Text>
           <Text color="white" bold>{formatNight(walletStatus?.balance || 0n)} NIGHT</Text>
        </Box>
        <Box justifyContent="space-between" marginTop={1}>
           <Text color="gray">SHIELDED DUST:</Text>
           <Text color="gray">{walletStatus?.dust?.toString() || '0'} DUST</Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
        <Text color="yellow" bold>PROOF SERVER CONFIGURATION</Text>
        <Box justifyContent="space-between" marginTop={1}>
           <Text color="gray">SELECTION:</Text>
           <Text color="white" bold>{walletManager.getProofServerOption().toUpperCase()}</Text>
        </Box>
        <Box justifyContent="space-between" marginTop={1}>
           <Text color="gray">ACTIVE URL:</Text>
           <Text color="cyan">{walletManager.getProofServerUrl()}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>[S] TO CYCLE SERVERS | [P] TO SET CUSTOM URL</Text>
        </Box>
      </Box>

      <Box marginTop={2} flexDirection="column" paddingX={1}>
        <Text color="yellow" bold underline>Wallet Security & Privacy</Text>
        <Box marginTop={1}>
          <Text color="gray">
            Your wallet is managed locally. Transactions are prove-at-source and broadcast through the Shadow Indexer. 
            Ensure you have enough NIGHT for circuit fees and liquidity.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
