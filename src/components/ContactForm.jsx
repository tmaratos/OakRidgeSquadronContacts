import { useState } from 'react';
import {
  CONTACT_TYPES,
  CATEGORIES,
  EMAIL_LABELS,
  PHONE_LABELS,
  PREFERRED_CONTACT_METHODS,
  VISIBILITY_OPTIONS,
  STATUS_OPTIONS,
  emptyContact,
  setPrimaryEmail,
  setPrimaryPhone,
} from '../services/contactService';
import './ContactForm.css';

function defaultEmails(initialData) {
  if (initialData?.emails?.length) return initialData.emails;
  return [{ label: 'Primary', value: '', isPrimary: true }];
}

function defaultPhones(initialData) {
  if (initialData?.phones?.length) return initialData.phones;
  return [{ label: 'Mobile', value: '', isPrimary: true }];
}

export default function ContactForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Contact',
  embedded = false,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyContact(),
    ...initialData,
    emails: defaultEmails(initialData),
    phones: defaultPhones(initialData),
    tags: initialData?.tags || [],
  }));
  const [moreOpen, setMoreOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addEmail = () => {
    setForm((prev) => ({
      ...prev,
      emails: [...prev.emails, { label: 'Primary', value: '', isPrimary: false }],
    }));
  };

  const updateEmail = (index, field, value) => {
    setForm((prev) => {
      const emails = [...prev.emails];
      emails[index] = { ...emails[index], [field]: value };
      return { ...prev, emails };
    });
  };

  const removeEmail = (index) => {
    setForm((prev) => {
      const emails = prev.emails.filter((_, i) => i !== index);
      if (emails.length && !emails.some((e) => e.isPrimary)) emails[0].isPrimary = true;
      return { ...prev, emails };
    });
  };

  const markPrimaryEmail = (index) => {
    setForm((prev) => ({ ...prev, emails: setPrimaryEmail(prev.emails, index) }));
  };

  const addPhone = () => {
    setForm((prev) => ({
      ...prev,
      phones: [...prev.phones, { label: 'Mobile', value: '', isPrimary: false }],
    }));
  };

  const updatePhone = (index, field, value) => {
    setForm((prev) => {
      const phones = [...prev.phones];
      phones[index] = { ...phones[index], [field]: value };
      return { ...prev, phones };
    });
  };

  const removePhone = (index) => {
    setForm((prev) => {
      const phones = prev.phones.filter((_, i) => i !== index);
      if (phones.length && !phones.some((p) => p.isPrimary)) phones[0].isPrimary = true;
      return { ...prev, phones };
    });
  };

  const markPrimaryPhone = (index) => {
    setForm((prev) => ({ ...prev, phones: setPrimaryPhone(prev.phones, index) }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    setForm((prev) => ({
      ...prev,
      tags: [...new Set([...(prev.tags || []), tag])],
    }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      console.error('Contact save failed:', err);
      const message =
        err?.code === 'permission-denied'
          ? 'Permission denied. Your account may not be active.'
          : err?.message || 'Unable to save contact. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`contact-form ${embedded ? 'contact-form-embedded' : 'card'}`} onSubmit={handleSubmit}>
      {!embedded && <h2>{initialData?.id ? 'Edit Contact' : 'New Contact'}</h2>}

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
      </div>

      <div className="form-group organization-field">
        <label htmlFor="organization">Organization</label>
        <input
          id="organization"
          value={form.organization}
          onChange={(e) => updateField('organization', e.target.value)}
          placeholder="Company, agency, school, etc."
        />
      </div>

      <div className="array-section compact">
        <h4>Phone</h4>
        {form.phones.map((phone, index) => (
          <div key={index} className="array-row">
            {form.phones.length > 1 && (
              <button
                type="button"
                className={`star-btn ${phone.isPrimary ? 'active' : ''}`}
                onClick={() => markPrimaryPhone(index)}
                title="Primary phone"
                aria-label="Set as primary phone"
              >
                ★
              </button>
            )}
            <select value={phone.label} onChange={(e) => updatePhone(index, 'label', e.target.value)}>
              {PHONE_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone.value}
              onChange={(e) => updatePhone(index, 'value', e.target.value)}
            />
            {form.phones.length > 1 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removePhone(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-link" onClick={addPhone}>+ Add another phone</button>
      </div>

      <div className="array-section compact">
        <h4>Email</h4>
        {form.emails.map((email, index) => (
          <div key={index} className="array-row">
            {form.emails.length > 1 && (
              <button
                type="button"
                className={`star-btn ${email.isPrimary ? 'active' : ''}`}
                onClick={() => markPrimaryEmail(index)}
                title="Primary email"
                aria-label="Set as primary email"
              >
                ★
              </button>
            )}
            <select value={email.label} onChange={(e) => updateEmail(index, 'label', e.target.value)}>
              {EMAIL_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <input
              type="email"
              placeholder="Email address"
              value={email.value}
              onChange={(e) => updateEmail(index, 'value', e.target.value)}
            />
            {form.emails.length > 1 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeEmail(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-link" onClick={addEmail}>+ Add another email</button>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select id="category" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="visibility">Visibility</label>
        <select id="visibility" value={form.visibility} onChange={(e) => updateField('visibility', e.target.value)}>
          {VISIBILITY_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="preferredContactMethod">Preferred Method</label>
        <select
          id="preferredContactMethod"
          value={form.preferredContactMethod}
          onChange={(e) => updateField('preferredContactMethod', e.target.value)}
        >
          {PREFERRED_CONTACT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="form-section collapsible">
        <button
          type="button"
          className="form-section-toggle"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
        >
          More Details {moreOpen ? '−' : '+'}
        </button>

        {moreOpen && (
          <div className="more-options">
            <div className="form-group">
              <label htmlFor="title">Title / Role</label>
              <input id="title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="contactType">Contact Type</label>
              <select id="contactType" value={form.contactType} onChange={(e) => updateField('contactType', e.target.value)}>
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input id="website" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input id="address" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input id="city" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input id="state" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="zip">ZIP</label>
                <input id="zip" value={form.zip} onChange={(e) => updateField('zip', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <div className="tag-input-row">
                <input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                  Add Tag
                </button>
              </div>
              {form.tags?.length > 0 && (
                <div className="tag-list">
                  {form.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" rows={3} value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="relationshipOwner">Relationship Owner</label>
                <input id="relationshipOwner" value={form.relationshipOwner} onChange={(e) => updateField('relationshipOwner', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="source">Source</label>
                <input id="source" value={form.source} onChange={(e) => updateField('source', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lastContactDate">Last Contact Date</label>
                <input id="lastContactDate" type="date" value={form.lastContactDate} onChange={(e) => updateField('lastContactDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="nextFollowUpDate">Next Follow-Up Date</label>
                <input id="nextFollowUpDate" type="date" value={form.nextFollowUpDate} onChange={(e) => updateField('nextFollowUpDate', e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
