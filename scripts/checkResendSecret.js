import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();
const token = await client.getAccessToken();

const secretName = 'projects/tn170-contact-directory/secrets/RESEND_API_KEY';
const res = await fetch(`https://secretmanager.googleapis.com/v1/${secretName}`, {
  headers: { Authorization: `Bearer ${token.token}` },
});

if (res.status === 404) {
  console.log('RESEND_API_KEY secret: NOT FOUND');
  process.exit(0);
}

if (!res.ok) {
  const data = await res.json();
  console.log(`RESEND_API_KEY secret check failed (${res.status}):`, data.error?.message || data);
  process.exit(1);
}

const data = await res.json();
console.log('RESEND_API_KEY secret: EXISTS');
console.log('  name:', data.name);
console.log('  createTime:', data.createTime);
console.log('  replication:', JSON.stringify(data.replication));
