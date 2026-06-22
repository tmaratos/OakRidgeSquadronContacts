import admin from 'firebase-admin';

const GENERIC_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

const CONTINUE_URL =
  process.env.PASSWORD_RESET_CONTINUE_URL ||
  'https://tmaratos.github.io/OakRidgeSquadronContacts/#/login';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function initAdmin() {
  if (admin.apps.length) {
    return;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(json)),
  });
}

function buildEmailContent({ resetLink, displayName }) {
  const greeting = displayName ? `Hello ${displayName},` : 'Hello,';
  return {
    subject: 'TN-170 Contact Directory — Password Reset',
    text: [
      greeting,
      '',
      'A password reset was requested for your TN-170 Contact Directory account.',
      'Use the link below to set a new password:',
      '',
      resetLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>${greeting}</p>
      <p>A password reset was requested for your TN-170 Contact Directory account.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  };
}

async function sendViaResend({ to, resetLink, displayName }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set; logging reset link.');
    console.info(`Reset link for ${to}: ${resetLink}`);
    return false;
  }

  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    'TN-170 Contact Directory <onboarding@resend.dev>';
  const { subject, text, html } = buildEmailContent({ resetLink, displayName });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
  return true;
}

function setCors(res) {
  const origin = process.env.ALLOWED_ORIGIN || 'https://tmaratos.github.io';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: GENERIC_MESSAGE });
  }

  try {
    initAdmin();

    const capid = String(req.body?.capid || '').trim();
    const recoveryEmail = normalizeEmail(req.body?.recoveryEmail);

    if (!capid || !recoveryEmail) {
      return res.status(400).json({ message: 'CAPID and recovery email are required.' });
    }

    const db = admin.firestore();
    const lookupSnap = await db.collection('contactUserLookup').doc(capid).get();

    if (!lookupSnap.exists) {
      return res.status(200).json({ message: GENERIC_MESSAGE });
    }

    const lookup = lookupSnap.data();
    if (!lookup.isActive || normalizeEmail(lookup.recoveryEmail) !== recoveryEmail) {
      return res.status(200).json({ message: GENERIC_MESSAGE });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(lookup.internalAuthEmail, {
      url: CONTINUE_URL,
    });

    try {
      await sendViaResend({ to: recoveryEmail, resetLink, displayName: lookup.displayName });
    } catch (emailErr) {
      console.error('password-reset API: email send failed:', emailErr);
    }

    return res.status(200).json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('password-reset API failed:', err);
    return res.status(200).json({ message: GENERIC_MESSAGE });
  }
}
