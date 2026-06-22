/**
 * Verifies contact create payload shape (no Firestore required).
 * Run: npm run verify:create
 */
import assert from 'node:assert/strict';
import { buildContactSearchText, normalizeOrganization } from '../src/utils/searchUtils.js';

function normalizeEmails(emails) {
  if (!emails?.length) return [];
  const normalized = emails.map((e, i) => ({
    label: e.label || 'Primary',
    value: (e.value || '').trim(),
    isPrimary: Boolean(e.isPrimary),
  }));
  if (!normalized.some((e) => e.isPrimary) && normalized.length > 0) {
    normalized[0].isPrimary = true;
  }
  return normalized.filter((e) => e.value);
}

function normalizePhones(phones) {
  if (!phones?.length) return [];
  const normalized = phones.map((p) => ({
    label: p.label || 'Mobile',
    value: (p.value || '').trim(),
    isPrimary: Boolean(p.isPrimary),
  }));
  if (!normalized.some((p) => p.isPrimary) && normalized.length > 0) {
    normalized[0].isPrimary = true;
  }
  return normalized.filter((p) => p.value);
}

function buildCreatePayload(data, userContext) {
  const { uid, profile } = userContext;
  const organization = (data.organization || '').trim();
  const organizationNormalized = normalizeOrganization(organization);
  const enriched = {
    ...data,
    organization,
    organizationNormalized,
    emails: normalizeEmails(data.emails),
    phones: normalizePhones(data.phones),
    tags: data.tags || [],
  };
  enriched.searchText = buildContactSearchText(enriched);

  return {
    ...enriched,
    ownerUid: uid,
    ownerCapid: profile?.capid ?? '',
    ownerDisplayName: profile?.displayName ?? '',
    isPinned: Boolean(data.isPinned),
    createdAt: { _methodName: 'serverTimestamp' },
    createdBy: uid,
    updatedAt: { _methodName: 'serverTimestamp' },
    updatedBy: uid,
  };
}

const userContext = {
  uid: 'test-user-uid',
  profile: { capid: '729204', displayName: 'Tristan G Maratos' },
};

const formData = {
  name: 'Jane Doe',
  organization: 'Civil Air Patrol',
  title: '',
  emails: [{ label: 'Primary', value: 'jane@example.com', isPrimary: true }],
  phones: [{ label: 'Mobile', value: '555-0100', isPrimary: true }],
  preferredContactMethod: 'none',
  website: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  contactType: 'Individual',
  category: 'Community / Strategic',
  status: 'Active',
  relationshipOwner: '',
  source: '',
  lastContactDate: '',
  nextFollowUpDate: '',
  notes: '',
  tags: [],
  visibility: 'private',
};

const payload = buildCreatePayload(formData, userContext);

assert.equal(payload.ownerUid, 'test-user-uid');
assert.equal(payload.ownerCapid, '729204');
assert.equal(payload.ownerDisplayName, 'Tristan G Maratos');
assert.equal(payload.organizationNormalized, 'civil air patrol');
assert.ok(payload.searchText.includes('jane doe'));
assert.ok(payload.searchText.includes('jane@example.com'));
assert.equal(payload.visibility, 'private');
assert.equal(payload.emails.length, 1);
assert.equal(payload.phones.length, 1);

for (const [key, value] of Object.entries(payload)) {
  assert.notEqual(value, undefined, `payload field "${key}" must not be undefined`);
}

console.log('verifyCreatePayload: all checks passed');
