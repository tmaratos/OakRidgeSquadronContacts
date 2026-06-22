import {
  CATEGORIES,
  CONTACT_TYPES,
  EMAIL_LABELS,
  PHONE_LABELS,
  PREFERRED_CONTACT_METHODS,
} from '../services/contactService';
import { normalizeOrganization } from './searchUtils';

const EMAIL_LABEL_MAP = {
  WORK: 'Work',
  BUSINESS: 'Business',
  OFFICE: 'Office',
  HOME: 'Personal',
  PERSONAL: 'Personal',
  PRIMARY: 'Primary',
  DONOR: 'Donor',
  SCHOOL: 'School',
  GOVERNMENT: 'Government',
  OTHER: 'Other',
};

const PHONE_LABEL_MAP = {
  WORK: 'Work',
  OFFICE: 'Office',
  HOME: 'Home',
  CELL: 'Mobile',
  MOBILE: 'Mobile',
  MAIN: 'Main',
  DIRECT: 'Direct',
  BUSINESS: 'Business',
  OTHER: 'Other',
};

export function normalizeImportEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function normalizeImportPhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function normalizeImportNameOrg(name, organization) {
  return `${(name || '').trim().toLowerCase()}|${normalizeOrganization(organization)}`;
}

export function normalizeEmailLabel(raw) {
  if (!raw) return 'Primary';
  const key = String(raw).trim().toUpperCase().replace(/[^A-Z]/g, '');
  return EMAIL_LABEL_MAP[key] || (EMAIL_LABELS.includes(raw) ? raw : 'Other');
}

export function normalizePhoneLabel(raw) {
  if (!raw) return 'Mobile';
  const key = String(raw).trim().toUpperCase().replace(/[^A-Z]/g, '');
  return PHONE_LABEL_MAP[key] || (PHONE_LABELS.includes(raw) ? raw : 'Other');
}

function ensurePrimary(items) {
  if (!items?.length) return [];
  const list = items.map((item) => ({ ...item }));
  if (!list.some((item) => item.isPrimary)) {
    list[0].isPrimary = true;
  }
  return list;
}

function unfoldVCardLines(text) {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = [];
  rawLines.forEach((line) => {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  });
  return lines;
}

function parseVCardProperty(line) {
  const colonIdx = line.indexOf(':');
  if (colonIdx < 0) return null;

  const head = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1).trim();
  const [namePart, ...paramParts] = head.split(';');
  const name = namePart.split('.').pop().toUpperCase();
  const params = {};

  paramParts.forEach((part) => {
    const [k, ...rest] = part.split('=');
    if (!k) return;
    const key = k.trim().toLowerCase();
    const val = rest.join('=').trim();
    if (key === 'type') {
      params.type = params.type || [];
      params.type.push(...val.split(',').map((v) => v.trim()));
    } else {
      params[key] = val;
    }
  });

  return { name, value, params };
}

function splitVCardBlocks(text) {
  const lines = unfoldVCardLines(text);
  const blocks = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === 'BEGIN:VCARD') {
      current = [];
      return;
    }
    if (trimmed.toUpperCase() === 'END:VCARD') {
      if (current) blocks.push(current);
      current = null;
      return;
    }
    if (current) current.push(line);
  });

  return blocks;
}

function parseVCardBlock(lines) {
  const props = {};
  lines.forEach((line) => {
    const prop = parseVCardProperty(line);
    if (!prop) return;
    if (!props[prop.name]) props[prop.name] = [];
    props[prop.name].push(prop);
  });
  return props;
}

function getPropValues(props, name) {
  return props[name.toUpperCase()] || [];
}

function getFirstValue(props, name) {
  return getPropValues(props, name)[0]?.value || '';
}

function parseInlineVCardEmails(props) {
  const emails = getPropValues(props, 'EMAIL')
    .map((entry) => {
      const types = entry.params.type || [];
      const labelRaw = types.find((t) => t && t.toUpperCase() !== 'INTERNET') || types[0];
      const isPrimary = types.some((t) => String(t).toUpperCase() === 'PREF');
      return {
        label: normalizeEmailLabel(labelRaw),
        value: entry.value,
        isPrimary,
      };
    })
    .filter((e) => e.value);
  return ensurePrimary(emails);
}

function parseInlineVCardPhones(props) {
  const phones = getPropValues(props, 'TEL')
    .map((entry) => {
      const types = entry.params.type || [];
      const labelRaw =
        types.find((t) => t && !['VOICE', 'TEXT'].includes(String(t).toUpperCase())) || types[0];
      const isPrimary = types.some((t) => String(t).toUpperCase() === 'PREF');
      return {
        label: normalizePhoneLabel(labelRaw),
        value: entry.value,
        isPrimary,
      };
    })
    .filter((p) => p.value);
  return ensurePrimary(phones);
}

