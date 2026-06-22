import { defineSecret } from 'firebase-functions/params';

/** Bound to requestPasswordReset so process.env.RESEND_API_KEY is available at runtime. */
export const resendApiKey = defineSecret('RESEND_API_KEY');

export const passwordResetSecrets = [resendApiKey];
