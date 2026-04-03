import toast from 'react-hot-toast';
import { TxToast } from './TxToast';

/**
 * Helper to show the rich transaction success toast.
 * This is separated into a .tsx file to allow JSX usage while keeping 
 * the main contract service as a pure .ts file.
 */
export function showTxSuccessToast(successMsg: string, txToastId?: string, duration: number = 6000) {
  toast.custom(
    () => <TxToast successMsg={successMsg} />,
    { id: txToastId, duration }
  );
}

/**
 * Helper for showing an error toast with specific formatting.
 */
export function showTxErrorToast(message: string, txToastId: string) {
  toast.error(message, { id: txToastId });
}
