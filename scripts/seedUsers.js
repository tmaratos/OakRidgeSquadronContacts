import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';
import { seedUsers } from '../src/data/seedUsers.js';

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

async function seedUser(user) {
  let authUser;
  try {
    authUser = await auth.getUserByEmail(user.emailLogin);
    console.log(`Auth user exists: ${user.capid} (${authUser.uid})`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    authUser = await auth.createUser({
      email: user.emailLogin,
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
    emailLogin: user.emailLogin,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!existing.exists) {
    profileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    await profileRef.set(profileData);
    console.log(`Created contactUsers profile: ${user.capid}`);
  } else {
    await profileRef.update(profileData);
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
