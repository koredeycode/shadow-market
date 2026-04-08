import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { format } from 'date-fns';
import { Market } from '../types.js';

interface MarketDetailProps {
  market: Market;
  onPlaceBet: (amount: string, side: 'YES' | 'NO') => void;
  onPlaceWager: (amount: string, side: 'YES' | 'NO', odds: string) => void;
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
  const [oddsNum, setOddsNum] = useState('1');
  const [oddsDen, setOddsDen] = useState('1');
  const [executionStep, setExecutionStep] = useState(0); // 0: Side, 1: Amount, 2: Odds Num, 3: Odds Den, 4: Confirm
  const [step, setStep] = useState<'DETAILS' | 'BET' | 'WAGER'>('DETAILS');

  // Sanitization helper to remove DEL (\x7F) and other control characters
  const cleanInput = (val: string) => val.replace(/[\x00-\x1F\x7F]/g, '').trim();

  const handleWagerNext = () => {
    if (executionStep < 4) setExecutionStep(prev => prev + 1);
    else onPlaceWager(cleanInput(betAmount), betSide, `${cleanInput(oddsNum)}:${cleanInput(oddsDen)}`);
  };

  useInput((input, key) => {
    if (isSubmitting) return;
    if (key.escape) {
      if (step !== 'DETAILS') {
        if (step === 'WAGER' && executionStep > 0) setExecutionStep(prev => prev - 1);
        else setStep('DETAILS');
      } else {
        onBack();
      }
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
               <Text color={market.status === 'OPEN' ? 'green' : 'yellow'}>{market.status === 'OPEN' ? '🟢 OPEN' : market.status}</Text>
            </Box>
            <Box marginTop={1}>
               <Text bold color="white" wrap="wrap">{market.question}</Text>
            </Box>
            <Box marginTop={1}>
               <Text dimColor italic>{market.description || 'No description provided.'}</Text>
            </Box>
            <Box marginTop={1} justifyContent="space-between">
               <Text color="gray">Contract: {market.onchainId || market.id}</Text>
               <Text color="gray">Resolution: {format(new Date(market.endTime), 'PPP')}</Text>
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
                <Text color="yellow" bold>MARKET LIQUIDITY</Text>
                <Text color="white">{(Number(market.totalVolume || 0) / 1_000_000).toLocaleString()} NIGHT</Text>
             </Box>
          </Box>
        </Box>

        {/* Right Side: Audit Trail */}
        <Box flexDirection="column" width="45%" borderStyle="round" borderColor="gray" paddingX={1}>
            <Text bold color="white">AUDIT TRAIL: PUBLIC LEDGER</Text>
            {history.length === 0 ? (
              <Box paddingY={1} flexGrow={1} justifyContent="center" alignItems="center">
                  <Text dimColor italic>Syncing public activity from Indexer...</Text>
              </Box>
            ) : (
              <Box flexDirection="column" marginTop={1}>
                  {history.slice(0, 6).map((tx: any) => (
                      <Box key={tx.id} justifyContent="space-between" marginBottom={0}>
                          <Box>
                              <Text color="cyan">[{tx.txHash ? tx.txHash.slice(0, 8) : 'unknown'}] </Text>
                              <Text color="white">{tx.type === 'P2P' ? 'WAGER' : 'POOL'} x <Text dimColor>MASKED</Text></Text>
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
                <Text dimColor>Transactions are ZK-Shielded via Ledger Hub.</Text>
            </Box>
        </Box>
      </Box>

      {/* Bottom: Action terminal section */}
      <Box borderStyle="bold" borderColor="yellow" paddingX={2} paddingY={1} flexDirection="column" backgroundColor="black">
        {step === 'DETAILS' ? (
          <Box flexDirection="column">
             <Text color="cyan" bold underline>Terminal Action Menu</Text>
             <Box marginTop={1}>
                <SelectInput
                    items={[
                      { label: '🎯 PLACE POOL BET (AMM)', value: 'bet' },
                      { label: '🤝 CREATE P2P WAGER (Custom Ratio)', value: 'wager' },
                      { label: '🌐 VIEW ON WEB DASHBOARD', value: 'browser' },
                      ...(isAdmin && market.status === 'OPEN' ? [{ label: '🔒 LOCK MARKET (Admin)', value: 'lock' }] : []),
                      ...(isAdmin && market.status === 'LOCKED' ? [{ label: '🏁 RESOLVE MARKET (Admin)', value: 'resolve' }] : []),
                      { label: '⏎ GO BACK', value: 'back' }
                    ] as any}
                    onSelect={(i: any) => {
                      if (i.value === 'bet') { setStep('BET'); setExecutionStep(0); }
                      if (i.value === 'wager') { setStep('WAGER'); setExecutionStep(0); }
                      if (i.value === 'browser' && onOpenBrowser) onOpenBrowser(market);
                      if (i.value === 'lock' && onAdminAction) onAdminAction('lock');
                      if (i.value === 'resolve' && onAdminAction) onAdminAction('resolve');
                      if (i.value === 'back') onBack();
                    }}
                />
             </Box>
          </Box>
        ) : step === 'BET' ? (
            <Box flexDirection="column">
              <Text color="yellow" bold>POOL BET EXECUTION: (1/3) Choose Side</Text>
              <Box flexDirection="row" marginTop={1}>
                {executionStep === 0 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Select Side:</Text>
                    <SelectInput
                      items={[{label: 'YES', value: 'YES'}, {label: 'NO', value: 'NO'}]}
                      onSelect={(i) => { setBetSide(i.value as any); setExecutionStep(1); }}
                    />
                  </Box>
                )}
                {executionStep === 1 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Enter Stake (NIGHT):</Text>
                    <Box borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1} width={20}>
                      <TextInput 
                        value={betAmount} 
                        onChange={(v) => setBetAmount(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(2)} 
                      />
                    </Box>
                    <Box marginTop={1}>
                      <Text dimColor italic>Equates to {Number(cleanInput(betAmount) || 0) * 1000000} DUST on-chain.</Text>
                    </Box>
                  </Box>
                )}
                {executionStep === 2 && (
                  <Box flexDirection="column">
                    <Text color="white">Confirming <Text color={betSide === 'YES' ? 'green' : 'red'} bold>{betSide}</Text> bet for <Text bold>{betAmount} NIGHT</Text></Text>
                    <Box marginTop={1}>
                      <SelectInput 
                        items={[{label: '🚀 EXECUTE TRANSACTION', value: 'go'}, {label: 'Wait, I need to check...', value: 'wait'}]}
                        onSelect={(i) => i.value === 'go' ? onPlaceBet(cleanInput(betAmount), betSide) : setStep('DETAILS')}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box marginTop={1}>
                 <Text color="gray">Press ESC to go back.</Text>
              </Box>
            </Box>
        ) : (
          <Box flexDirection="column">
             <Text color="yellow" bold>P2P WAGER FLOW: Step {executionStep + 1} of 5</Text>
             <Box flexDirection="column" marginTop={1}>
                {executionStep === 0 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Choose Side to Back:</Text>
                    <SelectInput
                      items={[{label: 'BACK YES (Proposer)', value: 'YES'}, {label: 'BACK NO (Proposer)', value: 'NO'}]}
                      onSelect={(i) => { setBetSide(i.value as any); setExecutionStep(1); }}
                    />
                  </Box>
                )}
                {executionStep === 1 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Enter Wager Stake (NIGHT):</Text>
                    <Box borderStyle="single" borderColor="yellow" paddingX={1} marginTop={1} width={20}>
                      <TextInput 
                        value={betAmount} 
                        onChange={(v) => setBetAmount(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(2)} 
                      />
                    </Box>
                    <Box marginTop={1}>
                      <Text color="gray" italic>Tip: Tab to switch fields (if multiple), ENTER to proceed.</Text>
                    </Box>
                  </Box>
                )}
                {executionStep === 2 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Set Odds Ratio - Numerator (e.g. 1):</Text>
                    <Box borderStyle="single" borderColor="yellow" paddingX={1} marginTop={1} width={10}>
                      <TextInput 
                        value={oddsNum} 
                        onChange={(v) => setOddsNum(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(3)} 
                      />
                    </Box>
                    <Text dimColor>This is the payout multiple you want.</Text>
                  </Box>
                )}
                {executionStep === 3 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Set Odds Ratio - Denominator (e.g. 3):</Text>
                    <Box borderStyle="single" borderColor="yellow" paddingX={1} marginTop={1} width={10}>
                      <TextInput 
                        value={oddsDen} 
                        onChange={(v) => setOddsDen(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(4)} 
                      />
                    </Box>
                    <Text dimColor>Ratio: {oddsNum}:{oddsDen}</Text>
                  </Box>
                )}
                {executionStep === 4 && (
                  <Box flexDirection="column">
                    <Text color="white">Verify P2P Offer:</Text>
                    <Text>Stake: <Text bold color={betSide === 'YES' ? 'green' : 'red'}>{betAmount} NIGHT</Text></Text>
                    <Text>Ratio: <Text color="yellow" bold>{oddsNum}:{oddsDen}</Text></Text>
                    <Box marginTop={1}>
                       <SelectInput 
                         items={[{label: '🚀 BROADCAST P2P OFFER', value: 'go'}, {label: 'Cancel', value: 'wait'}]}
                         onSelect={(i) => i.value === 'go' ? onPlaceWager(cleanInput(betAmount), betSide, `${cleanInput(oddsNum)}:${cleanInput(oddsDen)}`) : setStep('DETAILS')}
                       />
                    </Box>
                  </Box>
                )}
             </Box>
             
             <Box marginTop={1}>
                {isSubmitting ? (
                  <Text color="yellow">… {submitStatus} …</Text>
                ) : (
                  <Text color="gray" dimColor>Press ESC to step back.</Text>
                )}
             </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
