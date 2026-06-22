import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { normalizeEmail, sendRecoveryEmail } from './lib/email.js';

const GENERIC_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

const CONTINUE_URL =
  process.env.PASSWORD_RESET_CONTINUE_URL ||
  'https://tmaratos.github.io/OakRidgeSquadronContacts/#/login';

export const requestPasswordReset = onCall(
  { region: 'us-central1', cors: true, invoker: 'public' },
  async (request) => {
    try {
      const capid = String(request.data?.capid || '').trim();
      const recoveryEmail = normalizeEmail(request.data?.recoveryEmail);

      if (!capid || !recoveryEmail) {
        throw new HttpsError('invalid-argument', 'CAPID and recovery email are required.');
      }

      const db = getFirestore();
      const lookupSnap = await db.collection('contactUserLookup').doc(capid).get();

      if (!lookupSnap.exists) {
        return { message: GENERIC_MESSAGE };
      }

      const lookup = lookupSnap.data();
      if (!lookup.isActive || normalizeEmail(lookup.recoveryEmail) !== recoveryEmail) {
        return { message: GENERIC_MESSAGE };
      }

      const auth = getAuth();
      const resetLink = await auth.generatePasswordResetLink(lookup.internalAuthEmail, {
        url: CONTINUE_URL,
      });

      try {
        await sendRecoveryEmail({
          to: recoveryEmail,
          resetLink,
          displayName: lookup.displayName,
        });
      } catch (emailErr) {
        console.error('requestPasswordReset: failed to send email:', emailErr);
      }

      return { message: GENERIC_MESSAGE };
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }
      console.error('requestPasswordReset failed:', err);
      return { message: GENERIC_MESSAGE };
    }
  }
);

export const updateRecoveryEmail = onCall(
  { region: 'us-central1', cors: true, invoker: 'public' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const recoveryEmail = normalizeEmail(request.data?.recoveryEmail);
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      throw new HttpsError('invalid-argument', 'A valid recovery email is required.');
    }

    const db = getFirestore();
    const profileRef = db.collection('contactUsers').doc(request.auth.uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists || profileSnap.data().isActive !== true) {
      throw new HttpsError('permission-denied', 'Account is not active.');
    }

    const profile = profileSnap.data();
    const now = FieldValue.serverTimestamp();

    await profileRef.update({
      recoveryEmail,
      recoveryEmailVerified: false,
      recoveryEmailUpdatedAt: now,
      updatedAt: now,
    });

    await db.collection('contactUserLookup').doc(profile.capid).set(
      {
        uid: request.auth.uid,
        capid: profile.capid,
        displayName: profile.displayName,
        internalAuthEmail: profile.internalAuthEmail,
        recoveryEmail,
        isActive: profile.isActive,
        updatedAt: now,
      },
      { merge: true }
    );

    return { recoveryEmail };
  }
);
