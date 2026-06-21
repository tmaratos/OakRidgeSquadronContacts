import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

const functions = app ? getFunctions(app, 'us-central1') : null;

const GENERIC_RESET_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

export async function requestPasswordReset(capid, recoveryEmail) {
  if (!functions) {
    throw new Error('Firebase is not initialized.');
  }
  const callable = httpsCallable(functions, 'requestPasswordReset');
  const result = await callable({ capid: String(capid).trim(), recoveryEmail });
  return result.data?.message || GENERIC_RESET_MESSAGE;
}

export async function updateRecoveryEmail(recoveryEmail) {
  if (!functions) {
    throw new Error('Firebase is not initialized.');
  }
  const callable = httpsCallable(functions, 'updateRecoveryEmail');
  const result = await callable({ recoveryEmail });
  return result.data;
}
