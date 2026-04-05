import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { sessionService } from '../../services/session.service.js';
import { useWallet } from '../../hooks/useWallet';

const pairingSchema = z.object({
  code: z.string().regex(/^SHADOW-[A-Z0-9]{4}$/, 'Invalid format (e.g. SHADOW-ABCD)'),
});

type PairingForm = z.infer<typeof pairingSchema>;

export const TerminalPairingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);

  const { unshieldedAddress, isConnected } = useWallet();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PairingForm>({
    resolver: zodResolver(pairingSchema),
    defaultValues: { code: '' },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PairingForm) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    const loadToast = toast.loading('Authorizing terminal session...');
    try {
      // First verify status to check address match
      const statusRes = await sessionService.getSessionStatus(data.code);
      if (statusRes.walletAddress !== unshieldedAddress) {
        throw new Error('Address mismatch: This session belongs to a different wallet.');
      }

      await sessionService.authorizeTerminal(data.code, unshieldedAddress!);
      toast.success('Terminal paired successfully!', { id: loadToast });
      reset();
      onClose();
    } catch (err: any) {
      toast.error(`Authorization failed: ${err.message}`, { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] grid place-items-center w-screen h-screen bg-black/80 backdrop-blur-sm p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900 border border-white/10 rounded-sm w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-2">Link Terminal Head</h2>
        <p className="text-slate-400 text-sm mb-6">
          Enter the code displayed on your Terminal (TUI) to authorize the session with your wallet.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('code')}
              placeholder="SHADOW-XXXX"
              className={`w-full bg-slate-950 border ${errors.code ? 'border-red-500' : 'border-slate-800'} 
              rounded-xl py-3 px-4 text-white font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1 text-center font-medium">{errors.code.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
            >
              {loading ? 'Signing...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
