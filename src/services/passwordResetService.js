import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

const functions = app ? getFunctions(app, 'us-central1') : null;

const GENERIC_RESET_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

const PASSWORD_RESET_URL = import.meta.env.VITE_PASSWORD_RESET_URL || '';

export function mapPasswordResetError(err) {
  const code = err?.code || '';

  if (code === 'functions/not-found') {
    return 'Password reset is not available yet. Cloud Functions must be deployed on the Firebase Blaze plan, or configure VITE_PASSWORD_RESET_URL for the Vercel API. Contact squadron leadership for help resetting your password.';
  }
  if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
    return 'The password reset service is temporarily unavailable. Please try again in a few minutes.';
  }
  if (code === 'functions/invalid-argument') {
    return err.message || 'CAPID and recovery email are required.';
  }
  if (code === 'functions/internal' || code === 'internal') {
    return 'The password reset service is temporarily unavailable. Please try again in a few minutes or contact squadron leadership.';
  }
  if (err?.message?.includes('Firebase is not initialized')) {
    return err.message;
  }
  return err?.message || 'Unable to process your request. Please try again later.';
}

async function requestPasswordResetViaHttp(capid, recoveryEmail) {
  const response = await fetch(PASSWORD_RESET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capid: String(capid).trim(), recoveryEmail }),
  });

  if (!response.ok && response.status !== 400) {
    throw new Error('The password reset service is temporarily unavailable. Please try again in a few minutes.');
  }

  const data = await response.json().catch(() => ({}));
  return data?.message || GENERIC_RESET_MESSAGE;
}

async function requestPasswordResetViaCallable(capid, recoveryEmail) {
  if (!functions) {
    throw new Error('Firebase is not initialized.');
  }
  const callable = httpsCallable(functions, 'requestPasswordReset');
  const result = await callable({ capid: String(capid).trim(), recoveryEmail });
  return result.data?.message || GENERIC_RESET_MESSAGE;
}

export async function requestPasswordReset(capid, recoveryEmail) {
  try {
    if (PASSWORD_RESET_URL) {
      return await requestPasswordResetViaHttp(capid, recoveryEmail);
    }
    return await requestPasswordResetViaCallable(capid, recoveryEmail);
  } catch (err) {
    console.error('requestPasswordReset failed:', err);
    throw new Error(mapPasswordResetError(err));
  }
}
