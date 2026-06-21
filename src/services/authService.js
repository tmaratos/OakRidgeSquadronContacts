import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../firebase';

export function capidToEmail(capid) {
  return `${String(capid).trim()}@tn170.local`;
}

export async function loginWithCapid(capid, password) {
  const email = capidToEmail(capid);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export async function changePassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await updatePassword(user, newPassword);
}

export function getCurrentUser() {
  return auth.currentUser;
}
