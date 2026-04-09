import React from 'react';
import { Box, Text, useInput } from 'ink';

interface HowItWorksProps {
  onBack: () => void;
  onNavigate?: (view: any) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onBack, onNavigate }) => {
  useInput((input, key) => {
    if (key.escape) onBack();
    if (input === 't' && onNavigate) onNavigate('terms');
    if (input === 'p' && onNavigate) onNavigate('privacy');
  });

  return (
    <Box flexDirection="column" paddingX={1}>
       <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">SYSTEM MANUAL // PROTOCOL EXECUTION</Text>
        <Text color="gray">[ESC] TO BACK</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} marginBottom={1}>
        <Text bold color="yellow">01. IDENTITY AUTHORIZATION</Text>
        <Box marginLeft={2} marginTop={1}>
           <Text color="white">Every action on Shadow Market requires a Midnight Network identity. Use the 'Login' view to provide your mnemonic or private key. Your credentials remain shielded and locally encrypted.</Text>
        </Box>

        <Box marginTop={1}>
          <Text bold color="yellow">02. PREDICTION ESCROW</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
           <Text color="white">When you place a bet, your NIGHT tokens are locked in a ZK-shielded contract. Neither the platform nor any third party can spend these funds until the market is resolved.</Text>
        </Box>

        <Box marginTop={1}>
          <Text bold color="yellow">03. ZERO-KNOWLEDGE PROOFS</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
           <Text color="white">The terminal generates proofs for every transaction. This ensures that while your bet is verified on-chain, your specific identity is never exposed to the public ledger.</Text>
        </Box>

        <Box marginTop={1}>
          <Text bold color="yellow">04. P2P WAGERING</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
           <Text color="white">Beyond standard pools, you can create direct P2P wagers with custom odds. These are matched directly with other users via the Shadow P2P engine.</Text>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="space-between">
        <Box>
            <Text color="gray">[t] TERMS </Text>
            <Text color="gray">[p] PRIVACY </Text>
        </Box>
        <Text dimColor italic>Shadow Market v0.2.0 • Privacy is a Human Right</Text>
      </Box>
    </Box>
  );
};
