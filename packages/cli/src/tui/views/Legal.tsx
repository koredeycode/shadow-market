import React from 'react';
import { Box, Text } from 'ink';

interface LegalProps {
  type: 'terms' | 'privacy';
  onBack: () => void;
}

export const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
       <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">{type === 'terms' ? 'TERMS OF SERVICE' : 'PRIVACY PROTOCOL'}</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} marginBottom={1}>
        <Text italic color="white">
            {type === 'terms' 
                ? "This interface is a decentralized gateway to the Midnight Network. Use at your own risk. By interacting with these protocols, you agree to the immutable laws of the blockchain. Shadow Market is not responsible for losses due to market volatility or contract failure."
                : "Your privacy is protected by Zero-Knowledge proofs. No PII is collected or stored. Your identity is only used to generate cryptographic witnesses for transaction verification. All data is stored locally or indexed in an encrypted format."
            }
        </Text>
      </Box>

      <Box marginTop={1} justifyContent="center">
        <Text dimColor italic>Shadow Market Legal Framework v1.0</Text>
      </Box>
    </Box>
  );
};
