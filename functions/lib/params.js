import { defineSecret } from 'firebase-functions/params';

export const resendApiKey = defineSecret('RESEND_API_KEY');

/** Add SMTP_USER + SMTP_PASS secrets when Gmail app password is configured. */
export const passwordResetSecrets = [resendApiKey];
