import toast from 'react-hot-toast';
import { TxToast } from './TxToast';

/**
 * Helper to show the rich transaction success toast.
 * This is separated into a .tsx file to allow JSX usage while keeping 
 * the main contract service as a pure .ts file.
 */
export function showTxSuccessToast(txHash: string, successMsg: string, txToastId?: string, duration: number = 6000) {
  // Use toast.custom for full control over the rich UI window
  // Default 6s duration as requested, can be overridden to Infinity if needed
  toast.custom(
    (t) => <TxToast t={t} txHash={txHash} successMsg={successMsg} />,
    { id: txToastId, duration }
  );
}

/**
 * Helper for showing an error toast with specific formatting.
 */
export function showTxErrorToast(message: string, txToastId: string) {
  toast.error(message, { id: txToastId });
}
