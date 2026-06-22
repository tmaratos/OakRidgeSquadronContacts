import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
const auth = new GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();
const token = await client.getAccessToken();

const name = 'projects/tn170-contact-directory/locations/us-central1/services/requestpasswordreset';
const res = await fetch(`https://run.googleapis.com/v2/${name}`, {
  headers: { Authorization: `Bearer ${token.token}` },
});

const data = await res.json();
if (!res.ok) {
  console.log(`Cloud Run service check failed (${res.status}):`, data.error?.message || JSON.stringify(data));
  process.exit(1);
}

console.log('Service:', data.name);
console.log('Latest revision:', data.latestReadyRevision);
const env = data.template?.containers?.[0]?.env || [];
console.log('Env vars (names only):', env.map((e) => e.name).join(', ') || '(none)');
const secrets = env.filter((e) => e.valueSource?.secretKeyRef);
console.log(
  'Bound secrets:',
  secrets.map((e) => `${e.name} -> ${e.valueSource.secretKeyRef.secret}`).join(', ') || '(none)'
);
