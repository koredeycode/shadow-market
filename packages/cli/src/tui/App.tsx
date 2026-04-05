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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  // Betting State
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  const [betAmount, setBetAmount] = useState('10');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Create Market State
  const [newMarket, setNewMarket] = useState({
    question: '',
    category: 'Crypto',
    tags: '',
    endTimeYear: new Date().getFullYear().toString(),
    endTimeMonth: new Date().getMonth().toString(),
    endTimeDay: new Date().getDate().toString()
  });
  const [createStep, setCreateStep] = useState(0); // 0: Question, 1: Details

  // Pairing State
  const [pairingSession, setPairingSession] = useState<any>(null);
  const [isPairing, setIsPairing] = useState(false);

  // Local Login State
  const [loginStage, setLoginStage] = useState<'CHOICE' | 'MNEMONIC' | 'KEY' | 'LOGGING_IN'>('CHOICE');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [linkToOpen, setLinkToOpen] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        if (walletManager.isLoggedIn()) {
           const session = walletManager.getSession();
           if (session?.token) backendClient.setToken(session.token);
        }

        const [m, s, user] = await Promise.all([
          backendClient.getMarkets({ limit: 8 }),
          walletManager.isLoggedIn() ? walletManager.getStatus() : null,
          walletManager.isLinked() ? backendClient.getMe() : null
        ]);
        setMarkets(m as any);
        setWalletStatus(s);
        setMe(user);
      } catch (err) { } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTab]);

  // Handle Pairing Initiation (only if logged in locally but not linked to backend)
  useEffect(() => {
    if (walletManager.isLoggedIn() && !walletManager.isLinked() && !pairingSession && !loading) {
      const initPairing = async () => {
        try {
          const address = walletManager.getAddress();
          const { code, expiresAt } = await backendClient.getLinkCode(address);
          setPairingSession({ pairingCode: code, expiresAt } as any);
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
          const statusResult = await backendClient.pollLinkStatus(pairingSession.pairingCode);
          if (statusResult?.status === 'AUTHORIZED') {
            clearInterval(interval);
            backendClient.setToken(statusResult.token);
            walletManager.setLinkedSession(statusResult.token, statusResult.walletAddress);
            setWalletStatus(await walletManager.getStatus());
            setMe(await backendClient.getMe());
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

    // ESC/Q handling (always active for escape)
    if (input === 'q' || key.escape) {
      if (selectedMarket) {
        setSelectedMarket(null);
        setActiveTab('markets');
      } else if (activeTab === 'create' || activeTab === 'portfolio') {
        setActiveTab('dashboard');
      } else if (loginStage !== 'CHOICE') {
        setLoginStage('CHOICE');
        setLoginInput('');
      } else {
        exit();
      }
      return;
    }

    // Determine if we are in a text input state
    const isEditing = loginStage !== 'CHOICE' || activeTab === 'create' || activeTab === 'bet-form';

    if (!selectedMarket && !isEditing) {
      if (input === 'd') setActiveTab('dashboard');
      if (input === 'm' || input === 'b') setActiveTab('markets');
      if (input === 'w') setActiveTab('wallet');
      if (input === 'c') setActiveTab('create');
      if (input === 'p') setActiveTab('portfolio');
      if (input === 'L') {
          walletManager.logout();
          setActiveTab('dashboard');
          setLoginStage('CHOICE');
          setWalletStatus(null);
          setMe(null);
      }

      // Automatic browser opening for links
      if (input === 'o') {
        const urlToOpen = linkToOpen || (pairingSession?.pairingCode && !walletManager.isLinked() ? `${process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173'}/auth/link?code=${pairingSession.pairingCode}` : '');

        if (urlToOpen) {
          import('open').then((openMod) => {
            const openFn = openMod.default || openMod;
            openFn(urlToOpen);
          }).catch(() => { /* silent fail */ });
        }
      }
    }
  });

  const handleMarketSelect = (item: any) => {
    const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
    setLinkToOpen(`${webUrl}/markets/${item.value.slug || item.value.onchainId || item.value.id}`);
    setSelectedMarket(item.value);
    setActiveTab('bet-form');
  };

  const handleCreateMarket = async () => {
    if (!newMarket.question) return;

    setIsSubmitting(true);
    setSubmitStatus('Generating on-chain market reference...');

    try {
      const api = await walletManager.getAPI();
      api.setStatusCallback(setSubmitStatus);

      // 1. Create on-chain
      const targetDate = new Date(
        parseInt((newMarket as any).endTimeYear),
        parseInt((newMarket as any).endTimeMonth),
        parseInt((newMarket as any).endTimeDay),
        12, 0, 0
      );
      const res = await api.createMarket(newMarket.question, BigInt(targetDate.getTime()));

      setSubmitStatus('Syncing with Shadow Indexer...');

      // 2. Sync with backend
      const payload = {
          question: newMarket.question,
          category: newMarket.category,
          tags: (newMarket as any).tags ? (newMarket as any).tags.split(',').map((t: string) => t.trim()) : [],
          endTime: targetDate.toISOString(),
          resolutionSource: 'Oracle',
          onchainId: res?.onchainId,
          txHash: res?.txHash
      };

      await backendClient.createMarket(payload);

      setSubmitStatus('Market Created Successfully!');
      const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
      setLinkToOpen(`${webUrl}/markets/${res?.onchainId || payload.question}`);

      setTimeout(() => {
          setIsSubmitting(false);
          setActiveTab('markets');
          // Reset
          setNewMarket({
            question: '',
            category: 'Crypto',
            tags: '',
            endTimeYear: new Date().getFullYear().toString(),
            endTimeMonth: new Date().getMonth().toString(),
            endTimeDay: new Date().getDate().toString()
          });
          setCreateStep(0);
      }, 1500);
    } catch (err: any) {
        const errorMsg = err.response?.data?.error || err.message;
        setSubmitStatus(`Error: ${errorMsg}`);
        setTimeout(() => setIsSubmitting(false), 4000);
    }
  };

  const handlePlaceBet = async (amountStr?: string) => {
    const finalAmount = amountStr || betAmount;
    if (!selectedMarket || !finalAmount) return;

    setIsSubmitting(true);
    setSubmitStatus('Initializing ZK circuit...');

    try {
      const api = await walletManager.getAPI();
      api.setStatusCallback((status: string) => {
          let msg = 'Working...';
          if (status.includes('BALANCING')) msg = 'Balancing UTXOs...';
          if (status.includes('PROVING')) msg = 'Generating ZK proof...';
          if (status.includes('SUBMITTING')) msg = 'Confirming on-chain...';

          if (msg !== submitStatus) setSubmitStatus(msg);
      });

      const amount = BigInt(Math.floor(parseFloat(finalAmount) * 1_000_000));
      // Correct signature: (marketId, amount, side)
      const res = await api.placeBet(selectedMarket.onchainId, amount, betSide === 'YES');

      setSubmitStatus('Success! Syncing backend...');
      await backendClient.placeBet(selectedMarket.id, {
          onchainId: selectedMarket.onchainId,
          side: betSide.toLowerCase(),
          amount: finalAmount,
          txHash: res.txHash
      });

      setSubmitStatus('BET PLACED SUCCESSFULLY!');
      const webUrl = process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173';
      setLinkToOpen(`${webUrl}/markets/${selectedMarket?.onchainId || selectedMarket?.id}`);

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

  const handleLoginSubmit = async (data: string) => {
    setLoginStage('LOGGING_IN');
    setTimeout(async () => {
      const method = loginStage === 'MNEMONIC' ? 'mnemonic' : 'key';
      const success = await walletManager.login(method, data);

      if (success) {
        setWalletStatus(await walletManager.getStatus());
        setLoginStage('CHOICE');
        setLoginInput('');
      } else {
        setLoginError('Invalid credentials. Please try again.');
        setLoginStage(method === 'mnemonic' ? 'MNEMONIC' : 'KEY');
      }
    }, 0);
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
                {!walletManager.isLoggedIn() ? (
                  <Box flexDirection="column" borderStyle="bold" borderColor="red" padding={1}>
                    <Box justifyContent="center">
                       <Text bold color="red">LOGIN REQUIRED</Text>
                    </Box>

                    {loginStage === 'CHOICE' && (
                       <Box flexDirection="column" marginTop={1}>
                          <Text>Select your login method:</Text>
                          <SelectInput
                             items={[
                               { label: 'Enter Seed Phrase', value: 'MNEMONIC' },
                               { label: 'Enter Private Key', value: 'KEY' }
                             ]}
                             onSelect={(i) => { setLoginStage(i.value as any); setLoginError(''); }}
                          />
                          <Box marginTop={1}>
                             <Text dimColor>Alternatively, run </Text>
                             <Text color="cyan" bold>shadow-market wallet login</Text>
                          </Box>
                       </Box>
                    )}

                    {(loginStage === 'MNEMONIC' || loginStage === 'KEY') && (
                       <Box flexDirection="column" marginTop={1}>
                          <Text bold color="cyan">{loginStage === 'MNEMONIC' ? 'Enter Seed Phrase (12+ words):' : 'Enter 128-char Master Hex Seed (64 bytes):'}</Text>
                          <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                             <TextInput
                               value={loginInput}
                               onChange={setLoginInput}
                               mask="*"
                               onSubmit={(val) => {
                                 if (loginStage === 'KEY' && val.length !== 128) {
                                   setLoginError(`Invalid length: Must be 128 characters. Got ${val.length}.`);
                                 } else if (loginStage === 'MNEMONIC' && val.split(' ').length < 12) {
                                   setLoginError('Invalid. Mnemonic must be at least 12 words.');
                                 } else {
                                   handleLoginSubmit(val);
                                 }
                               }}
                             />
                          </Box>
                          {loginError && <Text color="red">{loginError}</Text>}
                          <Text dimColor>Press ENTER to submit, ESC to cancel.</Text>
                       </Box>
                    )}

                    {loginStage === 'LOGGING_IN' && (
                       <Box marginTop={1}>
                          <Text color="yellow"><Spinner type="dots" /> Logging in & Syncing wallet...</Text>
                       </Box>
                    )}
                  </Box>
                ) : !walletManager.isLinked() ? (
                  <Box flexDirection="column" borderStyle="bold" borderColor="yellow" padding={1} alignItems="center">
                    <Text bold color="yellow">LINK REQUIRED</Text>
                    <Text>Go to Shadow Market Web Dashboard and enter this code:</Text>
                    <Box marginY={1} paddingX={2} borderStyle="double" borderColor="cyan">
                      <Text bold color="cyan">{pairingSession?.pairingCode || 'GENERATING...'}</Text>
                    </Box>
                    <Box marginBottom={1} flexDirection="column" alignItems="center">
                        <Text>Or visit this URL directly:</Text>
                        <Text color="cyan" underline>{(process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173') + '/auth/link?code=' + (pairingSession?.pairingCode || '')}</Text>
                    </Box>
                    <Text dimColor>Authorized Address: <Text color="magenta">{walletManager.getAddress()}</Text></Text>
                    <Box marginTop={1} flexDirection="column" alignItems="center">
                        <Text color="cyan" bold>Press [O] to open browser automatically</Text>
                        <Text color="gray">This authorizes your CLI to use your web profile.</Text>
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
                             <Text color="green">{m.yesPrice || '0.5'}</Text><Text color="gray"> / </Text><Text color="red">{m.noPrice || '0.5'}</Text>
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

            {activeTab === 'create' && (
               <Box flexDirection="column">
                  <Text bold underline color="white">Create New Market</Text>
                  <Box marginTop={1} flexDirection="column">
                     {createStep === 0 && (
                        <Box flexDirection="column">
                           <Text>Step 1/3: Enter Market Question</Text>
                           <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                              <TextInput
                                 value={newMarket.question}
                                 onChange={(v) => setNewMarket(p => ({ ...p, question: v }))}
                                 onSubmit={() => {
                                    if (newMarket.question.length > 10) setCreateStep(1);
                                 }}
                                 placeholder="e.g. Will Midnight Network launch mainnet in 2024?"
                              />
                           </Box>
                           <Text dimColor>Question must be at least 10 characters.</Text>
                        </Box>
                     )}
                     {createStep === 1 && (
                        <Box flexDirection="column">
                           <Text>Step 2/3: Categorization</Text>
                           <Box marginTop={1} flexDirection="column">
                              <Text>Category: <Text color="magenta">{newMarket.category}</Text></Text>
                              <SelectInput
                                 items={[
                                    { label: 'CRYPTO', value: 'Crypto' },
                                    { label: 'POLITICS', value: 'Politics' },
                                    { label: 'SPORTS', value: 'Sports' },
                                    { label: 'FINANCE', value: 'Finance' },
                                    { label: 'TECH', value: 'Tech' },
                                    { label: 'GEOPOLITICS', value: 'Geopolitics' },
                                    { label: 'CULTURE', value: 'Culture' },
                                    { label: 'ECONOMY', value: 'Economy' },
                                    { label: 'WEATHER', value: 'Weather' },
                                    { label: 'ELECTIONS', value: 'Elections' },
                                    { label: 'OTHERS', value: 'Others' }
                                 ]}
                                 onSelect={(item) => setNewMarket(p => ({ ...p, category: item.value }))}
                              />
                           </Box>
                           <Box marginTop={1} flexDirection="column">
                              <Text>Tags (comma separated):</Text>
                              <Box borderStyle="single" borderColor="gray" paddingX={1}>
                                 <TextInput
                                    value={(newMarket as any).tags || ''}
                                    onChange={(v) => setNewMarket(p => ({ ...p, tags: v }))}
                                    onSubmit={() => setCreateStep(2)}
                                    placeholder="midnight, bridge, ecosystem"
                                 />
                              </Box>
                           </Box>
                           <Box marginTop={1}>
                              <Text dimColor>Press ENTER to continue, ESC to go back.</Text>
                           </Box>
                        </Box>
                     )}
                      {createStep === 2 && (
                         <Box flexDirection="column">
                            <Text>Step 3/5: Resolution Year (YYYY)</Text>
                            <Box borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
                               <TextInput
                                  value={(newMarket as any).endTimeYear}
                                  onChange={(v) => setNewMarket(p => ({ ...p, endTimeYear: v }))}
                                  onSubmit={() => setCreateStep(3)}
                               />
                            </Box>
                            <Text dimColor>Enter the year this market will resolve (e.g. 2026)</Text>
                         </Box>
                      )}
                      {createStep === 3 && (
                         <Box flexDirection="column">
                            <Text>Step 4/5: Resolution Month</Text>
                            <Box marginTop={1}>
                               <SelectInput
                                  items={[
                                    { label: 'January', value: '0' }, { label: 'February', value: '1' },
                                    { label: 'March', value: '2' },   { label: 'April', value: '3' },
                                    { label: 'May', value: '4' },     { label: 'June', value: '5' },
                                    { label: 'July', value: '6' },    { label: 'August', value: '7' },
                                    { label: 'September', value: '8' }, { label: 'October', value: '9' },
                                    { label: 'November', value: '10' }, { label: 'December', value: '11' }
                                  ]}
                                  onSelect={(i) => {
                                      setNewMarket(p => ({ ...p, endTimeMonth: i.value }));
                                      setCreateStep(4);
                                  }}
                               />
                            </Box>
                         </Box>
                      )}
                      {createStep === 4 && (
                         <Box flexDirection="column">
                            <Text>Step 5/5: Finalize Day & Time</Text>
                            <Box marginTop={1}><Text>Resolution Day (1-31):</Text></Box>
                            <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
                               <TextInput
                                  value={(newMarket as any).endTimeDay}
                                  onChange={(v) => setNewMarket(p => ({ ...p, endTimeDay: v }))}
                                  onSubmit={handleCreateMarket}
                               />
                            </Box>
                            <Box marginTop={1} flexDirection="column">
                                <Text color="gray">Selection: <Text color="white" bold>{(newMarket as any).endTimeYear}-{Number((newMarket as any).endTimeMonth)+1}-{(newMarket as any).endTimeDay}</Text> @ 12:00 PM</Text>
                                 <Box marginTop={1}><Text color="cyan" bold>Press ENTER to broadcast market creation, ESC to go back.</Text></Box>
                            </Box>
                         </Box>
                      )}
                  </Box>
                    {isSubmitting && (
                    <Box
                      marginTop={1}
                      borderStyle="single"
                      borderColor="cyan"
                      paddingX={1}
                      height={3}
                    >
                        <Text color="yellow"><Spinner type="dots" /> {submitStatus}</Text>
                    </Box>
                  )}
               </Box>
            )}

            {activeTab === 'portfolio' && (
               <Box flexDirection="column" width="100%">
                  <Text bold underline color="white">My Portfolio</Text>
                  {!walletManager.isLinked() ? (
                     <Box marginTop={1}>
                        <Text color="red">Link your browser session to see aggregated portfolio data.</Text>
                     </Box>
                  ) : !me ? (
                      <Box marginTop={1}>
                        <Text color="yellow"><Spinner type="dots" /> Loading profile info...</Text>
                      </Box>
                  ) : (
                     <Box flexDirection="column" marginTop={1}>
                        <Box justifyContent="space-between" marginBottom={1} borderStyle="single" borderColor="blue" paddingX={1}>
                           <Text bold color="cyan">{me.username || 'Anonymous Trader'}</Text>
                           <Text color="gray">ID: {me.id.split('-')[0]}</Text>
                        </Box>

                        <Box flexDirection="column" marginBottom={1}>
                           <Text color="white" bold>Recent Transactions:</Text>
                           {me.bets?.length === 0 ? (
                              <Text italic dimColor>No bets placed yet.</Text>
                           ) : (
                              me.bets?.slice(0, 8).map((b: any) => (
                                 <Box key={b.id} justifyContent="space-between">
                                    <Text dimColor>{b.market?.question.substring(0, 40)}...</Text>
                                    <Box>
                                       <Text color={b.side === 'YES' ? 'green' : 'red'} bold>{b.side}</Text>
                                       <Text>  {(BigInt(b.amount) / 1000000n).toString()} tN</Text>
                                    </Box>
                                 </Box>
                              ))
                           )}
                        </Box>
                     </Box>
                  )}
               </Box>
            )}

            {activeTab === 'bet-form' && selectedMarket && (
                <Box flexDirection="column">
                    <Text color="magenta" bold underline>{selectedMarket.question}</Text>
                    <Box marginTop={1} flexDirection="column">
                        <Box marginBottom={1} flexDirection="column">
                           <Text color="cyan" underline>{(process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173') + '/markets/' + (selectedMarket.slug || selectedMarket.onchainId || selectedMarket.id)}</Text>
                           <Text dimColor>Press [O] to View on Web</Text>
                        </Box>

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
                            <Box
                              marginTop={1}
                              borderStyle="single"
                              borderColor="cyan"
                              paddingX={1}
                              height={3}
                            >
                                <Text color="yellow"><Spinner type="dots" /> {submitStatus}</Text>
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
                    {walletStatus.username && <Text>Account: <Text color="magenta" bold>{walletStatus.username}</Text></Text>}
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

            {/* Fallback check moved to input handler */}
          </Box>
        )}
      </Box>

      {/* Footer / Nav */}
      <Box marginTop={1} borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Box>
           <Text color="cyan"> [d] Dash [m] Markets [c] Create [p] Portfolio [w] Wallet [L] Logout [q] Quit </Text>
        </Box>
        <Box>
           <Text color="gray"> Net: <Text color={walletStatus?.isSynced ? 'green' : 'yellow'}>{walletStatus?.network || process.env.MIDNIGHT_NETWORK_ID || 'local-net'}</Text></Text>
           <Text dimColor> | v0.1.5 </Text>
        </Box>
      </Box>
    </Box>
  );
};
