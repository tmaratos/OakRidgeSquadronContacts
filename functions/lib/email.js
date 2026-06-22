import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'TN-170 Contact Directory <onboarding@resend.dev>';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    from: process.env.RESEND_FROM || process.env.SMTP_FROM || DEFAULT_FROM,
  };
}

export { getSmtpConfig, getResendConfig };

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buildEmailContent({ resetLink, displayName }) {
  const greeting = displayName ? `Hello ${displayName},` : 'Hello,';
  const text = [
    greeting,
    '',
    'A password reset was requested for your TN-170 Contact Directory account.',
    'Use the link below to set a new password:',
    '',
    resetLink,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <p>${greeting}</p>
    <p>A password reset was requested for your TN-170 Contact Directory account.</p>
    <p><a href="${resetLink}">Reset your password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  return {
    subject: 'TN-170 Contact Directory — Password Reset',
    text,
    html,
  };
}

async function sendViaResend({ to, resetLink, displayName, apiKey, from }) {
  const { subject, text, html } = buildEmailContent({ resetLink, displayName });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return true;
}

async function sendViaSmtp({ to, resetLink, displayName, smtp }) {
  const { subject, text, html } = buildEmailContent({ resetLink, displayName });

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  });

  return true;
}

export async function sendRecoveryEmail({ to, resetLink, displayName, capid }) {
  const recipient = normalizeEmail(to);
  const label = capid ? `CAPID ${capid}` : recipient;

  if (!recipient || recipient.endsWith('@tn170.local')) {
    throw new Error(
      `Refusing to send password reset to internal auth address (${recipient}). Use recovery email.`
    );
  }

  const smtp = getSmtpConfig();
  const resend = getResendConfig();

  // Gmail SMTP can send to any address; Resend test sender (onboarding@resend.dev) only
  // emails the Resend account owner until a domain is verified at resend.com/domains.
  if (smtp) {
    try {
      await sendViaSmtp({ to: recipient, resetLink, displayName, smtp });
      console.info(
        `Password reset email sent via SMTP to recovery address ${recipient} (${label}), from ${smtp.from}`
      );
      return true;
    } catch (smtpErr) {
      console.error(`SMTP send failed for ${label}:`, smtpErr?.message || smtpErr);
    }
  }

  if (resend) {
    try {
      await sendViaResend({ to: recipient, resetLink, displayName, ...resend });
      console.info(
        `Password reset email sent via Resend to recovery address ${recipient} (${label}), from ${resend.from}`
      );
      return true;
    } catch (resendErr) {
      console.error(`Resend send failed for ${label}:`, resendErr?.message || resendErr);
      if (smtp) {
        try {
          await sendViaSmtp({ to: recipient, resetLink, displayName, smtp });
          console.info(`Password reset email sent via SMTP fallback to ${recipient} (${label})`);
          return true;
        } catch (smtpErr2) {
          console.error(`SMTP fallback failed for ${label}:`, smtpErr2?.message || smtpErr2);
        }
      }
    }
  }

  console.warn(
    `No email provider configured for ${label}. Set SMTP_* (Gmail app password) or verify a domain in Resend.`
  );
  console.info(`Reset link (not emailed) for recovery address ${recipient} (${label}): ${resetLink}`);
  return false;
}
