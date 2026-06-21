import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function sendRecoveryEmail({ to, resetLink, displayName }) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn('SMTP not configured; password reset link generated but not emailed.');
    console.info(`Reset link for ${to}: ${resetLink}`);
    return false;
  }

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
    subject: 'TN-170 Contact Directory — Password Reset',
    text: [
      `Hello${displayName ? ` ${displayName}` : ''},`,
      '',
      'A password reset was requested for your TN-170 Contact Directory account.',
      'Use the link below to set a new password:',
      '',
      resetLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Hello${displayName ? ` ${displayName}` : ''},</p>
      <p>A password reset was requested for your TN-170 Contact Directory account.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return true;
}
