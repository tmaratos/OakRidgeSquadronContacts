import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public Firebase web config for tn170-contact-directory (not a secret).
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCCSFfhoJmYU2YMZMbcfGtRg9ZlxThlV78',
  authDomain: 'tn170-contact-directory.firebaseapp.com',
  projectId: 'tn170-contact-directory',
  storageBucket: 'tn170-contact-directory.firebasestorage.app',
  messagingSenderId: '882389764338',
  appId: '1:882389764338:web:5a29ae8f88820257f5e86b',
};

function resolveFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_FIREBASE_CONFIG.appId,
  };
}

const firebaseConfig = resolveFirebaseConfig();

let app = null;
let auth = null;
let db = null;
let initError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  initError = error instanceof Error ? error.message : 'Firebase failed to initialize';
  console.error('Firebase initialization failed:', error);
}

export { auth, db, initError as firebaseInitError };
export default app;
