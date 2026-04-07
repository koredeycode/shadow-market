import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

interface LoginViewProps {
  onLogin: (method: 'mnemonic' | 'key', data: string) => Promise<void>;
  onQuit: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onQuit }) => {
  const [stage, setStage] = useState<'CHOICE' | 'MNEMONIC' | 'KEY' | 'LOGGING_IN'>('CHOICE');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (val: string) => {
    if (stage === 'KEY' && val.length !== 128) {
      setError(`Invalid length: Must be 128 characters. Got ${val.length}.`);
      return;
    }
    if (stage === 'MNEMONIC' && val.split(' ').length < 12) {
      setError('Invalid. Mnemonic must be at least 12 words.');
      return;
    }
    
    setError('');
    const method = stage === 'MNEMONIC' ? 'mnemonic' : 'key';
    setStage('LOGGING_IN');
    onLogin(method, val).catch(e => {
        setError(e.message);
        setStage(method === 'mnemonic' ? 'MNEMONIC' : 'KEY');
    });
  };

  useInput((inputVal, key) => {
    if (key.escape) {
      if (stage === 'CHOICE') onQuit();
      else {
        setStage('CHOICE');
        setInput('');
        setError('');
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="bold" borderColor="red" padding={1}>
        <Box justifyContent="center">
            <Text bold color="red">LOGIN REQUIRED</Text>
        </Box>

        {stage === 'CHOICE' && (
            <Box flexDirection="column" marginTop={1}>
                <Text>Select your login method:</Text>
                <SelectInput
                    items={[
                    { label: 'Enter Seed Phrase (Mnemonic)', value: 'MNEMONIC' },
                    { label: 'Enter Private Key (Hex Hex Seed)', value: 'KEY' }
                    ]}
                    onSelect={(i) => { setStage(i.value as any); setError(''); }}
                />
                <Box marginTop={1}>
                    <Text dimColor>Alternatively, run </Text>
                    <Text color="cyan" bold>shadow-market wallet login</Text>
                </Box>
                <Box marginTop={1}>
                   <Text dimColor>Press ESC to quit terminal.</Text>
                </Box>
            </Box>
        )}

        {(stage === 'MNEMONIC' || stage === 'KEY') && (
            <Box flexDirection="column" marginTop={1}>
                <Text bold color="cyan">{stage === 'MNEMONIC' ? 'Enter Seed Phrase (12+ words):' : 'Enter 128-char Master Hex Seed (64 bytes):'}</Text>
                <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                    <TextInput
                    value={input}
                    onChange={setInput}
                    mask="*"
                    onSubmit={handleSubmit}
                    />
                </Box>
                {error && <Text color="red">{error}</Text>}
                <Text dimColor>Press ENTER to submit, ESC to go back.</Text>
            </Box>
        )}

        {stage === 'LOGGING_IN' && (
            <Box marginTop={1}>
                <Text color="yellow">… Logging in & Syncing wallet …</Text>
            </Box>
        )}
    </Box>
  );
};
