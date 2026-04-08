import React from 'react';
import { Box, Text, useInput } from 'ink';

interface SuccessModalProps {
  title: string;
  message: string;
  txHash?: string;
  onClose: () => void;
  primaryActionLabel?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  title,
  message,
  txHash,
  onClose,
  primaryActionLabel = 'Continue (Enter)'
}) => {
  useInput((input, key) => {
    if (key.return || key.escape || input === 'y' || input === 'Y') {
      onClose();
    }
  });

  return (
    <Box 
      position="absolute" 
      width="100%" 
      height="100%" 
      alignItems="center" 
      justifyContent="center"
    >
      <Box 
        flexDirection="column" 
        borderStyle="bold" 
        borderColor="green" 
        padding={2} 
        paddingX={4}
        alignItems="center"
        width={65}
        backgroundColor="black"
      >
        <Box marginBottom={1}>
           <Text bold color="green"> [ {title.toUpperCase()} ] </Text>
        </Box>
        
        <Box marginY={1} width="100%" justifyContent="center">
          <Text color="white" wrap="wrap">{message}</Text>
        </Box>

        {txHash && (
           <Box marginTop={1} flexDirection="column" alignItems="center">
              <Text dimColor>Transaction Hash:</Text>
              <Text color="cyan" bold>{txHash}</Text>
              <Text color="gray" dimColor italic>(Logged in Network Transactions)</Text>
           </Box>
        )}

        <Box marginTop={2} borderStyle="bold" borderColor="green" paddingX={2}>
          <Text color="green" bold>{primaryActionLabel.toUpperCase()}</Text>
        </Box>
      </Box>
    </Box>
  );
};
