/**
 * Sync contactUserLookup.recoveryEmail from contactUsers profiles.
 * Run: node scripts/syncRecoveryLookup.js
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadServiceAccount() {
  for (const name of ['serviceAccountKey.json', 'tn170-contact-directory-service-account.json']) {
    const path = join(root, name);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf8'));
    }
  }
  throw new Error('Service account key not found in project root.');
}

admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
const db = admin.firestore();

const profiles = await db.collection('contactUsers').get();
let updated = 0;
let skipped = 0;

for (const doc of profiles.docs) {
  const profile = doc.data();
  const capid = profile.capid;
  const recoveryEmail = String(profile.recoveryEmail || '').trim().toLowerCase();

  if (!capid) {
    skipped++;
    continue;
  }

  if (!recoveryEmail || recoveryEmail.endsWith('@tn170.local')) {
    console.warn(`SKIP ${capid}: no valid recovery email on profile`);
    skipped++;
    continue;
  }

  const lookupRef = db.collection('contactUserLookup').doc(capid);
  const lookupSnap = await lookupRef.get();
  const lookupRecovery = lookupSnap.exists
    ? String(lookupSnap.data().recoveryEmail || '').trim().toLowerCase()
    : '';

  if (lookupRecovery === recoveryEmail) {
    skipped++;
    continue;
  }

  await lookupRef.set(
    {
      uid: doc.id,
      capid,
      displayName: profile.displayName || '',
      internalAuthEmail: profile.internalAuthEmail || `${capid}@tn170.local`,
      recoveryEmail,
      isActive: profile.isActive !== false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`UPDATED ${capid}: ${lookupRecovery || '(empty)'} → ${recoveryEmail}`);
  updated++;
}

console.log(`\nSync complete. Updated: ${updated}, skipped: ${skipped}`);
