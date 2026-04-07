import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { format } from 'date-fns';
import { Market } from '../types.js';

interface MarketDetailProps {
  market: Market;
  onPlaceBet: (amount: string, side: 'YES' | 'NO') => void;
  onPlaceWager: (amount: string, side: 'YES' | 'NO') => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitStatus: string;
  history: any[];
  onOpenBrowser?: (market: Market) => void;
  isAdmin?: boolean;
  onAdminAction?: (action: 'lock' | 'resolve', data?: any) => void;
}

export const MarketDetail: React.FC<MarketDetailProps> = ({
  market,
  onPlaceBet,
  onPlaceWager,
  onBack,
  isSubmitting,
  submitStatus,
  history,
  onOpenBrowser,
  isAdmin = false,
  onAdminAction
}) => {
  const [betAmount, setBetAmount] = useState('10');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [step, setStep] = useState<'DETAILS' | 'BET' | 'WAGER'>('DETAILS');

  useInput((input, key) => {
    if (isSubmitting) return;
    if (key.escape) {
      if (step !== 'DETAILS') setStep('DETAILS');
      else onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" marginBottom={1}>
        {/* Left Side: Market Data */}
        <Box flexDirection="column" width="55%" marginRight={2}>
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

          <Box flexDirection="row" borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-around">
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
                <Text color="white">{(Number(market.totalVolume || 0) / 1_000_000).toLocaleString()} NIGHT</Text>
             </Box>
          </Box>
        </Box>

        {/* Right Side: Audit Trail */}
        <Box flexDirection="column" width="45%" borderStyle="round" borderColor="gray" paddingX={1}>
            <Text bold color="white">AUDIT TRAIL: RECENT TRANSACTIONS</Text>
            {history.length === 0 ? (
              <Box paddingY={1} flexGrow={1} justifyContent="center" alignItems="center">
                  <Text dimColor italic>No public transactions recorded yet.</Text>
              </Box>
            ) : (
              <Box flexDirection="column" marginTop={1}>
                  {history.slice(0, 6).map((tx: any) => (
                      <Box key={tx.id} justifyContent="space-between" marginBottom={0}>
                          <Box>
                              <Text color="cyan">[{tx.txHash ? tx.txHash.slice(0, 8) : 'unknown'}] </Text>
                              <Text color="white">{tx.type === 'P2P' ? 'WAGER' : 'BET'} x <Text dimColor>MASKED</Text></Text>
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
                <Text dimColor>ZK-Shielded Verification by Ledger Hub.</Text>
            </Box>
        </Box>
      </Box>

      {/* Bottom: Action terminal section */}
      <Box borderStyle="single" borderColor="yellow" paddingX={2} paddingY={1} flexDirection="column">
        {step === 'DETAILS' ? (
          <Box flexDirection="column">
             <Text color="cyan" bold underline>Terminal Execution</Text>
             <Box marginTop={1}>
                <SelectInput
                    items={[
                      { label: 'POOL BET (Automated Liquidity)', value: 'bet' },
                      { label: 'P2P WAGER (Custom Outcome)', value: 'wager' },
                      { label: 'VIEW ON WEB PORTAL', value: 'browser' },
                      ...(isAdmin && market.status === 'OPEN' ? [{ label: '🔒 LOCK MARKET (ADMIN ONLY)', value: 'lock' }] : []),
                      ...(isAdmin && market.status === 'LOCKED' ? [{ label: '🏁 RESOLVE MARKET (ADMIN ONLY)', value: 'resolve' }] : []),
                      { label: 'GO BACK', value: 'back' }
                    ] as any}
                    onSelect={(i: any) => {
                      if (i.value === 'bet') setStep('BET');
                      if (i.value === 'wager') setStep('WAGER');
                      if (i.value === 'browser' && onOpenBrowser) onOpenBrowser(market);
                      if (i.value === 'lock' && onAdminAction) onAdminAction('lock');
                      if (i.value === 'resolve' && onAdminAction) onAdminAction('resolve');
                      if (i.value === 'back') onBack();
                    }}
                />
             </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
             <Text color="yellow" bold>EXECUTION FORM: {step === 'BET' ? 'POOL BET' : 'P2P WAGER'}</Text>
             <Box flexDirection="row" marginTop={1}>
                <Box flexDirection="column" width="30%">
                   <Text>Side: </Text>
                   <SelectInput
                      items={[{label: 'YES', value: 'YES'}, {label: 'NO', value: 'NO'}]}
                      onSelect={(i) => setBetSide(i.value as any)}
                   />
                </Box>
                <Box flexDirection="column" width="70%" marginLeft={4}>
                   <Text>Amount (tNight): </Text>
                   <TextInput 
                      value={betAmount} 
                      onChange={setBetAmount} 
                      onSubmit={() => step === 'BET' ? onPlaceBet(betAmount, betSide) : onPlaceWager(betAmount, betSide)} 
                   />
                   
                   {isSubmitting && (
                     <Box marginTop={1}>
                        <Text color="yellow">… {submitStatus} …</Text>
                     </Box>
                   )}

                   {!isSubmitting && (
                     <Box marginTop={1}>
                        <Text color="gray" dimColor>Press ENTER to submit, ESC to go back.</Text>
                     </Box>
                   )}
                </Box>
             </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
