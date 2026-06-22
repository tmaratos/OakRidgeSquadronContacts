import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/logging.read'],
});
const client = await auth.getClient();
const token = await client.getAccessToken();

const url = 'https://logging.googleapis.com/v2/entries:list';
const body = {
  resourceNames: ['projects/tn170-contact-directory'],
  filter:
    'resource.type="cloud_run_revision" AND (textPayload:"requestPasswordReset" OR textPayload:"Password reset" OR textPayload:"Reset link" OR textPayload:"Resend")',
  orderBy: 'timestamp desc',
  pageSize: 20,
};

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
const data = await res.json();
if (!res.ok) {
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

if (!data.entries?.length) {
  console.log('No matching log entries found.');
  process.exit(0);
}

for (const e of data.entries) {
  const msg =
    e.textPayload ||
    e.jsonPayload?.message ||
    JSON.stringify(e.jsonPayload || {});
  console.log(`${e.timestamp} ${msg.slice(0, 400)}`);
}
