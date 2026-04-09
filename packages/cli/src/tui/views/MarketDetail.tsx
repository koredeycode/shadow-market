import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { format } from 'date-fns';
import { Market, UserProfile } from '../types.js';

interface MarketDetailProps {
  market: Market;
  me: UserProfile | null;
  onPlaceBet: (amount: string, side: 'YES' | 'NO') => void;
  onPlaceWager: (amount: string, side: 'YES' | 'NO', odds: string) => void;
  onSelectPosition: (pos: any) => void;
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
  me,
  onPlaceBet,
  onPlaceWager,
  onSelectPosition,
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
  const [executionStep, setExecutionStep] = useState(0); 
  const [oddsFocus, setOddsFocus] = useState(0); 
  const [step, setStep] = useState<'DETAILS' | 'BET' | 'WAGER' | 'POSITIONS'>('DETAILS');

  const myBets = (me?.bets || []).filter(b => b.marketId === market.id);
  const myWagers = (me?.wagers || []).filter(w => w.marketId === market.id);
  const totalMyPositions = myBets.length + myWagers.length;

  // Sanitization helper to remove DEL (\x7F) and other control characters
  const cleanInput = (val: string) => val.replace(/[\x00-\x1F\x7F]/g, '');

  useInput((input, key) => {
    if (isSubmitting) return;

    if (key.tab && step === 'WAGER' && executionStep === 2) {
      setOddsFocus(prev => (prev + 1) % 2);
      return;
    }

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
    <Box flexDirection="column" height="100%">
      <Box flexDirection="row" marginBottom={1}>
        {/* Left Side: Market Data */}
        <Box flexDirection="column" width="55%" marginRight={2}>
          <Box borderStyle="round" borderColor="magenta" paddingX={2} marginBottom={1} flexDirection="column">
            <Box justifyContent="space-between" width="100%">
               <Text color="cyan" bold>{market.category.toUpperCase()}</Text>
               <Text color={market.status === 'OPEN' ? 'green' : 'yellow'}>{market.status === 'OPEN' ? 'OPEN' : market.status}</Text>
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

        {/* Right Side: Transactions */}
        <Box flexDirection="column" width="45%" borderStyle="round" borderColor="gray" paddingX={1}>
            <Text bold color="white">TRANSACTIONS: PUBLIC LEDGER</Text>
            {history.length === 0 ? (
              <Box paddingY={1} flexGrow={1} justifyContent="center" alignItems="center">
                  <Text dimColor italic>Syncing activity from Indexer...</Text>
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
      <Box borderStyle="bold" borderColor="yellow" paddingX={2} paddingY={1} flexDirection="column" backgroundColor="black" minHeight={8}>
        {step === 'DETAILS' ? (
          <Box flexDirection="column">
             <Text color="cyan" bold underline>Terminal Action Menu</Text>
             <Box marginTop={1}>
                <SelectInput
                    items={[
                      { label: 'PLACE POOL BET (AMM)', value: 'bet' },
                      { label: 'CREATE P2P WAGER (Custom Ratio)', value: 'wager' },
                      ...(totalMyPositions > 0 ? [{ label: `MY POSITIONS FOR THIS MARKET (${totalMyPositions})`, value: 'positions' }] : []),
                      { label: 'VIEW ON WEB DASHBOARD', value: 'browser' },
                      ...(isAdmin && market.status === 'OPEN' ? [{ label: 'LOCK MARKET (Admin)', value: 'lock' }] : []),
                      ...(isAdmin && market.status === 'LOCKED' ? [{ label: 'RESOLVE MARKET (Admin)', value: 'resolve' }] : []),
                      { label: 'BACK', value: 'back' }
                    ] as any}
                    onSelect={(i: any) => {
                      if (i.value === 'bet') { setStep('BET'); setExecutionStep(0); }
                      if (i.value === 'wager') { setStep('WAGER'); setExecutionStep(0); }
                      if (i.value === 'positions') setStep('POSITIONS');
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
              <Text color="yellow" bold>POOL BET EXECUTION: ({executionStep + 1}/3) {executionStep === 2 ? 'Final Confirmation' : executionStep === 1 ? 'Enter Amount' : 'Choose Side'}</Text>
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
                        focus={!isSubmitting}
                        value={betAmount} 
                        onChange={(v) => setBetAmount(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(2)} 
                      />
                    </Box>
                  </Box>
                )}
                {executionStep === 2 && (
                  <Box flexDirection="column" marginTop={1}>
                    <Text color="white">Summary: <Text color="green" bold>{betSide}</Text> | <Text color="cyan" bold>{betAmount} NIGHT</Text></Text>
                    <Box marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1}>
                      <SelectInput 
                        isFocused={!isSubmitting}
                        items={[
                          { label: 'BROADCAST POOL BET', value: 'submit' },
                          { label: 'RE-EDIT DETAILS', value: 'reset' }
                        ]}
                        onSelect={(i) => {
                          if (i.value === 'submit') onPlaceBet(cleanInput(betAmount), betSide);
                          else setExecutionStep(0);
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box marginTop={1}>
                 {isSubmitting ? (
                   <Text color="yellow">[ STATUS: {submitStatus} ]</Text>
                 ) : (
                   <Text color="gray">Press ESC to go back.</Text>
                 )}
              </Box>
            </Box>
        ) : step === 'WAGER' ? (
          <Box flexDirection="column">
              <Text color="yellow" bold>P2P WAGER FLOW: Step {executionStep + 1} of 4</Text>
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
                        focus={!isSubmitting}
                        value={betAmount} 
                        onChange={(v) => setBetAmount(cleanInput(v))} 
                        onSubmit={() => setExecutionStep(2)} 
                      />
                    </Box>
                  </Box>
                )}
                {executionStep === 2 && (
                  <Box flexDirection="column">
                    <Text color="cyan">Set Odds Ratio (Numerator : Denominator):</Text>
                    <Box flexDirection="row" marginTop={1} alignItems="center">
                      <Box borderStyle="single" borderColor={oddsFocus === 0 ? 'cyan' : 'yellow'} paddingX={1} width={10}>
                        <TextInput 
                          focus={!isSubmitting && oddsFocus === 0}
                          value={oddsNum} 
                          onChange={(v) => setOddsNum(cleanInput(v))} 
                          onSubmit={() => setOddsFocus(1)} 
                        />
                      </Box>
                      <Text> : </Text>
                      <Box borderStyle="single" borderColor={oddsFocus === 1 ? 'cyan' : 'yellow'} paddingX={1} width={10}>
                        <TextInput 
                          focus={!isSubmitting && oddsFocus === 1}
                          value={oddsDen} 
                          onChange={(v) => setOddsDen(cleanInput(v))} 
                          onSubmit={() => setExecutionStep(3)} 
                        />
                      </Box>
                    </Box>
                    <Box marginTop={1} flexDirection="column">
                       <Text dimColor italic>Potential Payout: <Text color="green" bold>{(Number(cleanInput(betAmount) || 0) * (Number(cleanInput(oddsNum) || 1) / Number(cleanInput(oddsDen) || 1))).toFixed(2)} NIGHT</Text></Text>
                       <Text color="gray" dimColor>Press [TAB] to switch inputs.</Text>
                    </Box>
                  </Box>
                )}
                {executionStep === 3 && (
                  <Box flexDirection="column">
                    <Text color="white">Summary: <Text color="green" bold>{betSide}</Text> | <Text color="cyan" bold>{betAmount} NIGHT</Text> | Odds <Text color="yellow" bold>{oddsNum}:{oddsDen}</Text></Text>
                    <Box marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1}>
                      <SelectInput 
                        isFocused={!isSubmitting}
                        items={[
                          { label: 'BROADCAST P2P WAGER', value: 'submit' },
                          { label: 'RE-EDIT DETAILS', value: 'reset' }
                        ]}
                        onSelect={(i) => {
                          if (i.value === 'submit') onPlaceWager(cleanInput(betAmount), betSide, `${cleanInput(oddsNum)}:${cleanInput(oddsDen)}`);
                          else setExecutionStep(0);
                        }}
                      />
                    </Box>
                  </Box>
                )}
             </Box>
             
             <Box marginTop={1}>
                {isSubmitting ? (
                  <Text color="yellow">[ STATUS: {submitStatus} ]</Text>
                ) : (
                  <Text color="gray" dimColor>Press ESC to step back.</Text>
                )}
             </Box>
          </Box>
        ) : (
            <Box flexDirection="column">
                <Text color="green" bold underline>YOUR DEPLOYED POSITIONS ON THIS MARKET</Text>
                <Box marginTop={1}>
                    <SelectInput 
                        items={[
                            ...myBets.map(b => ({ label: `[POOL] BET ${b.side.toUpperCase()} | ${b.amount} NIGHT | PnL: ${b.profitLoss}`, value: b.id, data: b })),
                            ...myWagers.map(w => ({ label: `[P2P] WAGER ${w.creatorSide.toUpperCase()} | ${w.amount} NIGHT | Status: ${w.status}`, value: w.id, data: w })),
                            { label: '--- BACK ---', value: 'back' }
                        ] as any}
                        onSelect={(i: any) => {
                            if (i.value === 'back') setStep('DETAILS');
                            else onSelectPosition(i.data);
                        }}
                    />
                </Box>
            </Box>
        )}
      </Box>
    </Box>
  );
};