function parseInlineVCardAddress(props) {
  const adr = getFirstValue(props, 'ADR');
  if (!adr) return { address: '', city: '', state: '', zip: '' };
  const parts = adr.split(';');
  return {
    address: (parts[2] || '').trim(),
    city: (parts[3] || '').trim(),
    state: (parts[4] || '').trim(),
    zip: (parts[5] || '').trim(),
  };
}

function parseInlineVCardName(props) {
  const fn = getFirstValue(props, 'FN');
  if (fn) return fn;

  const n = getFirstValue(props, 'N');
  if (n) {
    const parts = n.split(';');
    return [parts[1], parts[2], parts[0]].filter(Boolean).join(' ').trim();
  }
  return '';
}

export function mapParsedContactToImport(raw) {
  return {
    ...raw,
    name: (raw.name || '').trim(),
    organization: (raw.organization || '').trim(),
    title: (raw.title || '').trim(),
    emails: ensurePrimary(raw.emails || []),
    phones: ensurePrimary(raw.phones || []),
    website: (raw.website || '').trim(),
    address: (raw.address || '').trim(),
    city: (raw.city || '').trim(),
    state: (raw.state || '').trim(),
    zip: (raw.zip || '').trim(),
    notes: (raw.notes || '').trim(),
    visibility: raw.visibility || 'private',
    contactType: CONTACT_TYPES.includes(raw.contactType) ? raw.contactType : 'Individual',
    category: CATEGORIES.includes(raw.category) ? raw.category : 'Community / Strategic',
    status: 'Active',
    preferredContactMethod: PREFERRED_CONTACT_METHODS.some((m) => m.value === raw.preferredContactMethod)
      ? raw.preferredContactMethod
      : 'none',
    isPinned: false,
    tags: ['imported'],
    selected: raw.selected !== false,
    importKey: raw.importKey || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}

export function parseVCardText(text) {
  const blocks = splitVCardBlocks(text);

  return blocks
    .map((lines, index) => {
      const props = parseVCardBlock(lines);
      const addr = parseInlineVCardAddress(props);

      return mapParsedContactToImport({
        importKey: `vcf-${index}`,
        name: parseInlineVCardName(props),
        organization: getFirstValue(props, 'ORG'),
        title: getFirstValue(props, 'TITLE'),
        emails: parseInlineVCardEmails(props),
        phones: parseInlineVCardPhones(props),
        website: getFirstValue(props, 'URL'),
        ...addr,
        notes: getFirstValue(props, 'NOTE'),
      });
    })
    .filter((c) => c.name || c.emails.length || c.phones.length);
}

export async function parseVCardFile(file) {
  const text = await file.text();
  return parseVCardText(text);
}

const CSV_COLUMN_ALIASES = {
  name: ['name', 'full name', 'fullname', 'contact name', 'display name'],
  firstName: ['first name', 'firstname', 'given name', 'givenname'],
  lastName: ['last name', 'lastname', 'surname', 'family name'],
  organization: ['organization', 'organisation', 'org', 'company', 'agency', 'employer', 'school'],
  title: ['title', 'job title', 'role', 'position'],
  email: ['email', 'e-mail', 'email address', 'mail', 'primary email'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone number', 'primary phone'],
  website: ['website', 'url', 'web', 'homepage'],
  address: ['address', 'street', 'street address'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  zip: ['zip', 'zip code', 'zipcode', 'postal code', 'postal'],
  notes: ['notes', 'note', 'comments', 'description'],
  category: ['category'],
  contactType: ['contact type', 'type'],
};

function normalizeHeader(header) {
  return (header || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function detectColumnMap(headers) {
  const map = {};
  const normalized = headers.map(normalizeHeader);

  Object.entries(CSV_COLUMN_ALIASES).forEach(([field, aliases]) => {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  });

  normalized.forEach((h, idx) => {
    if (h.includes('email') && map.email === undefined) map.email = idx;
    if ((h.includes('phone') || h.includes('mobile') || h.includes('cell')) && map.phone === undefined) {
      map.phone = idx;
    }
  });

  return map;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
}

function splitMultiValue(value) {
  if (!value) return [];
  return value
    .split(/[;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseCSVText(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  const columnMap = detectColumnMap(headers);

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const get = (field) => {
      const idx = columnMap[field];
      return idx !== undefined ? (cells[idx] || '').trim() : '';
    };

    let name = get('name');
    if (!name) {
      const first = get('firstName');
      const last = get('lastName');
      name = [first, last].filter(Boolean).join(' ');
    }

    const emailValues = splitMultiValue(get('email'));
    const phoneValues = splitMultiValue(get('phone'));

    return mapParsedContactToImport({
      importKey: `csv-${index}`,
      name,
      organization: get('organization'),
      title: get('title'),
      emails: emailValues.map((value, i) => ({
        label: i === 0 ? 'Primary' : 'Other',
        value,
        isPrimary: i === 0,
      })),
      phones: phoneValues.map((value, i) => ({
        label: i === 0 ? 'Mobile' : 'Other',
        value,
        isPrimary: i === 0,
      })),
      website: get('website'),
      address: get('address'),
      city: get('city'),
      state: get('state'),
      zip: get('zip'),
      notes: get('notes'),
      category: get('category') || undefined,
      contactType: get('contactType') || undefined,
    });
  }).filter((c) => c.name || c.emails.length || c.phones.length);
}

export async function parseCSVFile(file) {
  const text = await file.text();
  return parseCSVText(text);
}

export const DEVICE_CONTACT_PICKER_PROPS = ['name', 'email', 'tel', 'address'];

export function isDeviceContactPickerSupported() {
  if (typeof navigator === 'undefined') return false;
  if (typeof window !== 'undefined' && !window.isSecureContext) return false;
  return 'contacts' in navigator && typeof navigator.contacts?.select === 'function';
}

function formatContactPickerName(nameEntry) {
  if (!nameEntry) return '';
  if (typeof nameEntry === 'string') return nameEntry.trim();

  const given = Array.isArray(nameEntry.givenName) ? nameEntry.givenName[0] : nameEntry.givenName;
  const family = Array.isArray(nameEntry.familyName) ? nameEntry.familyName[0] : nameEntry.familyName;
  const parts = [given, family].filter(Boolean);
  if (parts.length) return parts.join(' ').trim();

  if (Array.isArray(nameEntry.name)) return (nameEntry.name[0] || '').trim();
  return String(nameEntry.name || '').trim();
}

function formatContactPickerNames(names) {
  if (!names?.length) return '';
  return formatContactPickerName(names[0]);
}

export async function pickDeviceContacts({ multiple = true } = {}) {
  if (!isDeviceContactPickerSupported()) {
    throw new Error(
      'Your contacts app is not available in this browser. Use vCard or CSV import, or open this page in Chrome on Android.'
    );
  }

  let picked;
  try {
    picked = await navigator.contacts.select(DEVICE_CONTACT_PICKER_PROPS, { multiple });
  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
      return [];
    }
    throw err;
  }

  return picked.map((contact, index) => {
    const name = formatContactPickerNames(contact.name);
    const emails = (contact.email || []).map((value, i) => ({
      label: i === 0 ? 'Primary' : 'Other',
      value,
      isPrimary: i === 0,
    }));
    const phones = (contact.tel || []).map((value, i) => ({
      label: i === 0 ? 'Mobile' : 'Other',
      value,
      isPrimary: i === 0,
    }));

    const addr = contact.address?.[0];
    let address = '';
    let city = '';
    let state = '';
    let zip = '';
    if (addr) {
      address = [addr.addressLine, addr.streetAddress].filter(Boolean).join(' ').trim();
      city = addr.city || '';
      state = addr.region || addr.country || '';
      zip = addr.postalCode || '';
    }

    return mapParsedContactToImport({
      importKey: `device-${index}`,
      name,
      emails,
      phones,
      address,
      city,
      state,
      zip,
    });
  }).filter((c) => c.name || c.emails.length || c.phones.length);
}

export function findDuplicateWarnings(importContact, existingContacts) {
  const warnings = [];
  const importEmails = (importContact.emails || []).map((e) => normalizeImportEmail(e.value)).filter(Boolean);
  const importPhones = (importContact.phones || []).map((p) => normalizeImportPhone(p.value)).filter(Boolean);
  const importNameOrg = normalizeImportNameOrg(importContact.name, importContact.organization);

  existingContacts.forEach((existing) => {
    const existingEmails = (existing.emails || []).map((e) => normalizeImportEmail(e.value)).filter(Boolean);
    const existingPhones = (existing.phones || []).map((p) => normalizeImportPhone(p.value)).filter(Boolean);
    const existingNameOrg = normalizeImportNameOrg(existing.name, existing.organization);

    const emailMatch = importEmails.some((e) => existingEmails.includes(e));
    const phoneMatch = importPhones.some((p) => p && existingPhones.includes(p));
    const nameOrgMatch = importNameOrg !== '|' && importNameOrg === existingNameOrg;

    if (emailMatch || phoneMatch || nameOrgMatch) {
      warnings.push({
        existingId: existing.id,
        existingName: existing.name,
        reason: emailMatch ? 'email' : phoneMatch ? 'phone' : 'name and organization',
      });
    }
  });

  return warnings;
}

export function annotateImportDuplicates(importContacts, existingContacts) {
  return importContacts.map((contact) => ({
    ...contact,
    duplicateWarnings: findDuplicateWarnings(contact, existingContacts),
  }));
}

export function getPrimaryEmailValue(contact) {
  const emails = contact.emails || [];
  const primary = emails.find((e) => e.isPrimary) || emails[0];
  return primary?.value || '';
}

export function getPrimaryPhoneValue(contact) {
  const phones = contact.phones || [];
  const primary = phones.find((p) => p.isPrimary) || phones[0];
  return primary?.value || '';
}

export function notesPreview(notes, maxLen = 60) {
  const text = (notes || '').trim();
  if (!text) return '—';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
