import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';
import { seedUsers } from '../src/data/seedUsers.js';

function capidToEmail(capid) {
  return `${String(capid).trim()}@tn170.local`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const resetPasswords = process.argv.includes('--reset-passwords');

const keyPaths = [
  join(rootDir, 'serviceAccountKey.json'),
  join(rootDir, 'tn170-contact-directory-service-account.json'),
];

const localRecoveryPath = join(__dirname, 'seedUsers.local.json');

function findServiceAccount() {
  for (const p of keyPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  return null;
}

function loadRecoveryEmails() {
  if (!existsSync(localRecoveryPath)) {
    console.warn(
      'Warning: scripts/seedUsers.local.json not found. Seeding recoveryEmail as "" for all users.'
    );
    console.warn('Copy scripts/seedUsers.local.example.json and add recovery emails locally.\n');
    return {};
  }
  const raw = JSON.parse(readFileSync(localRecoveryPath, 'utf8'));
  const map = {};
  for (const [capid, email] of Object.entries(raw)) {
    map[String(capid).trim()] = String(email).trim().toLowerCase();
  }
  return map;
}

const serviceAccount = findServiceAccount();

if (!serviceAccount) {
  console.error(
    'Service account key not found. Place serviceAccountKey.json in the project root.'
  );
  console.error('Download from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'tn170-contact-directory',
});

const auth = admin.auth();
const db = admin.firestore();
const { FieldValue } = admin.firestore;

async function seedUser(user, recoveryEmails) {
  const internalAuthEmail = user.internalAuthEmail || capidToEmail(user.capid);
  const recoveryEmail = recoveryEmails[user.capid] || '';
  let authUser;

  try {
    authUser = await auth.getUserByEmail(internalAuthEmail);
    console.log(`Auth user exists: ${user.capid} (${authUser.uid})`);
    const authUpdates = { displayName: user.displayName, emailVerified: true };
    if (resetPasswords) {
      authUpdates.password = user.capid;
    }
    await auth.updateUser(authUser.uid, authUpdates);
    if (resetPasswords) {
      console.log(`Reset auth password for: ${user.capid}`);
    }
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    authUser = await auth.createUser({
      email: internalAuthEmail,
      password: user.capid,
      displayName: user.displayName,
      emailVerified: true,
    });
    console.log(`Created auth user: ${user.capid} (${authUser.uid})`);
  }

  const profileRef = db.collection('contactUsers').doc(authUser.uid);
  const existing = await profileRef.get();
  const now = FieldValue.serverTimestamp();

  const profileData = {
    capid: user.capid,
    firstName: user.firstName,
    middleInitial: user.middleInitial,
    lastName: user.lastName,
    suffix: user.suffix || '',
    displayName: user.displayName,
    internalAuthEmail,
    recoveryEmail,
    recoveryEmailVerified: false,
    recoveryEmailUpdatedAt: recoveryEmail ? now : null,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    updatedAt: now,
    emailLogin: FieldValue.delete(),
  };

  if (!existing.exists) {
    profileData.createdAt = now;
    await profileRef.set(profileData);
    console.log(`Created contactUsers profile: ${user.capid}`);
  } else {
    await profileRef.set(profileData, { merge: true });
    console.log(`Updated contactUsers profile: ${user.capid}`);
  }

  const lookupRef = db.collection('contactUserLookup').doc(user.capid);
  await lookupRef.set(
    {
      uid: authUser.uid,
      capid: user.capid,
      displayName: user.displayName,
      internalAuthEmail,
      recoveryEmail,
      isActive: user.isActive,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log(`Updated contactUserLookup: ${user.capid}`);

  return authUser.uid;
}

async function main() {
  const recoveryEmails = loadRecoveryEmails();
  console.log(`Seeding ${seedUsers.length} contact directory users...`);
  console.log('Project: tn170-contact-directory');
  console.log(`Reset passwords: ${resetPasswords ? 'yes' : 'no'}\n`);

  for (const user of seedUsers) {
    await seedUser(user, recoveryEmails);
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
