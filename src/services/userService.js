import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { auth, db } from '../firebase';

function normalizeRecoveryEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isCallableFallbackError(err) {
  const code = err?.code || '';
  return (
    code === 'functions/not-found'
    || code === 'functions/internal'
    || code === 'functions/unavailable'
    || code === 'functions/deadline-exceeded'
  );
}

export async function getContactUserProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'contactUsers', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function clearMustChangePassword(uid) {
  await updateDoc(doc(db, 'contactUsers', uid), {
    mustChangePassword: false,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'contactUsers', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

async function updateRecoveryEmailDirect(uid, recoveryEmail) {
  if (!db) {
    throw new Error('Firebase is not initialized.');
  }

  const profile = await getContactUserProfile(uid);
  if (!profile || profile.isActive !== true) {
    throw new Error('Account is not active.');
  }
  if (!profile.capid) {
    throw new Error('Your profile is missing a CAPID. Contact squadron leadership.');
  }

  const now = serverTimestamp();
  await updateDoc(doc(db, 'contactUsers', uid), {
    recoveryEmail,
    recoveryEmailVerified: false,
    recoveryEmailUpdatedAt: now,
    updatedAt: now,
  });

  await updateDoc(doc(db, 'contactUserLookup', profile.capid), {
    recoveryEmail,
    updatedAt: now,
  });

  return { recoveryEmail, source: 'client' };
}

export async function updateRecoveryEmail(recoveryEmail) {
  if (!app) {
    throw new Error('Firebase is not initialized.');
  }

  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to update your recovery email.');
  }

  const trimmed = normalizeRecoveryEmail(recoveryEmail);
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('A valid recovery email is required.');
  }

  try {
    const functions = getFunctions(app, 'us-central1');
    const callable = httpsCallable(functions, 'updateRecoveryEmail');
    const result = await callable({ recoveryEmail: trimmed });
    return { ...result.data, source: 'function' };
  } catch (err) {
    if (!isCallableFallbackError(err)) {
      throw err;
    }
    console.warn('updateRecoveryEmail callable unavailable; using Firestore fallback.', err?.code);
  }

  return updateRecoveryEmailDirect(uid, trimmed);
}
