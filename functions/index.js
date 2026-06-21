import { initializeApp } from 'firebase-admin/app';
import { requestPasswordReset, updateRecoveryEmail } from './requestPasswordReset.js';

initializeApp();

export { requestPasswordReset, updateRecoveryEmail };
