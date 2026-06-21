import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { db } from '../firebase';

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

export async function updateRecoveryEmail(recoveryEmail) {
  if (!app) {
    throw new Error('Firebase is not initialized.');
  }
  const trimmed = String(recoveryEmail || '').trim();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('A valid recovery email is required.');
  }
  const functions = getFunctions(app, 'us-central1');
  const callable = httpsCallable(functions, 'updateRecoveryEmail');
  const result = await callable({ recoveryEmail: trimmed });
  return result.data;
}
