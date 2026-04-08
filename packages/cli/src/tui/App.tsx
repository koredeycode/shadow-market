import { Box, Text, useApp, useInput } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { backendClient } from '../core/backend.js';
import { walletManager } from '../core/wallet.js';

// Types
import { Market, UserProfile, ViewType, WalletStatus } from './types.js';

// Views
import { CreateMarket } from './views/CreateMarket.js';
import { Dashboard } from './views/Dashboard.js';
import { LinkView } from './views/LinkView.js';
import { LoginView } from './views/LoginView.js';
import { MarketDetail } from './views/MarketDetail.js';
import { MarketList } from './views/MarketList.js';
import { Portfolio } from './views/Portfolio.js';
import { Wallet } from './views/Wallet.js';
import { BetDetail } from './views/BetDetail.js';

// Components
import { ConfirmationModal } from './components/ConfirmationModal.js';
import { SuccessModal } from './components/SuccessModal.js';

const GradientComp = Gradient as any;
const BigTextComp = BigText as any;

export const App = () => {
    const { exit } = useApp();
    const [viewStack, setViewStack] = useState<ViewType[]>(['dashboard']);
    const [loading, setLoading] = useState(true);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
    const [me, setMe] = useState<UserProfile | null>(null);
    const [adminAddress, setAdminAddress] = useState<string | null>(null);
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [marketHistory, setMarketHistory] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');
    const [pairingSession, setPairingSession] = useState<any>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [showResolveConfirm, setShowResolveConfirm] = useState<any>(null);
    const [showBetConfirm, setShowBetConfirm] = useState<{ amount: string, side: 'YES' | 'NO' } | null>(null);
    const [showWagerConfirm, setShowWagerConfirm] = useState<{ amount: string, side: 'YES' | 'NO', odds: string } | null>(null);
    const [showCreateConfirm, setShowCreateConfirm] = useState<any | null>(null);
    const [showSuccess, setShowSuccess] = useState<{ title: string, message: string, txHash?: string } | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [viewingBet, setViewingBet] = useState<any>(null);

    const activeView = viewStack[viewStack.length - 1];

    const pushView = useCallback((view: ViewType) => {
        setViewStack(prev => [...prev, view]);
    }, []);

    const popView = useCallback(() => {
        setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }, []);

    const navigateTo = useCallback((view: ViewType) => {
        setViewStack([view]);
    }, []);

    const loadData = useCallback(async () => {
        try {
            if (walletManager.isLoggedIn()) {
                const session = walletManager.getSession();
                if (session?.token) backendClient.setToken(session.token);
            }

            const [m, s, user, adminConfig] = await Promise.all([
                backendClient.getMarkets({ limit: 12 }),
                walletManager.isLoggedIn() ? walletManager.getStatus() : null,
                walletManager.isLinked() ? backendClient.getPortfolio() : null,
                walletManager.isLoggedIn() ? backendClient.getAdminConfig().catch(() => null) : null
            ]);
            setMarkets(m as any);
            setWalletStatus(s as any);
            setMe(user as any);
            if (adminConfig) setAdminAddress(adminConfig.adminAddress);
            setGlobalError(null);
        } catch (err: any) {
            console.error('Data sync failed:', err);
            setGlobalError(err.message || 'Ledger Hub Sync Failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData, activeView]);

    // Handle Pairing Initiation
    useEffect(() => {
        if (walletManager.isLoggedIn() && !walletManager.isLinked() && !pairingSession && !loading) {
            const initPairing = async () => {
                try {
                    const address = walletManager.getAddress();
                    const { code, expiresAt } = await backendClient.getLinkCode(address);
                    setPairingSession({ pairingCode: code, expiresAt });
                } catch (err) {
                    console.error('Failed to create pairing session');
                }
            };
            initPairing();
        }
    }, [walletStatus, loading, pairingSession]);

    // Poll Pairing Status
    useEffect(() => {
        let interval: any;
        if (pairingSession?.pairingCode && !walletManager.isLinked()) {
            interval = setInterval(async () => {
                try {
                    const statusResult = await backendClient.pollLinkStatus(pairingSession.pairingCode);
                    if (statusResult?.status === 'AUTHORIZED') {
                        clearInterval(interval);
                        backendClient.setToken(statusResult.token);
                        walletManager.setLinkedSession(statusResult.token, statusResult.walletAddress);
                        await loadData();
                        setPairingSession(null);
                        navigateTo('dashboard');
                    }
                } catch (err) { /* silent poll */ }
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [pairingSession, loadData]);

    useEffect(() => {
        if (selectedMarket) {
            backendClient.getMarketHistory(selectedMarket.id)
                .then(setMarketHistory)
                .catch(() => setMarketHistory([]));
        } else {
            setMarketHistory([]);
        }
    }, [selectedMarket]);

    const handleLogin = async (method: 'mnemonic' | 'key', data: string) => {
        const success = await walletManager.login(method, data);
        if (success) {
            await loadData();
            navigateTo('dashboard');
        } else {
            throw new Error('Invalid credentials');
        }
    };

    const handleCreateMarket = async (formData: any) => {
        setIsSubmitting(true);
        setSubmitStatus('Generating on-chain reference...');
        setShowCreateConfirm(null);
        try {
            const api = await walletManager.getAPI();
            api.setStatusCallback(setSubmitStatus);

            const res = await api.createMarket(formData.question, BigInt(formData.targetDate.getTime()));
            setSubmitStatus('Syncing with Shadow Indexer...');

            const payload = {
                question: formData.question,
                category: formData.category,
                description: formData.description,
                tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
                endTime: formData.targetDate.toISOString(),
                resolutionSource: 'Oracle',
                onchainId: res?.onchainId,
                txHash: res?.txHash
            };

            await backendClient.createMarket(payload);
            setSubmitStatus('MARKET CREATED SUCCESSFULLY!');

            setTimeout(() => {
                setIsSubmitting(false);
                navigateTo('markets');
            }, 1500);
        } catch (err: any) {
            setSubmitStatus(`Error: ${err.message}`);
            setTimeout(() => setIsSubmitting(false), 4000);
        }
    };

    const executeBet = async (amountStr: string, side: 'YES' | 'NO') => {
        if (!selectedMarket) return;
        setIsSubmitting(true);
        setShowBetConfirm(null);
        setSubmitStatus('Initializing ZK circuit...');

        try {
            const api = await walletManager.getAPI();
            api.setStatusCallback((status: string) => {
                if (status.includes('BALANCING')) setSubmitStatus('Balancing UTXOs...');
                if (status.includes('PROVING')) setSubmitStatus('Generating ZK proof...');
                if (status.includes('SUBMITTING')) setSubmitStatus('Confirming on-chain...');
            });

            const amount = BigInt(Math.floor(parseFloat(amountStr) * 1_000_000));
            const res = await api.placeBet(selectedMarket.onchainId, amount, side === 'YES');

            setSubmitStatus('Success! Syncing backend...');
            await backendClient.placeBet(selectedMarket.id, {
                onchainId: res.onchainId,
                side: side.toLowerCase(),
                amount: amountStr,
                txHash: res.txHash
            });

            setSubmitStatus('BET PLACED SUCCESSFULLY!');
            setShowSuccess({
                title: 'Position Secured',
                message: `Successfully deposited ${amountStr} NIGHT into the ZK-escrow pool for the ${side} outcome on market:\n"${selectedMarket.question}"`,
                txHash: res.txHash
            });
            setIsSubmitting(false);
        } catch (err: any) {
            setSubmitStatus(`Error: ${err.message}`);
            setTimeout(() => setIsSubmitting(false), 4000);
        }
    };

    const executeWager = async (amountStr: string, side: 'YES' | 'NO', oddsStr: string) => {
        if (!selectedMarket) return;
        setIsSubmitting(true);
        setShowWagerConfirm(null);
        setSubmitStatus('Initializing P2P execution environment...');

        try {
            const api = await walletManager.getAPI();
            api.setStatusCallback((status: string) => {
                if (status.includes('BALANCING')) setSubmitStatus('Balancing UTXOs...');
                if (status.includes('PROVING')) setSubmitStatus('Generating P2P ZK proof...');
                if (status.includes('SUBMITTING')) setSubmitStatus('Confirming on-chain...');
            });

            const amount = BigInt(Math.floor(parseFloat(amountStr) * 1_000_000));
            
            // Parse Ratio Odds (e.g. 1:3 or 3:1)
            let oddsNumerator = 1n;
            let oddsDenominator = 1n;
            if (oddsStr.includes(':')) {
                const [n, d] = oddsStr.split(':').map(val => BigInt(val.trim() || '1'));
                oddsNumerator = n;
                oddsDenominator = d;
            } else {
                // decimal fallback (e.g. 2.5 -> 250/100)
                oddsNumerator = BigInt(Math.floor(parseFloat(oddsStr) * 100) || 100);
                oddsDenominator = 100n;
            }

            const res = await api.createWager(
                selectedMarket.onchainId, 
                side === 'YES', 
                amount,
                oddsNumerator,
                oddsDenominator
            );

            setSubmitStatus('Success! Syncing WAGER with backend...');
            await backendClient.createP2PWager(selectedMarket.id, {
                onchainId: res.onchainId,
                side: side.toLowerCase(),
                amount: amountStr,
                txHash: res.txHash,
                odds: [Number(oddsNumerator), Number(oddsDenominator)],
                duration: 60 * 60 * 24 * 7 // 7 days default
            });

            setSubmitStatus('P2P WAGER CREATED SUCCESSFULLY!');
            setShowSuccess({
                title: 'Wager Offering Active',
                message: `Your P2P wager for ${amountStr} NIGHT on ${side} with ${oddsStr} odds has been broadcast to the Midnight ledger.`,
                txHash: res.txHash
            });
            setIsSubmitting(false);
        } catch (err: any) {
            setSubmitStatus(`Error: ${err.message}`);
            setTimeout(() => setIsSubmitting(false), 4000);
        }
    };

    const handleOpenMarketInBrowser = useCallback((m: Market) => {
        const url = `${process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173'}/markets/${m.slug || m.id}`;
        import('open').then(op => (op.default || op)(url)).catch(() => {});
    }, []);

    const handleViewOnChain = useCallback((m: Market) => {
        // Redirect to Midnight Testnet Explorer for the contract
        const contractAddress = process.env.MIDNIGHT_CONTRACT_ADDRESS || '0x...'; 
        const url = `https://explorer.midnight.network/address/${contractAddress}`; 
        import('open').then(op => (op.default || op)(url)).catch(() => {});
    }, []);

    const handleAdminAction = async (action: 'lock' | 'resolve') => {
        if (!selectedMarket) return;
        if (action === 'lock') {
            setIsSubmitting(true);
            setSubmitStatus('Locking market on-chain...');
            try {
                const api = await walletManager.getAPI();
                await api.lockMarket(selectedMarket.onchainId);
                setSubmitStatus('Success! Syncing backend...');
                await backendClient.getMarkets(); // force refresh? Actually better to just navigate back
                setSubmitStatus('MARKET LOCKED SUCCESSFULLY!');
                setTimeout(() => { setIsSubmitting(false); popView(); }, 2000);
            } catch (err: any) {
                setSubmitStatus(`Error: ${err.message}`);
                setTimeout(() => setIsSubmitting(false), 4000);
            }
        } else if (action === 'resolve') {
            setShowResolveConfirm(true);
        }
    };

    const handleResolveMarket = async (outcome: boolean) => {
        if (!selectedMarket) return;
        setShowResolveConfirm(false);
        setIsSubmitting(true);
        setSubmitStatus(`Resolving market to ${outcome ? 'YES' : 'NO'}...`);
        try {
            const api = await walletManager.getAPI();
            await api.resolveMarket(selectedMarket.onchainId, outcome);
            setSubmitStatus('Success! Syncing backend...');
            setSubmitStatus('MARKET RESOLVED SUCCESSFULLY!');
            setTimeout(() => { setIsSubmitting(false); popView(); }, 2000);
        } catch (err: any) {
            setSubmitStatus(`Error: ${err.message}`);
            setTimeout(() => setIsSubmitting(false), 4000);
        }
    };

    const isEditing = activeView === 'create' || activeView === 'login';

    useInput((input, key) => {
        if (isSubmitting || showQuitConfirm || showBetConfirm || showResolveConfirm) return;

        // Global Navigation (only if not currently typing in an input field)
        // Note: TextInput and SelectInput will handle their own keys if they have focus.
        // But we want to allow jumping back to dashboard or quitting anytime from major views.
        if (!isEditing) {
            if (activeView !== 'link') {
                if (input === 'd') navigateTo('dashboard');
                if (input === 'm') navigateTo('markets');
                if (input === 'c') navigateTo('create');
                if (input === 'p') navigateTo('portfolio');
                if (input === 'w') navigateTo('wallet');
                if (input === 'q') setShowQuitConfirm(true);
                if (input === 'L') {
                    walletManager.logout();
                    navigateTo('dashboard');
                    setWalletStatus(null);
                    setMe(null);
                }
            }
        }

        // Global Escape to go back
        if (key.escape) {
            popView();
        }
    });

    useEffect(() => {
        if (!walletManager.isLoggedIn() && activeView !== 'login') {
            navigateTo('login');
        } else if (walletManager.isLoggedIn() && !walletManager.isLinked() && activeView !== 'link') {
            navigateTo('link');
        }
    }, [activeView, loading]);

    return (
        <Box flexDirection="column" padding={1} minHeight={25}>
            {/* Header */}
            <Box marginBottom={1} flexDirection="column" alignItems="center">
                <GradientComp name="passion">
                    <BigTextComp text="SHADOW" font="tiny" />
                </GradientComp>
                <Text dimColor>Midnight Network Prediction Terminal</Text>
            </Box>

            {/* Main Content Area */}
            <Box flexGrow={1} borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1} position="relative" minHeight={20}>
                {submitStatus && !isSubmitting && submitStatus.includes('ERROR') && (
                    <Box position="absolute" width="100%" justifyContent="flex-end">
                        <Box paddingX={1} backgroundColor="red">
                            <Text bold color="white">{submitStatus}</Text>
                        </Box>
                    </Box>
                )}
                {globalError && (
                    <Box paddingX={1} marginBottom={1} borderStyle="single" borderColor="red">
                        <Text color="red" bold>SYNC ERROR: {globalError}</Text>
                        <Text dimColor> Check your network or Shadow Indexer status.</Text>
                    </Box>
                )}
                {loading ? (
                    <Box justifyContent="center" alignItems="center" width="100%">
                        <Text color="cyan">SYNCING WITH LEDGER HUB</Text>
                    </Box>
                ) : (
                    <Box flexDirection="column" width="100%" minHeight={15}>
                        {activeView === 'dashboard' && (
                            <Dashboard 
                                walletStatus={walletStatus} 
                                markets={markets} 
                                me={me} 
                                onSelectTab={(tab) => navigateTo(tab as any)}
                                onMarketSelect={(m) => { setSelectedMarket(m); pushView('market-detail'); }}
                            />
                        )}

                        {activeView === 'markets' && (
                            <MarketList 
                                markets={markets} 
                                onBack={popView}
                                onSelect={(m) => { setSelectedMarket(m); pushView('market-detail'); }}
                            />
                        )}

                        {activeView === 'market-detail' && selectedMarket && (
                            <MarketDetail 
                                market={selectedMarket} 
                                history={marketHistory}
                                onBack={popView} 
                                isSubmitting={isSubmitting}
                                submitStatus={submitStatus}
                                onPlaceBet={(amount: string, side: 'YES' | 'NO') => setShowBetConfirm({ amount, side })}
                                onPlaceWager={(amount: string, side: 'YES' | 'NO', odds: string) => setShowWagerConfirm({ amount, side, odds })}
                                onOpenBrowser={handleOpenMarketInBrowser}
                                isAdmin={adminAddress ? walletManager.getAddress() === adminAddress : false}
                                onAdminAction={handleAdminAction}
                            />
                        )}

                        {activeView === 'create' && (
                            <CreateMarket 
                                onCancel={popView} 
                                isSubmitting={isSubmitting}
                                submitStatus={submitStatus}
                                onSubmit={(data) => setShowCreateConfirm(data)}
                            />
                        )}

                        {activeView === 'login' && (
                            <LoginView onLogin={handleLogin} onQuit={() => setShowQuitConfirm(true)} />
                        )}

                        {activeView === 'portfolio' && (
                             <Portfolio 
                                me={me} 
                                onBack={popView} 
                                onSelectBet={(b) => { setViewingBet(b); pushView('bet-detail'); }} 
                             />
                        )}

                        {activeView === 'bet-detail' && viewingBet && (
                            <BetDetail bet={viewingBet} onBack={popView} />
                        )}

                        {activeView === 'wallet' && (
                             <Wallet walletStatus={walletStatus} onBack={popView} />
                        )}

                        {activeView === 'link' && (
                            pairingSession ? (
                                <LinkView 
                                    pairingCode={pairingSession.pairingCode} 
                                    walletAddress={walletManager.getAddress()}
                                    onQuit={() => setShowQuitConfirm(true)}
                                    onOpenBrowser={() => {
                                       const url = `${process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173'}/auth/link?code=${pairingSession.pairingCode}`;
                                       import('open').then(m => (m.default || m)(url)).catch(() => {});
                                    }}
                                />
                            ) : (
                                <Box justifyContent="center" alignItems="center" height={10}>
                                    <Text color="yellow">INITIALIZING SECURE PAIRING SESSION</Text>
                                </Box>
                            )
                        )}


                        {/* Catch-all for unknown views to prevent blank screens */}
                        {!['dashboard', 'markets', 'market-detail', 'create', 'login', 'link', 'portfolio', 'wallet'].includes(activeView) && (
                           <Box justifyContent="center" alignItems="center" height={10}>
                              <Text color="red">ERROR: Invalid Terminal Context - Redirecting...</Text>
                           </Box>
                        )}
                    </Box>
                )}

                {/* Modals Layer */}
                 {showCreateConfirm && (
                    <ConfirmationModal 
                       title="CONFIRM MARKET CREATION"
                       message={`You are about to broadcast this market to the Midnight Network:\n\n"${showCreateConfirm.question}"\n\nResolution: ${showCreateConfirm.targetDate ? format(showCreateConfirm.targetDate, 'PPP') : 'Unknown'}\nCategory: ${showCreateConfirm.category}`}
                       onConfirm={() => handleCreateMarket(showCreateConfirm)}
                       onCancel={() => setShowCreateConfirm(null)}
                       confirmColor="cyan"
                       confirmLabel="Create Market (y)"
                    />
                 )}

                {showQuitConfirm && (
                   <ConfirmationModal 
                      title="TERMINAL EXIT"
                      message="Are you sure you want to quit the Shadow Market Terminal?"
                      onConfirm={() => exit()}
                      onCancel={() => setShowQuitConfirm(false)}
                      confirmLabel="Quit (y)"
                   />
                )}

                {showBetConfirm && (
                   <ConfirmationModal 
                      title="CONFIRM TRANSACTION"
                      message={`Place a ${showBetConfirm.side} BET of ${showBetConfirm.amount} NIGHT on:\n"${selectedMarket?.question}"`}
                      onConfirm={() => executeBet(showBetConfirm.amount, showBetConfirm.side)}
                      onCancel={() => setShowBetConfirm(null)}
                      confirmColor="green"
                      confirmLabel="Confirm Bet (y)"
                   />
                )}

                {showWagerConfirm && (
                   <ConfirmationModal 
                      title="CONFIRM P2P WAGER"
                      message={`Create a P2P WAGER of ${showWagerConfirm.amount} NIGHT on ${showWagerConfirm.side} for:\n"${selectedMarket?.question}"\n\nTarget Odds: ${showWagerConfirm.odds}\nThis will be matched with opposing custom wagers.`}
                      onConfirm={() => executeWager(showWagerConfirm.amount, showWagerConfirm.side, showWagerConfirm.odds)}
                      onCancel={() => setShowWagerConfirm(null)}
                      confirmColor="yellow"
                      confirmLabel="Confirm Wager (y)"
                   />
                )}

                {showResolveConfirm && (
                    <ConfirmationModal 
                        title="RESOLVE MARKET"
                        message={`Admin, please confirm the FINAL OUTCOME of this market:\n\n"${selectedMarket?.question}"`}
                        confirmLabel="Resolve as YES (y)"
                        cancelLabel="Resolve as NO (n)"
                        confirmColor="green"
                        onConfirm={() => handleResolveMarket(true)}
                        onCancel={() => handleResolveMarket(false)}
                    />
                )}

                {showSuccess && (
                    <SuccessModal 
                        title={showSuccess.title}
                        message={showSuccess.message}
                        txHash={showSuccess.txHash}
                        onClose={() => {
                            setShowSuccess(null);
                            setSelectedMarket(null);
                            navigateTo('dashboard');
                        }}
                    />
                )}
            </Box>

            {/* Global Footer */}
            <Box marginTop={1} borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
                <Box>
                    <Text color="cyan"> [d] Dash [m] Markets [c] Create [p] Portfolio [w] Wallet [L] Logout [q] Quit </Text>
                </Box>
                <Box>
                    <Text color="gray"> Net: <Text color={walletStatus?.isSynced ? 'green' : 'yellow'}>{walletStatus?.network || 'undeployed'}</Text></Text>
                    <Text dimColor> | v0.2.0 </Text>
                </Box>
            </Box>
        </Box>
    );
};
