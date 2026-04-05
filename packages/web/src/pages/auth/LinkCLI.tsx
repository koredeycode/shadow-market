import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMidnight } from '../../contexts/MidnightContext';
import { api } from '../../lib/api';

const LinkCLI = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected, connectWallet, unshieldedAddress } = useMidnight();
  const [status, setStatus] = useState<'IDLE' | 'AUTHORIZING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [sessionData, setSessionData] = useState<any>(null);
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      toast.error('Invalid or missing linking code');
      navigate('/');
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await api.get(`/sessions/${code}/status`);
        setSessionData(response.data.data);
      } catch (err: any) {
        toast.error('Terminal session not found or expired');
        setStatus('ERROR');
      }
    };

    fetchSession();
  }, [code, navigate]);

  const isAddressMismatch = isConnected && sessionData && sessionData.walletAddress !== unshieldedAddress;

  const handleAuthorize = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      connectWallet();
      return;
    }

    if (isAddressMismatch) {
      toast.error('Incorrect wallet connected. Please switch to the specified address.');
      return;
    }

    setStatus('AUTHORIZING');
    const loadingToast = toast.loading('Authorizing terminal session...');

    try {
      const response = await api.post('/sessions/authorize', { 
        pairingCode: code,
        walletAddress: unshieldedAddress,
        signature: 'WEB_PROOF_SUCCESS' // Placeholder, in production this would be a real proof/sig
      });
      
      if (response.data.success) {
        setStatus('SUCCESS');
        toast.success('CLI Linked successfully!', { id: loadingToast });
      } else {
        throw new Error(response.data.error || 'Failed to authorize');
      }
    } catch (err: any) {
      console.error('Authorization error:', err);
      setStatus('ERROR');
      const msg = err.response?.data?.error || err.message;
      toast.error(msg, { id: loadingToast });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="w-full max-w-md bg-obsidian-light border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric-blue/10 blur-[100px] rounded-full group-hover:bg-electric-blue/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-magenta/10 blur-[100px] rounded-full group-hover:bg-magenta/20 transition-all duration-700" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-obsidian border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-inner text-electric-blue">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">Authorize Terminal</h1>
          <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed antialiased">
            Securely link your browser session with the Shadow Market CLI. This will allow the terminal to act on behalf of your wallet.
          </p>

          <div className="w-full bg-black/40 border border-white/10 rounded-xl p-6 mb-8 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-3">Verification Code</span>
            <div className="text-4xl font-mono font-bold tracking-[0.1em] text-white">
              {code || '------'}
            </div>
            {sessionData && (
              <div className="mt-4 pt-4 border-t border-white/5 w-full text-center">
                 <span className="text-[8px] uppercase tracking-widest text-slate-500">Linked to Address:</span>
                 <p className="text-[10px] font-mono text-electric-blue truncate mt-1">{sessionData.walletAddress}</p>
              </div>
            )}
          </div>

          {status === 'SUCCESS' ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
               <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               <p className="text-emerald-400 font-medium mb-4">CLI Linked Successfully</p>
               <button 
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white transition-colors text-xs underline underline-offset-4"
               >
                 Return to Terminal
               </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {isAddressMismatch && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-500 text-center font-medium leading-relaxed mb-4">
                  Wallet address mismatch! Your current wallet does not match the address for which this code was generated.
                </div>
              )}
              
              <button
                onClick={handleAuthorize}
                disabled={status === 'AUTHORIZING' || isAddressMismatch || !sessionData}
                className="w-full h-12 bg-gradient-to-r from-electric-blue to-magenta hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-lg transition-all duration-300 shadow-lg shadow-electric-blue/10 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {status === 'AUTHORIZING' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Link CLI Now</span>
                  </>
                )}
              </button>
              
              {!isConnected && (
                <p className="text-[10px] text-center text-magenta/80 animate-pulse uppercase tracking-wider font-bold">
                   Wallet Connection Required
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-500 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.9L9.03 9.032a1.25 1.25 0 001.939-1.073V3.79c0-.441-.336-.889-.78-1.012L2.166 1.137c-.443-.124-.88.225-.88.683v2.392c0 .323.19.62.483.748l.402.138zM19 11l-3-3m0 0l-3 3m3-3v8m-9-9l3 3m0 0l3-3m-3 3v8" clipRule="evenodd" />
        </svg>
        Your session will only be active on the device that generated this code.
      </p>
    </div>
  );
};

export default LinkCLI;
