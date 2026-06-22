/**
 * Dry-run password reset email routing for a CAPID (no email sent).
 * Usage: NODE_OPTIONS=--use-system-ca node scripts/testPasswordResetEmail.js [capid]
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { normalizeEmail } from '../functions/lib/email.js';

const capid = process.argv[2] || '729204';
const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: sa.project_id || 'tn170-contact-directory',
});

const db = admin.firestore();
const auth = admin.auth();

const lookupSnap = await db.collection('contactUserLookup').doc(capid).get();
if (!lookupSnap.exists) {
  console.error(`No contactUserLookup doc for CAPID ${capid}`);
  process.exit(1);
}

const lookup = lookupSnap.data();
const recoveryEmailOnFile = normalizeEmail(lookup.recoveryEmail);
const internalAuthEmail = lookup.internalAuthEmail;

console.log('CAPID:', capid);
console.log('recoveryEmail on file:', recoveryEmailOnFile);
console.log('internalAuthEmail (Firebase Auth only):', internalAuthEmail);
console.log('isActive:', lookup.isActive);
console.log('');
console.log('Email would be sent TO:', recoveryEmailOnFile);
console.log('Reset link generated FOR auth email:', internalAuthEmail);

const resetLink = await auth.generatePasswordResetLink(internalAuthEmail, {
  url: 'https://tn170-contact-directory.firebaseapp.com',
});
console.log('');
console.log('Reset link generated successfully (not emailed in this test).');
console.log('Link prefix:', resetLink.slice(0, 80) + '...');

process.exit(0);
