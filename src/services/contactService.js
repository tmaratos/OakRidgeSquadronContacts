import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export const CONTACT_TYPES = [
  'Individual',
  'Business',
  'Government',
  'Airport',
  'School',
  'Donor',
  'Vendor',
  'Community Partner',
  'Other',
];

export const CATEGORIES = [
  'Project / Agency',
  'Donor / Fundraising',
  'Community / Strategic',
  'Aerospace Education',
  'Emergency Services',
  'Cadet Programs',
  'Open House / Recruiting',
  'Facility / Meeting Space',
  'Vendor / Supplier',
  'Other',
];

export const EMAIL_LABELS = [
  'Primary',
  'Work',
  'Personal',
  'Business',
  'Office',
  'Donor',
  'School',
  'Government',
  'Other',
];

export const PHONE_LABELS = [
  'Mobile',
  'Work',
  'Office',
  'Main',
  'Direct',
  'Home',
  'Business',
  'After Hours',
  'Other',
];

export const PREFERRED_CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'text', label: 'Text Message' },
  { value: 'website', label: 'Website / Contact Form' },
  { value: 'none', label: 'No Preference' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private (only me)' },
  { value: 'shared', label: 'Shared (squadron)' },
];

export function emptyContact() {
  return {
    name: '',
    organization: '',
    title: '',
    emails: [],
    phones: [],
    preferredContactMethod: 'none',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contactType: 'Individual',
    category: 'Other',
    relationshipOwner: '',
    source: '',
    lastContactDate: '',
    nextFollowUpDate: '',
    notes: '',
    tags: [],
    visibility: 'private',
  };
}

export function normalizeEmails(emails) {
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

export function normalizePhones(phones) {
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

export function setPrimaryEmail(emails, index) {
  return emails.map((e, i) => ({ ...e, isPrimary: i === index }));
}

export function setPrimaryPhone(phones, index) {
  return phones.map((p, i) => ({ ...p, isPrimary: i === index }));
}

export async function getMyContacts(ownerUid) {
  const q = query(
    collection(db, 'contacts'),
    where('ownerUid', '==', ownerUid),
    orderBy('name')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSharedContacts() {
  const q = query(
    collection(db, 'contacts'),
    where('visibility', '==', 'shared'),
    orderBy('name')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createContact(data, user) {
  const payload = {
    ...data,
    emails: normalizeEmails(data.emails),
    phones: normalizePhones(data.phones),
    tags: data.tags || [],
    ownerUid: user.uid,
    ownerCapid: user.profile.capid,
    ownerDisplayName: user.profile.displayName,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  };
  if (payload.visibility === 'shared') {
    payload.sharedBy = user.profile.displayName;
    payload.sharedAt = serverTimestamp();
  }
  const ref = await addDoc(collection(db, 'contacts'), payload);
  return ref.id;
}

export async function updateContact(contactId, data, user, existing) {
  const payload = {
    ...data,
    emails: normalizeEmails(data.emails),
    phones: normalizePhones(data.phones),
    tags: data.tags || [],
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  };

  if (data.visibility === 'shared' && existing.visibility !== 'shared') {
    payload.sharedBy = user.profile.displayName;
    payload.sharedAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'contacts', contactId), payload);
}

export async function deleteContact(contactId) {
  await deleteDoc(doc(db, 'contacts', contactId));
}

export function contactMatchesSearch(contact, searchTerm) {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase().trim();
  const fields = [
    contact.name,
    contact.organization,
    contact.title,
    contact.website,
    contact.address,
    contact.city,
    contact.state,
    contact.zip,
    contact.contactType,
    contact.category,
    contact.relationshipOwner,
    contact.source,
    contact.notes,
    contact.ownerDisplayName,
    ...(contact.tags || []),
  ];

  const preferredLabel = PREFERRED_CONTACT_METHODS.find(
    (m) => m.value === contact.preferredContactMethod
  )?.label;
  if (preferredLabel) fields.push(preferredLabel);
  fields.push(contact.preferredContactMethod);

  (contact.emails || []).forEach((e) => {
    fields.push(e.label, e.value);
  });
  (contact.phones || []).forEach((p) => {
    fields.push(p.label, p.value);
  });

  return fields.some((f) => f && String(f).toLowerCase().includes(term));
}

export function contactMatchesFilters(contact, filters) {
  if (filters.contactType && contact.contactType !== filters.contactType) return false;
  if (filters.category && contact.category !== filters.category) return false;
  if (filters.preferredContactMethod && contact.preferredContactMethod !== filters.preferredContactMethod) {
    return false;
  }
  if (filters.visibility && contact.visibility !== filters.visibility) return false;
  return true;
}

export function getPrimaryEmail(contact) {
  const emails = contact.emails || [];
  return emails.find((e) => e.isPrimary) || emails[0] || null;
}

export function getPrimaryPhone(contact) {
  const phones = contact.phones || [];
  return phones.find((p) => p.isPrimary) || phones[0] || null;
}

export function getPreferredMethodLabel(value) {
  return PREFERRED_CONTACT_METHODS.find((m) => m.value === value)?.label || value || '—';
}
