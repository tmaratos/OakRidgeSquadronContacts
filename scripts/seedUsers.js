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

const keyPaths = [
  join(rootDir, 'serviceAccountKey.json'),
  join(rootDir, 'tn170-contact-directory-service-account.json'),
];

function findServiceAccount() {
  for (const p of keyPaths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  return null;
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

async function seedUser(user) {
  const internalAuthEmail = user.internalAuthEmail || capidToEmail(user.capid);
  let authUser;

  try {
    authUser = await auth.getUserByEmail(internalAuthEmail);
    console.log(`Auth user exists: ${user.capid} (${authUser.uid})`);
    await auth.updateUser(authUser.uid, {
      password: user.capid,
      displayName: user.displayName,
      emailVerified: true,
    });
    console.log(`Repaired auth password for: ${user.capid}`);
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

  const profileData = {
    capid: user.capid,
    firstName: user.firstName,
    middleInitial: user.middleInitial,
    lastName: user.lastName,
    suffix: user.suffix || '',
    displayName: user.displayName,
    internalAuthEmail,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    updatedAt: FieldValue.serverTimestamp(),
    emailLogin: FieldValue.delete(),
  };

  if (!existing.exists) {
    profileData.createdAt = FieldValue.serverTimestamp();
    await profileRef.set(profileData);
    console.log(`Created contactUsers profile: ${user.capid}`);
  } else {
    await profileRef.set(profileData, { merge: true });
    console.log(`Updated contactUsers profile: ${user.capid}`);
  }

  return authUser.uid;
}

async function main() {
  console.log(`Seeding ${seedUsers.length} contact directory users...`);
  console.log('Project: tn170-contact-directory');
  console.log('Collection: contactUsers\n');

  for (const user of seedUsers) {
    await seedUser(user);
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
