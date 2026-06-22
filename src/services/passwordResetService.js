import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

const functions = app ? getFunctions(app, 'us-central1') : null;

const GENERIC_RESET_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

export function mapPasswordResetError(err) {
  const code = err?.code || '';

  if (code === 'functions/not-found') {
    return 'Password reset is not available yet. Cloud Functions must be deployed on the Firebase Blaze plan. Contact squadron leadership for help resetting your password.';
  }
  if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
    return 'The password reset service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (code === 'functions/invalid-argument') {
    return err.message || 'CAPID and recovery email are required.';
  }
  if (code === 'functions/internal' || code === 'internal') {
    return 'The password reset service encountered a server error. Cloud Functions may need to be deployed or SMTP configured. Contact squadron leadership if this persists.';
  }
  if (code === 'functions/failed-precondition') {
    return err.message || 'Password reset email is not configured on the server. Contact squadron leadership for help resetting your password.';
  }
  if (err?.message?.includes('Firebase is not initialized')) {
    return err.message;
  }
  return err?.message || 'Unable to process your request. Please try again later.';
}

export async function requestPasswordReset(capid, recoveryEmail) {
  if (!functions) {
    throw new Error('Firebase is not initialized.');
  }
  const callable = httpsCallable(functions, 'requestPasswordReset');
  try {
    const result = await callable({ capid: String(capid).trim(), recoveryEmail });
    return result.data?.message || GENERIC_RESET_MESSAGE;
  } catch (err) {
    console.error('requestPasswordReset failed:', err);
    throw new Error(mapPasswordResetError(err));
  }
}
