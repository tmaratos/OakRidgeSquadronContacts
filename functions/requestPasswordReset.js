import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { normalizeEmail, sendRecoveryEmail, getSmtpConfig } from './lib/email.js';

const GENERIC_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

const SMTP_NOT_CONFIGURED_MESSAGE =
  'Password reset email could not be sent because SMTP is not configured on the server. Contact squadron leadership for help resetting your password.';

export const requestPasswordReset = onCall(
  { region: 'us-central1', cors: true },
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

      if (!getSmtpConfig()) {
        console.error('requestPasswordReset: SMTP env vars are not configured.');
        throw new HttpsError('failed-precondition', SMTP_NOT_CONFIGURED_MESSAGE);
      }

      const auth = getAuth();
      const resetLink = await auth.generatePasswordResetLink(lookup.internalAuthEmail, {
        url: process.env.PASSWORD_RESET_CONTINUE_URL || 'https://tmaratos.github.io/OakRidgeSquadronContacts/#/login',
      });

      const sent = await sendRecoveryEmail({
        to: recoveryEmail,
        resetLink,
        displayName: lookup.displayName,
      });

      if (!sent) {
        throw new HttpsError('failed-precondition', SMTP_NOT_CONFIGURED_MESSAGE);
      }

      return { message: GENERIC_MESSAGE };
    } catch (err) {
      if (err instanceof HttpsError) {
        throw err;
      }
      console.error('requestPasswordReset failed:', err);
      throw new HttpsError(
        'internal',
        'The password reset service encountered an unexpected error. Please try again later or contact squadron leadership.'
      );
    }
  }
);

export const updateRecoveryEmail = onCall(
  { region: 'us-central1', cors: true },
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
