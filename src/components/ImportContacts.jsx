import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  VISIBILITY_OPTIONS,
  getVisibleContacts,
  importContactsBatch,
} from '../services/contactService';
import {
  annotateImportDuplicates,
  getPrimaryEmailValue,
  getPrimaryPhoneValue,
  isDeviceContactPickerSupported,
  parseCSVFile,
  parseVCardFile,
  pickDeviceContacts,
} from '../utils/importUtils';
import './ImportContacts.css';
import './ContactDetailsModal.css';

const STEPS = {
  METHOD: 'method',
  SOURCE: 'source',
  PREVIEW: 'preview',
  DONE: 'done',
};

const METHODS = {
  VCARD: 'vcard',
  CSV: 'csv',
  DEVICE: 'device',
};

const SHARED_CONFIRM_MESSAGE =
  'You are about to share these contacts with the squadron. Only import contacts you are allowed to share.';

export default function ImportContacts({ open, onClose, onImported }) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(STEPS.METHOD);
  const [method, setMethod] = useState('');
  const [contacts, setContacts] = useState([]);
  const [existingContacts, setExistingContacts] = useState([]);
  const [defaultVisibility, setDefaultVisibility] = useState('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSharedConfirm, setShowSharedConfirm] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const deviceSupported = isDeviceContactPickerSupported();

  const reset = useCallback(() => {
    setStep(STEPS.METHOD);
    setMethod('');
    setContacts([]);
    setDefaultVisibility('private');
    setError('');
    setShowSharedConfirm(false);
    setImportedCount(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
    async function loadExisting() {
      try {
        const visible = await getVisibleContacts(user.uid);
        setExistingContacts(visible);
      } catch {
        setExistingContacts([]);
      }
    }
    if (user) loadExisting();
  }, [open, user, reset]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => c.selected),
    [contacts]
  );

  const hasSharedSelected = useMemo(
    () => selectedContacts.some((c) => c.visibility === 'shared'),
    [selectedContacts]
  );

  const stepLabel = useMemo(() => {
    switch (step) {
      case STEPS.METHOD:
        return 'Step 1: Select import method';
      case STEPS.SOURCE:
        return 'Step 2: Choose file or select contacts';
      case STEPS.PREVIEW:
        return 'Steps 3–7: Preview, select, and confirm import';
      case STEPS.DONE:
        return 'Import complete';
      default:
        return '';
    }
  }, [step]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleMethodSelect = (nextMethod) => {
    setMethod(nextMethod);
    setError('');
    setStep(STEPS.SOURCE);
  };

  const applyParsedContacts = (parsed) => {
    const annotated = annotateImportDuplicates(parsed, existingContacts).map((c) => ({
      ...c,
      visibility: defaultVisibility,
    }));
    setContacts(annotated);
    setStep(STEPS.PREVIEW);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const parsed =
        method === METHODS.VCARD ? await parseVCardFile(file) : await parseCSVFile(file);
      if (!parsed.length) {
        setError('No contacts found in the selected file.');
        return;
      }
      applyParsedContacts(parsed);
    } catch {
      setError('Unable to parse the selected file. Check the format and try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDevicePick = async () => {
    setLoading(true);
    setError('');
    try {
      const parsed = await pickDeviceContacts();
      if (!parsed.length) {
        setError('No contacts were selected.');
        return;
      }
      applyParsedContacts(parsed);
    } catch (err) {
      setError(err.message || 'Unable to access device contacts.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (checked) => {
    setContacts((prev) => prev.map((c) => ({ ...c, selected: checked })));
  };

  const toggleSelect = (importKey) => {
    setContacts((prev) =>
      prev.map((c) => (c.importKey === importKey ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateContact = (importKey, field, value) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.importKey !== importKey) return c;
        const updated = { ...c, [field]: value };
        updated.duplicateWarnings = annotateImportDuplicates([updated], existingContacts)[0]
          .duplicateWarnings;
        return updated;
      })
    );
  };

  const applyDefaultVisibility = (visibility) => {
    setDefaultVisibility(visibility);
    setContacts((prev) => prev.map((c) => ({ ...c, visibility })));
  };

  const performImport = async () => {
    if (!selectedContacts.length) {
      setError('Select at least one contact to import.');
      return;
    }

    const invalid = selectedContacts.find((c) => !c.name.trim());
    if (invalid) {
      setError('Every selected contact must have a name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = selectedContacts.map(({ importKey, selected, duplicateWarnings, ...data }) => ({
        ...data,
        tags: [...new Set([...(data.tags || []), 'imported'])],
        source: data.source || 'import',
      }));

      await importContactsBatch(payload, { uid: user.uid, profile });
      setImportedCount(payload.length);
      setStep(STEPS.DONE);
      onImported?.();
    } catch (err) {
      console.error('Import failed:', err);
      const message =
        err?.code === 'permission-denied'
          ? 'Permission denied. Your account may not be active.'
          : err?.message || 'Import failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
      setShowSharedConfirm(false);
    }
  };

  const handleImportClick = () => {
    if (!selectedContacts.length) {
      setError('Select at least one contact to import.');
      return;
    }
    if (hasSharedSelected) {
      setShowSharedConfirm(true);
      return;
    }
    performImport();
  };

  if (!open) return null;

  return (
    <div className="import-modal-overlay" onClick={handleClose}>
      <div className="import-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <div>
            <h2>Import Contacts</h2>
            <p className="import-step-label">{stepLabel}</p>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="import-modal-body">
          {step === STEPS.METHOD && (
            <div className="import-method-grid">
              <button
                type="button"
                className={`import-method-card ${method === METHODS.VCARD ? 'selected' : ''}`}
                onClick={() => handleMethodSelect(METHODS.VCARD)}
              >
                <h3>vCard (.vcf, .vcard)</h3>
                <p>Import from a vCard file exported from email, phone, or contact apps.</p>
              </button>
              <button
                type="button"
                className={`import-method-card ${method === METHODS.CSV ? 'selected' : ''}`}
                onClick={() => handleMethodSelect(METHODS.CSV)}
              >
                <h3>CSV (.csv)</h3>
                <p>Import from a spreadsheet with auto-detected column names.</p>
              </button>
              <button
                type="button"
                className={`import-method-card ${method === METHODS.DEVICE ? 'selected' : ''}`}
                onClick={() => deviceSupported && handleMethodSelect(METHODS.DEVICE)}
                disabled={!deviceSupported}
              >
                <h3>Device Contact Picker</h3>
                <p>
                  {deviceSupported
                    ? 'Pick contacts directly from this device (name, email, phone, address only).'
                    : 'Not supported in this browser. Try Chrome on Android or supported mobile browsers.'}
                </p>
              </button>
            </div>
          )}

          {step === STEPS.SOURCE && (
            <div className="import-source-panel">
              {method === METHODS.VCARD && (
                <div className="import-dropzone">
                  <p>Select a .vcf or .vcard file to parse contacts.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.vcard,text/vcard,text/x-vcard"
                    className="import-file-input"
                    id="import-vcard-file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="import-vcard-file" className="btn btn-primary">
                    Choose vCard File
                  </label>
                </div>
              )}

              {method === METHODS.CSV && (
                <div className="import-dropzone">
                  <p>Select a .csv file. Common column names (Name, Email, Phone, Organization, etc.) are detected automatically.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="import-file-input"
                    id="import-csv-file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="import-csv-file" className="btn btn-primary">
                    Choose CSV File
                  </label>
                </div>
              )}

              {method === METHODS.DEVICE && (
                <>
                  {deviceSupported ? (
                    <div className="import-dropzone">
                      <p>
                        Opens your device contact picker. Only name, email, phone, and address are
                        requested — no photos or background access.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleDevicePick}
                        disabled={loading}
                      >
                        Select Device Contacts
                      </button>
                    </div>
                  ) : (
                    <p className="import-unsupported-note">
                      Device contact picker is not available in this browser. Use vCard or CSV import
                      instead, or try a supported mobile browser (Contact Picker API).
                    </p>
                  )}
                </>
              )}

              {loading && <p className="empty-message">Parsing contacts…</p>}
            </div>
          )}

          {step === STEPS.PREVIEW && (
            <>
              <div className="import-preview-toolbar">
                <span className="selection-info">
                  {selectedContacts.length} of {contacts.length} selected
                </span>
                <label className="import-select-all">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && contacts.every((c) => c.selected)}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all contacts"
                  />
                  Select all
                </label>
                <div className="import-default-visibility">
                  <label htmlFor="default-visibility">Default visibility:</label>
                  <select
                    id="default-visibility"
                    value={defaultVisibility}
                    onChange={(e) => applyDefaultVisibility(e.target.value)}
                  >
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showSharedConfirm && (
                <div className="import-confirm-dialog">
                  <p>{SHARED_CONFIRM_MESSAGE}</p>
                  <div className="form-actions" style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={performImport}
                      disabled={loading}
                    >
                      Confirm Shared Import
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowSharedConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="import-preview-cards">
                {contacts.map((contact) => (
                  <div
                    key={contact.importKey}
                    className={`import-preview-card card ${contact.selected ? 'selected' : ''}`}
                  >
                    <label className="import-card-check">
                      <input
                        type="checkbox"
                        checked={Boolean(contact.selected)}
                        onChange={() => toggleSelect(contact.importKey)}
                        aria-label={`Select ${contact.name || 'contact'}`}
                      />
                      <span className="import-card-name">{contact.name || 'Unnamed'}</span>
                    </label>
                    {contact.organization && (
                      <p className="import-card-org">{contact.organization}</p>
                    )}
                    <p className="import-card-meta">
                      {getPrimaryPhoneValue(contact) || '—'} · {getPrimaryEmailValue(contact) || '—'}
                    </p>
                    <div className="import-card-fields">
                      <input
                        value={contact.name}
                        placeholder="Name"
                        onChange={(e) => updateContact(contact.importKey, 'name', e.target.value)}
                      />
                      <input
                        value={contact.organization}
                        placeholder="Organization"
                        onChange={(e) =>
                          updateContact(contact.importKey, 'organization', e.target.value)
                        }
                      />
                      <select
                        value={contact.visibility}
                        onChange={(e) =>
                          updateContact(contact.importKey, 'visibility', e.target.value)
                        }
                      >
                        {VISIBILITY_OPTIONS.map((v) => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    {contact.duplicateWarnings?.length > 0 && (
                      <p className="import-duplicate">Possible duplicate</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === STEPS.DONE && (
            <div className="import-success-panel">
              <h3>Import successful</h3>
              <p>
                {importedCount} contact{importedCount === 1 ? '' : 's'} imported to your account.
              </p>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="import-modal-footer">
          <div>
            {step !== STEPS.METHOD && step !== STEPS.DONE && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (step === STEPS.PREVIEW) setStep(STEPS.SOURCE);
                  else if (step === STEPS.SOURCE) setStep(STEPS.METHOD);
                }}
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>
          <div className="footer-actions">
            {step === STEPS.PREVIEW && !showSharedConfirm && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImportClick}
                disabled={loading || !selectedContacts.length}
              >
                {loading ? 'Importing…' : `Import Selected (${selectedContacts.length})`}
              </button>
            )}
            {step === STEPS.DONE && (
              <button type="button" className="btn btn-primary" onClick={handleClose}>
                Done
              </button>
            )}
            {step !== STEPS.DONE && (
              <button type="button" className="btn btn-outline btn-sm" onClick={handleClose}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImportContactsButton({ onClick, className = 'btn btn-secondary btn-sm' }) {
  return (
    <button type="button" className={className} onClick={onClick}>
      Import
    </button>
  );
}
