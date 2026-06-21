import './QuickActionSheet.css';

export default function QuickActionSheet({ open, onClose, onAddContact, onImportContacts }) {
  if (!open) return null;

  return (
    <div className="quick-action-overlay" onClick={onClose}>
      <div
        className="quick-action-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Quick actions"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quick-action-header">
          <h2>Quick Actions</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="quick-action-list">
          <button
            type="button"
            className="quick-action-item"
            onClick={() => {
              onClose();
              onAddContact();
            }}
          >
            <span className="quick-action-icon" aria-hidden="true">👤</span>
            <span>
              <strong>Add Contact</strong>
              <small>Create a new directory entry</small>
            </span>
          </button>
          <button
            type="button"
            className="quick-action-item"
            onClick={() => {
              onClose();
              onImportContacts();
            }}
          >
            <span className="quick-action-icon" aria-hidden="true">📥</span>
            <span>
              <strong>Import Contacts</strong>
              <small>vCard, CSV, or device picker</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
