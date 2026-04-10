import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface ConfigViewProps {
  initialUrl: string;
  onSave: (url: string) => void;
  onBack: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ initialUrl, onSave, onBack }) => {
  const [url, setUrl] = useState(initialUrl);

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="yellow" paddingX={2} marginBottom={1} justifyContent="space-between">
        <Text bold color="yellow">CUSTOM PROOF SERVER CONFIG</Text>
        <Text color="gray">[ESC] TO CANCEL</Text>
      </Box>

      <Box flexDirection="column" borderStyle="round" borderColor="white" padding={1}>
        <Text>Enter Proof Server URL:</Text>
        <Box borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
           <TextInput 
             value={url} 
             onChange={setUrl} 
             onSubmit={(val) => onSave(val)}
             placeholder="http://localhost:6300"
           />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Recommended to use an internal or trusted proof station.</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="yellow" bold>PRESS ENTER TO SAVE & SYNC</Text>
        </Box>
      </Box>
    </Box>
  );
};
