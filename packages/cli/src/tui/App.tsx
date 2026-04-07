import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { walletManager } from '../core/wallet.js';
import { backendClient } from '../core/backend.js';

// Types
import { ViewType, Market, WalletStatus, UserProfile } from './types.js';

// Views
import { Dashboard } from './views/Dashboard.js';
import { MarketList } from './views/MarketList.js';
import { MarketDetail } from './views/MarketDetail.js';
import { CreateMarket } from './views/CreateMarket.js';
import { LoginView } from './views/LoginView.js';
import { LinkView } from './views/LinkView.js';

// Components
import { ConfirmationModal } from './components/ConfirmationModal.js';

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
    const [showWagerConfirm, setShowWagerConfirm] = useState<{ amount: string, side: 'YES' | 'NO' } | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

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
                walletManager.isLinked() ? backendClient.getMe() : null,
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
            setSubmitStatus('Market Created Successfully!');

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
            setTimeout(() => {
                setIsSubmitting(false);
                setSelectedMarket(null);
                navigateTo('dashboard');
            }, 3000);
        } catch (err: any) {
            setSubmitStatus(`Error: ${err.message}`);
            setTimeout(() => setIsSubmitting(false), 4000);
        }
    };

    const executeWager = async (amountStr: string, side: 'YES' | 'NO') => {
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
            // In a real P2P wager, this would involve creating a wager offer on-chain
            // For now, we use the same placeBet pattern but tagged as P2P in backend
            const res = await api.placeBet(selectedMarket.onchainId, amount, side === 'YES');

            setSubmitStatus('Success! Syncing wager with backend...');
            await backendClient.placeBet(selectedMarket.id, {
                onchainId: res.onchainId,
                side: side.toLowerCase(),
                amount: amountStr,
                txHash: res.txHash,
                type: 'P2P'
            } as any);

            setSubmitStatus('P2P WAGER CREATED SUCCESSFULLY!');
            setTimeout(() => {
                setIsSubmitting(false);
                setSelectedMarket(null);
                navigateTo('dashboard');
            }, 3000);
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

        // Automatic browser opening for link session
        if (input === 'o' && activeView === 'link' && pairingSession) {
            const url = `${process.env.SHADOW_MARKET_WEB_URL || 'http://localhost:5173'}/auth/link?code=${pairingSession.pairingCode}`;
            import('open').then(m => (m.default || m)(url)).catch(() => {});
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
                        <Text color="cyan">… Syncing with Ledger Hub …</Text>
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
                                onPlaceBet={(amount, side) => setShowBetConfirm({ amount, side })}
                                onPlaceWager={(amount, side) => setShowWagerConfirm({ amount, side })}
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
                                onSubmit={handleCreateMarket}
                            />
                        )}

                        {activeView === 'login' && (
                            <LoginView onLogin={handleLogin} onQuit={() => setShowQuitConfirm(true)} />
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
                                    <Text color="yellow">… Initializing secure pairing session …</Text>
                                </Box>
                            )
                        )}

                        {activeView === 'portfolio' && (
                            <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
                                <Text bold color="cyan">PORTFOLIO VIEW</Text>
                                <Box marginTop={1}>
                                    <Text dimColor italic>Syncing your ZK-Shielded history from indexer...</Text>
                                </Box>
                                <Box marginTop={1}>
                                    <Text>Total Bets: {me?.bets?.length || 0}</Text>
                                </Box>
                                <Box marginTop={2}>
                                    <Text color="gray">Press ESC to go back.</Text>
                                </Box>
                            </Box>
                        )}

                        {activeView === 'wallet' && (
                            <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
                                <Text bold color="blue">WALLET HUB</Text>
                                <Box marginTop={1} flexDirection="column">
                                    <Text color="gray">Address: <Text color="magenta">{walletManager.getAddress()}</Text></Text>
                                    <Box marginTop={1} flexDirection="column">
                                        <Text color="gray">Balance (NIGHT): {walletStatus?.balance.toString() || '0'}</Text>
                                        <Text color="gray">Balance (DUST): {walletStatus?.dust.toString() || '0'}</Text>
                                    </Box>
                                </Box>
                                <Box marginTop={2}>
                                    <Text color="gray">Press ESC to go back.</Text>
                                </Box>
                            </Box>
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
                      message={`Place a ${showBetConfirm.side} bet of ${showBetConfirm.amount} NIGHT on:\n"${selectedMarket?.question}"`}
                      onConfirm={() => executeBet(showBetConfirm.amount, showBetConfirm.side)}
                      onCancel={() => setShowBetConfirm(null)}
                      confirmColor="green"
                      confirmLabel="Confirm Bet (y)"
                   />
                )}

                {showWagerConfirm && (
                   <ConfirmationModal 
                      title="CONFIRM P2P WAGER"
                      message={`Create a P2P WAGER of ${showWagerConfirm.amount} NIGHT on ${showWagerConfirm.side} for:\n"${selectedMarket?.question}"\n\nThis will be matched with opposing custom wagers.`}
                      onConfirm={() => executeWager(showWagerConfirm.amount, showWagerConfirm.side)}
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
