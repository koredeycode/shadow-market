import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { format } from 'date-fns';
import { Market } from '../types.js';

interface MarketDetailProps {
  market: Market;
  onPlaceBet: (amount: string, side: 'YES' | 'NO') => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitStatus: string;
  history: any[];
}

export const MarketDetail: React.FC<MarketDetailProps> = ({
  market,
  onPlaceBet,
  onBack,
  isSubmitting,
  submitStatus,
  history
}) => {
  const [betAmount, setBetAmount] = useState('10');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [step, setStep] = useState<'DETAILS' | 'BET'>('DETAILS');

  useInput((input, key) => {
    if (isSubmitting) return;
    if (key.escape) {
      if (step === 'BET') setStep('DETAILS');
      else onBack();
    }
  });

  return (
    <Box flexDirection="column">
      {/* Header section */}
      <Box borderStyle="round" borderColor="magenta" paddingX={2} marginBottom={1} flexDirection="column">
        <Box justifyContent="space-between" width="100%">
           <Text color="cyan" bold>{market.category.toUpperCase()}</Text>
           <Text color={market.status === 'OPEN' ? 'green' : 'yellow'}>{market.status}</Text>
        </Box>
        <Box marginTop={1}>
           <Text bold color="white" wrap="wrap">{market.question}</Text>
        </Box>
        <Box marginTop={1}>
           <Text dimColor italic>{market.description || 'No description provided.'}</Text>
        </Box>
        <Box marginTop={1} justifyContent="space-between">
           <Text color="gray">ID: {market.onchainId || market.id}</Text>
           <Text color="gray">Ends: {format(new Date(market.endTime), 'PPP')}</Text>
        </Box>
      </Box>

      {/* Stats bar */}
      <Box flexDirection="row" borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1} justifyContent="space-around">
         <Box flexDirection="column" alignItems="center">
            <Text color="green" bold>YES</Text>
            <Text color="white">{(Number(market.yesPrice) * 100).toFixed(1)}%</Text>
         </Box>
         <Box flexDirection="column" alignItems="center">
            <Text color="red" bold>NO</Text>
            <Text color="white">{(Number(market.noPrice) * 100).toFixed(1)}%</Text>
         </Box>
         <Box flexDirection="column" alignItems="center">
            <Text color="yellow" bold>TOTAL VOLUME</Text>
            <Text color="white">1.2k NIGHT</Text>
         </Box>
      </Box>

      {/* Action terminal section */}
      {step === 'DETAILS' ? (
        <Box flexDirection="column" marginTop={1}>
           <Text color="cyan" bold underline>Terminal Execution</Text>
           <Box marginTop={1}>
              <SelectInput
                 items={[
                   { label: 'PLACE A NEW BET', value: 'bet' },
                   { label: 'VIEW ON-CHAIN RECORD', value: 'view' },
                   { label: 'GO BACK', value: 'back' }
                 ]}
                 onSelect={(i) => {
                   if (i.value === 'bet') setStep('BET');
                   if (i.value === 'back') onBack();
                 }}
              />
           </Box>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1} borderStyle="classic" borderColor="yellow" padding={1}>
           <Text color="yellow" bold>EXECUTION FORM: PLACE BET</Text>
           <Box marginTop={1}>
              <Text>Side: </Text>
              <SelectInput
                  items={[{label: 'YES', value: 'YES'}, {label: 'NO', value: 'NO'}]}
                  onSelect={(i) => setBetSide(i.value as any)}
              />
           </Box>
           <Box marginTop={1}>
              <Text>Amount (tNight): </Text>
              <TextInput value={betAmount} onChange={setBetAmount} onSubmit={() => onPlaceBet(betAmount, betSide)} />
           </Box>
           
           {isSubmitting && (
             <Box marginTop={1}>
                <Text color="yellow"><Spinner type="dots" /> {submitStatus}</Text>
             </Box>
           )}

           {!isSubmitting && (
             <Box marginTop={1}>
                <Text color="gray" dimColor>Press ENTER to submit, ESC to go back.</Text>
             </Box>
           )}
        </Box>
      )}

      {/* Market History Loop */}
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
          <Text bold color="white">AUDIT TRAIL: RECENT TRANSACTIONS</Text>
          {history.length === 0 ? (
            <Box paddingY={1} justifyContent="center">
                <Text dimColor italic>No public transactions recorded yet.</Text>
            </Box>
          ) : (
            <Box flexDirection="column" marginTop={1}>
                {history.slice(0, 4).map((tx: any) => (
                    <Box key={tx.id} justifyContent="space-between" marginBottom={0}>
                        <Box>
                            <Text color="cyan">[{tx.txHash ? tx.txHash.slice(0, 8) : 'unknown'}] </Text>
                            <Text color="white">BET x <Text dimColor>MASKED</Text></Text>
                        </Box>
                        <Box>
                            <Text color="yellow">{Number(tx.entryPrice * 100).toFixed(0)}% </Text>
                            <Text color="gray">at {format(new Date(tx.timestamp), 'HH:mm')}</Text>
                        </Box>
                    </Box>
                ))}
            </Box>
          )}
          <Box marginTop={1} justifyContent="center">
              <Text dimColor>Amount and Side are ZK-Shielded. Public only verified by Ledger Hub.</Text>
          </Box>
      </Box>
    </Box>
  );
};
