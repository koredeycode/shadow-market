import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { walletManager } from '../core/wallet.js';
import { backendClient } from '../core/backend.js';

const GradientComp = Gradient as any;
const BigTextComp = BigText as any;

export const App = () => {
  const { exit } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [walletStatus, setWalletStatus] = useState<any>(null);
  
  // Betting State
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('10');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  
  // Pairing State
  const [pairingSession, setPairingSession] = useState<any>(null);
  const [isPairing, setIsPairing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, s] = await Promise.all([
          backendClient.getMarkets({ limit: 8 }),
          walletManager.isLoggedIn() ? walletManager.getStatus() : null
        ]);
        setMarkets(m as any);
        setWalletStatus(s);
      } catch (err) { } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab]);

  // Handle Pairing Initiation
  useEffect(() => {
    if (!walletManager.isLoggedIn() && !pairingSession && !loading) {
      const initPairing = async () => {
        try {
          const session = await backendClient.createPairingSession();
          setPairingSession(session);
          setIsPairing(true);
        } catch (err) {
          console.error('Failed to create pairing session');
        }
      };
      initPairing();
    }
  }, [walletStatus, loading]);

  // Poll Pairing Status
  useEffect(() => {
    let interval: any;
    if (isPairing && pairingSession?.pairingCode) {
      interval = setInterval(async () => {
        try {
          const status = await backendClient.checkPairingStatus(pairingSession.pairingCode);
          if (status?.status === 'AUTHORIZED') {
            clearInterval(interval);
            walletManager.setLinkedSession(status.token, status.walletAddress);
            setWalletStatus(await walletManager.getStatus());
            setIsPairing(false);
            setPairingSession(null);
          }
        } catch (err) { /* silent poll */ }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPairing, pairingSession]);

  useInput((input, key) => {
    if (isSubmitting) return;

    if (input === 'q' || key.escape) {
      if (selectedMarket) {
        setSelectedMarket(null);
        setActiveTab('markets');
      } else {
        exit();
      }
    }
    if (!selectedMarket) {
      if (input === 'd') setActiveTab('dashboard');
      if (input === 'm') setActiveTab('markets');
      if (input === 'w') setActiveTab('wallet');
      if (input === 'b') setActiveTab('bet');
    }
  });

  const handleMarketSelect = (item: any) => {
    setSelectedMarket(item.value);
    setActiveTab('bet-form');
  };

  const handlePlaceBet = async (amountStr?: string) => {
    const finalAmount = amountStr || betAmount;
    if (!selectedMarket || !finalAmount) return;

    setIsSubmitting(true);
    setSubmitStatus('Initializing ZK circuit...');

    try {
      const api = await walletManager.getAPI();
      api.setStatusCallback((status: string) => {
          if (status.includes('BALANCING')) setSubmitStatus('Balancing UTXOs...');
          if (status.includes('PROVING')) setSubmitStatus('Generating ZK proof...');
          if (status.includes('SUBMITTING')) setSubmitStatus('Confirming on-chain...');
      });

      const amount = BigInt(Math.floor(parseFloat(finalAmount) * 1_000_000));
      // Correct signature: (marketId, amount, side)
      const res = await api.placeBet(selectedMarket.onchainId, amount, betSide === 'YES');
      
      setSubmitStatus('Success! Syncing backend...');
      await backendClient.placeBet({
          marketId: selectedMarket.id,
          onchainId: selectedMarket.onchainId,
          side: betSide,
          amount: finalAmount,
          txHash: res.txHash
      });

      setSubmitStatus('BET PLACED SUCCESSFULLY!');
      setTimeout(() => {
          setIsSubmitting(false);
          setSelectedMarket(null);
          setActiveTab('dashboard');
          setSubmitStatus('');
      }, 3000);

    } catch (err: any) {
      setSubmitStatus(`Error: ${err.message}`);
      setTimeout(() => setIsSubmitting(false), 4000);
    }
  };

  return (
    <Box flexDirection="column" padding={1} minHeight={25}>
      {/* Header */}
      <Box marginBottom={1} flexDirection="column" alignItems="center">
        <GradientComp name="passion">
           <BigTextComp text="SHADOW" font="tiny" />
        </GradientComp>
        <Text dimColor>Midnight Network Prediction protocol</Text>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
        {loading ? (
          <Box justifyContent="center" alignItems="center" width="100%">
            <Text color="cyan"><Spinner type="dots" /> Syncing with Ledger...</Text>
          </Box>
        ) : (
          <Box flexDirection="column" width="100%">
            {activeTab === 'dashboard' && (
              <Box flexDirection="column">
                {!walletStatus ? (
                  <Box flexDirection="column" borderStyle="bold" borderColor="yellow" padding={1} alignItems="center">
                    <Text bold color="yellow">LINK REQUIRED</Text>
                    <Text>Go to Shadow Market Web Dashboard and enter this code:</Text>
                    <Box marginY={1} paddingX={2} borderStyle="double" borderColor="cyan">
                      <Text bold color="cyan">{pairingSession?.pairingCode || 'GENERATING...'}</Text>
                    </Box>
                    <Text dimColor>Waiting for wallet authorization...</Text>
                    <Box marginTop={1}>
                        <Text color="gray">This allows you to trade with your web-connected wallet.</Text>
                    </Box>
                  </Box>
                ) : (
                  <Box flexDirection="column">
                    <Text bold underline color="white">Market Overview</Text>
                    <Box marginTop={1} flexDirection="column">
                       {markets.slice(0, 5).map((m: any) => (
                         <Box key={m.id} marginBottom={1}>
                           <Text color="magenta">[{m.onchainId || m.id.split('-')[0]}] </Text>
                           <Text bold>{m.question.substring(0, 45)}{m.question.length > 45 ? '...' : ''}</Text>
                           <Box marginLeft={2}>
                             <Text color="green">{m.yesPrice || '0.5'}</Text> / <Text color="red">{m.noPrice || '0.5'}</Text>
                           </Box>
                         </Box>
                       ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 'markets' && (
                <Box flexDirection="column">
                    <Box marginBottom={1}>
                        <Text bold color="cyan">Select Market to Bet:</Text>
                    </Box>
                    <SelectInput 
                        items={markets.map(m => ({ label: m.question.substring(0, 50), value: m }))} 
                        onSelect={handleMarketSelect}
                    />
                </Box>
            )}

            {activeTab === 'bet-form' && selectedMarket && (
                <Box flexDirection="column">
                    <Text color="magenta" bold underline>{selectedMarket.question}</Text>
                    <Box marginTop={1} flexDirection="column">
                        <Box marginBottom={1}>
                            <Text>Side: </Text>
                            <SelectInput 
                                items={[{label: 'YES', value: 'YES'}, {label: 'NO', value: 'NO'}]} 
                                onSelect={(i) => setBetSide(i.value as any)}
                            />
                        </Box>
                        <Box marginBottom={1}>
                            <Text>Amount (tNight): </Text>
                            <TextInput value={betAmount} onChange={setBetAmount} onSubmit={handlePlaceBet} />
                        </Box>

                        {isSubmitting && (
                            <Box marginTop={1} borderStyle="single" borderColor="cyan" padding={1}>
                                <Text color="yellow"><Spinner type="bouncingBar" /> {submitStatus}</Text>
                            </Box>
                        )}

                        {!isSubmitting && (
                            <Box marginTop={1}>
                                <Text color="gray" dimColor>Press ENTER to submit bet, ESC to go back.</Text>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {activeTab === 'wallet' && (
              <Box flexDirection="column">
                <Text bold underline color="white">Wallet Details</Text>
                {walletStatus ? (
                  <Box flexDirection="column" marginTop={1}>
                    <Text>Address: <Text color="cyan">{walletStatus.address}</Text></Text>
                    <Text>Balance: <Text color="green">{walletStatus.balance.toString()} tNight</Text></Text>
                    <Text>DUST:    <Text color="yellow">{walletStatus.dust.toString()} tDUST</Text></Text>
                  </Box>
                ) : (
                  <Box marginTop={1}>
                    <Text color="red">Not logged in. Use "shadow-market wallet login".</Text>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Fallback for bet shortcut */}
            {activeTab === 'bet' && setActiveTab('markets')}
          </Box>
        )}
      </Box>

      {/* Footer / Nav */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
         <Box flexGrow={1}>
           <Text color="gray">  Controls: </Text>
           <Text color="white"> [d] Dash [m] Markets [w] Wallet [q] Quit </Text>
         </Box>
         <Text dimColor> shadow-market v0.1.0-alpha </Text>
      </Box>
    </Box>
  );
};
