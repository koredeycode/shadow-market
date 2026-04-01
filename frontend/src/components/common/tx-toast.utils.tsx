import toast from 'react-hot-toast';
import { TxToast } from './TxToast';

/**
 * Helper to show the rich transaction success toast.
 * This is separated into a .tsx file to allow JSX usage while keeping 
 * the main contract service as a pure .ts file.
 */
export function showTxSuccessToast(txHash: string, successMsg: string, txToastId: string) {
  // Use toast.custom for full control over the rich UI window
  // Infinity duration ensures it stays until user clicks Terminate
  toast.custom(
    (t) => <TxToast t={t} txHash={txHash} successMsg={successMsg} />,
    { id: txToastId, duration: Infinity }
  );
}

/**
 * Helper for showing an error toast with specific formatting.
 */
export function showTxErrorToast(message: string, txToastId: string) {
  toast.error(message, { id: txToastId });
}
