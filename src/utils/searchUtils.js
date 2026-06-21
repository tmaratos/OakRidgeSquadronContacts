const PREFERRED_METHOD_LABELS = {
  email: 'Email',
  phone: 'Phone Call',
  text: 'Text Message',
  website: 'Website / Contact Form',
  none: 'No Preference',
};

export function normalizeOrganization(org) {
  return (org || '').trim().toLowerCase();
}

export function buildContactSearchText(contact) {
  if (!contact) return '';

  const parts = [
    contact.name,
    contact.organization,
    contact.organizationNormalized,
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
    contact.lastContactDate,
    contact.nextFollowUpDate,
    contact.status,
    contact.visibility,
    contact.ownerDisplayName,
    contact.sharedBy,
    contact.preferredContactMethod,
    PREFERRED_METHOD_LABELS[contact.preferredContactMethod],
  ];

  (contact.emails || []).forEach((e) => {
    parts.push(e.label, e.value);
  });
  (contact.phones || []).forEach((p) => {
    parts.push(p.label, p.value);
  });
  (contact.tags || []).forEach((tag) => {
    parts.push(tag);
  });

  return parts
    .filter((p) => p != null && String(p).trim())
    .map((p) => String(p).toLowerCase())
    .join(' ');
}

export function contactMatchesSearchTerm(contact, searchTerm) {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase().trim();
  const searchText = contact.searchText || buildContactSearchText(contact);
  return searchText.includes(term);
}

function hasMixedCase(str) {
  return /[A-Z]/.test(str) && /[a-z]/.test(str);
}

export function pickBestOrganizationDisplayName(variants) {
  if (!variants?.length) return '';

  const freq = {};
  variants.forEach((v) => {
    const trimmed = v.trim();
    if (trimmed) freq[trimmed] = (freq[trimmed] || 0) + 1;
  });

  return Object.entries(freq).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const aMixed = hasMixedCase(a[0]) ? 1 : 0;
    const bMixed = hasMixedCase(b[0]) ? 1 : 0;
    if (bMixed !== aMixed) return bMixed - aMixed;
    return b[0].length - a[0].length;
  })[0][0];
}

export function groupContactsByOrganization(contacts) {
  const groups = {};

  contacts.forEach((contact) => {
    const key = normalizeOrganization(contact.organization);
    if (!key) return;

    if (!groups[key]) {
      groups[key] = {
        key,
        displayName: contact.organization.trim(),
        nameVariants: [],
        contacts: [],
      };
    }

    groups[key].contacts.push(contact);
    if (contact.organization?.trim()) {
      groups[key].nameVariants.push(contact.organization.trim());
    }
  });

  return Object.values(groups)
    .map((group) => ({
      ...group,
      displayName: pickBestOrganizationDisplayName(group.nameVariants),
      contacts: group.contacts.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function getUniqueOrganizations(contacts) {
  return groupContactsByOrganization(contacts).map((g) => ({
    key: g.key,
    displayName: g.displayName,
  }));
}

export function summarizeOrganization(group) {
  const { contacts } = group;
  const categories = [...new Set(contacts.map((c) => c.category).filter(Boolean))];
  const contactTypes = [...new Set(contacts.map((c) => c.contactType).filter(Boolean))];
  const tags = [...new Set(contacts.flatMap((c) => c.tags || []))];
  const preferredMethods = [...new Set(contacts.map((c) => c.preferredContactMethod).filter(Boolean))];

  const lastContactDates = contacts
    .map((c) => c.lastContactDate)
    .filter(Boolean)
    .sort()
    .reverse();
  const followUpDates = contacts
    .map((c) => c.nextFollowUpDate)
    .filter(Boolean)
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingFollowUps = followUpDates.filter((d) => d >= today);

  const notesPreview = contacts
    .map((c) => c.notes?.trim())
    .filter(Boolean)[0] || '';

  const primaryContact = contacts[0] || null;

  return {
    contactCount: contacts.length,
    categories,
    contactTypes,
    tags,
    preferredMethods,
    mostRecentLastContact: lastContactDates[0] || null,
    earliestFollowUp: upcomingFollowUps[0] || followUpDates[0] || null,
    notesPreview,
    primaryContact,
  };
}

export function computeOrganizationStats(contacts) {
  const groups = groupContactsByOrganization(contacts);
  const today = new Date().toISOString().slice(0, 10);

  const withFollowUps = groups.filter((g) =>
    g.contacts.some((c) => c.nextFollowUpDate)
  );

  const donorOrgs = groups.filter((g) =>
    g.contacts.some(
      (c) =>
        c.category === 'Donor / Fundraising' ||
        c.contactType === 'Donor'
    )
  );

  const recentlyUpdated = [...groups]
    .sort((a, b) => {
      const aTime = Math.max(
        ...a.contacts.map((c) => c.updatedAt?.toMillis?.() || c.updatedAt?.seconds * 1000 || 0)
      );
      const bTime = Math.max(
        ...b.contacts.map((c) => c.updatedAt?.toMillis?.() || c.updatedAt?.seconds * 1000 || 0)
      );
      return bTime - aTime;
    })
    .slice(0, 5);

  return {
    total: groups.length,
    withFollowUps: withFollowUps.length,
    donorCount: donorOrgs.length,
    recentlyUpdated,
    groups,
  };
}
