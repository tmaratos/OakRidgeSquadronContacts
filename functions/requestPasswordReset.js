import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { normalizeEmail, sendRecoveryEmail } from './lib/email.js';
import { passwordResetSecrets } from './lib/params.js';

const GENERIC_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

/** Firebase Hosting default domain is always an authorized continue URL. */
const CONTINUE_URL =
  process.env.PASSWORD_RESET_CONTINUE_URL ||
  'https://tn170-contact-directory.firebaseapp.com';

export const requestPasswordReset = onCall(
  {
    region: 'us-central1',
    cors: true,
    invoker: 'public',
    secrets: passwordResetSecrets,
    environmentVariables: {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
    },
  },
  async (request) => {
    try {
      const capid = String(request.data?.capid || '').trim();
      const recoveryEmailInput = normalizeEmail(request.data?.recoveryEmail);

      if (!capid || !recoveryEmailInput) {
        throw new HttpsError('invalid-argument', 'CAPID and recovery email are required.');
      }

      const db = getFirestore();
      const lookupSnap = await db.collection('contactUserLookup').doc(capid).get();

      if (!lookupSnap.exists) {
        console.info(`requestPasswordReset: no lookup for CAPID ${capid}`);
        return { message: GENERIC_MESSAGE };
      }

      const lookup = lookupSnap.data();

      if (!lookup.isActive) {
        console.info(`requestPasswordReset: CAPID ${capid} inactive`);
        return { message: GENERIC_MESSAGE };
      }

      // Prefer contactUsers profile — it reflects Account page updates; lookup may be stale.
      let recoveryEmailOnFile = normalizeEmail(lookup.recoveryEmail);
      if (lookup.uid) {
        const profileSnap = await db.collection('contactUsers').doc(lookup.uid).get();
        if (profileSnap.exists) {
          const profileRecovery = normalizeEmail(profileSnap.data().recoveryEmail);
          if (profileRecovery) {
            if (profileRecovery !== recoveryEmailOnFile) {
              console.info(
                `requestPasswordReset: syncing lookup recovery email for CAPID ${capid} (${recoveryEmailOnFile} → ${profileRecovery})`
              );
              await db.collection('contactUserLookup').doc(capid).update({
                recoveryEmail: profileRecovery,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
            recoveryEmailOnFile = profileRecovery;
          }
        }
      }

      if (
        !recoveryEmailOnFile
        || recoveryEmailOnFile.endsWith('@tn170.local')
        || !recoveryEmailOnFile.includes('@')
      ) {
        console.error(
          `requestPasswordReset: no valid recovery email on file for CAPID ${capid} (must not use @tn170.local)`
        );
        return { message: GENERIC_MESSAGE };
      }

      if (recoveryEmailOnFile !== recoveryEmailInput) {
        console.info(`requestPasswordReset: CAPID ${capid} recovery email mismatch`);
        return { message: GENERIC_MESSAGE };
      }

      const internalAuthEmail = lookup.internalAuthEmail;
      if (!internalAuthEmail || !internalAuthEmail.endsWith('@tn170.local')) {
        console.error(`requestPasswordReset: missing internal auth email for CAPID ${capid}`);
        return { message: GENERIC_MESSAGE };
      }

      const auth = getAuth();
      let resetLink;
      try {
        resetLink = await auth.generatePasswordResetLink(internalAuthEmail, {
          url: CONTINUE_URL,
        });
      } catch (linkErr) {
        const raw = linkErr?.message || '';
        if (raw.includes('RESET_PASSWORD_EXCEED_LIMIT')) {
          console.error(`requestPasswordReset: rate limit for CAPID ${capid}`);
          return {
            message:
              'Too many password reset attempts. Please wait about an hour and try again, or contact squadron leadership.',
          };
        }
        throw linkErr;
      }

      const emailSent = await sendRecoveryEmail({
        to: recoveryEmailOnFile,
        resetLink,
        displayName: lookup.displayName,
        capid,
      }).catch((emailErr) => {
        console.error(
          `requestPasswordReset: email delivery failed for CAPID ${capid} → ${recoveryEmailOnFile}:`,
          emailErr?.message || emailErr
        );
        return false;
      });

      if (emailSent) {
        console.info(
          `requestPasswordReset: reset email sent for CAPID ${capid} → ${recoveryEmailOnFile} (auth: ${lookup.internalAuthEmail})`
        );
      } else {
        console.error(
          `requestPasswordReset: no email delivered for CAPID ${capid} → ${recoveryEmailOnFile}. Check RESEND_API_KEY / SMTP_* secrets.`
        );
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
