import ContactForm from './ContactForm';
import './ContactFormSheet.css';

export default function ContactFormSheet({
  title = 'New Contact',
  initialData,
  onSubmit,
  onClose,
  submitLabel,
}) {
  return (
    <div className="contact-form-sheet-overlay" onClick={onClose}>
      <div
        className="contact-form-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contact-form-sheet-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ContactForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          embedded
        />
      </div>
    </div>
  );
}
