import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function getContactUserProfile(uid) {
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
