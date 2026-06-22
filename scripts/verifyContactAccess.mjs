/**
 * Verify client Firestore rules allow contact reads for a seeded user.
 * Usage: node --use-system-ca scripts/verifyContactAccess.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const uid = '7ocVRfOfMPfQi9Fat0ASkhlepb02';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id,
});

const clientConfig = {
  apiKey: 'AIzaSyCCSFfhoJmYU2YMZMbcfGtRg9ZlxThlV78',
  authDomain: 'tn170-contact-directory.firebaseapp.com',
  projectId: sa.project_id,
};

const customToken = await admin.auth().createCustomToken(uid);
const clientApp = initializeApp(clientConfig, 'verify-client');
const auth = getAuth(clientApp);
await signInWithCustomToken(auth, customToken);
const db = getFirestore(clientApp);

async function runQuery(label, q) {
  try {
    const snap = await getDocs(q);
    console.log(`${label}: OK (${snap.size} docs)`);
    return snap.size;
  } catch (err) {
    console.error(`${label}: FAILED`, err.code, err.message);
    throw err;
  }
}

const sharedQ = query(
  collection(db, 'contacts'),
  where('visibility', '==', 'shared'),
  orderBy('name')
);
const privateQ = query(
  collection(db, 'contacts'),
  where('ownerUid', '==', uid),
  where('visibility', '==', 'private'),
  orderBy('name')
);

const sharedCount = await runQuery('getSharedContacts', sharedQ);
const privateCount = await runQuery('getMyContacts (private)', privateQ);

console.log(`\nUser ${uid} can read ${sharedCount} shared + ${privateCount} private contacts.`);

const createRef = await addDoc(collection(db, 'contacts'), {
  name: 'Rules Verify Contact',
  organization: '',
  organizationNormalized: '',
  emails: [],
  phones: [],
  tags: [],
  searchText: 'rules verify contact',
  visibility: 'private',
  ownerUid: uid,
  ownerCapid: '729204',
  ownerDisplayName: 'Tristan G Maratos',
  contactType: 'Individual',
  category: 'Other',
  status: 'Active',
  preferredContactMethod: 'none',
  isPinned: false,
  createdAt: serverTimestamp(),
  createdBy: uid,
  updatedAt: serverTimestamp(),
  updatedBy: uid,
});
console.log(`createContact: OK (${createRef.id})`);
await deleteDoc(doc(db, 'contacts', createRef.id));
console.log('createContact cleanup: OK');

process.exit(0);
