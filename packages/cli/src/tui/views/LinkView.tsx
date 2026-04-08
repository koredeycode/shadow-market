import React from 'react';
import { Box, Text, useInput } from 'ink';

interface LinkViewProps {
  pairingCode: string;
  onOpenBrowser: () => void;
  onQuit: () => void;
  walletAddress: string;
}

export const LinkView: React.FC<LinkViewProps> = ({ 
  pairingCode, 
  onOpenBrowser, 
  onQuit,
  walletAddress
}) => {
  useInput((input, key) => {
    if (input === 'o' || input === 'O') onOpenBrowser();
    if (key.escape) onQuit();
  });

  return (
    <Box flexDirection="column" borderStyle="bold" borderColor="yellow" padding={1} alignItems="center">
        <Text bold color="yellow">LINK REQUIRED</Text>
        <Text>Go to Shadow Market Web Dashboard and enter this code:</Text>
        <Box marginY={1} paddingX={2} borderStyle="double" borderColor="cyan">
            <Text bold color="cyan">{pairingCode || 'GENERATING...'}</Text>
        </Box>
        <Box marginBottom={1} flexDirection="column" alignItems="center">
            <Text>Or visit this URL directly:</Text>
            <Box marginTop={1} padding={1} borderStyle="single" borderColor="gray">
                <Text color="cyan" underline>{(process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173') + '/auth/link?code=' + (pairingCode || '')}</Text>
            </Box>
        </Box>
        <Box marginTop={1} flexDirection="column" alignItems="center">
            <Text dimColor>Authorized Address: <Text color="magenta">{walletAddress}</Text></Text>
        </Box>
        <Box marginTop={1} flexDirection="column" alignItems="center">
            <Text color="cyan" bold>Press [O] to open browser automatically</Text>
            <Text color="gray">This authorizes your CLI to use your web profile.</Text>
        </Box>

        <Box marginTop={2} justifyContent="center" borderStyle="single" borderColor="yellow" paddingX={2}>
            <Text color="yellow">[ WAITING FOR BROWSER CONFIRMATION ]</Text>
        </Box>
    </Box>
  );
};
