import { defineSecret } from 'firebase-functions/params';

export const resendApiKey = defineSecret('RESEND_API_KEY');
export const smtpUser = defineSecret('SMTP_USER');
export const smtpPass = defineSecret('SMTP_PASS');
export const passwordResetSecrets = [resendApiKey, smtpUser, smtpPass];
