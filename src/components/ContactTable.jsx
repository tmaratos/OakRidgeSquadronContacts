import {
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactTable.css';

export default function ContactTable({ contacts, onView, onEdit, onDelete, showOwner, canEdit }) {
  if (!contacts.length) {
    return <p className="empty-message">No contacts found.</p>;
  }

  return (
    <div className="contact-table-wrap">
      <table className="contact-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Primary Email</th>
            <th>Primary Phone</th>
            <th>Preferred</th>
            <th>Type</th>
            <th>Visibility</th>
            {showOwner && <th>Owner</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const primaryEmail = getPrimaryEmail(contact);
            const primaryPhone = getPrimaryPhone(contact);
            return (
              <tr key={contact.id}>
                <td>
                  <button type="button" className="link-btn" onClick={() => onView(contact)}>
                    {contact.name}
                  </button>
                </td>
                <td>{contact.organization || '—'}</td>
                <td>{primaryEmail?.value || '—'}</td>
                <td>{primaryPhone?.value || '—'}</td>
                <td>{getPreferredMethodLabel(contact.preferredContactMethod)}</td>
                <td>{contact.contactType}</td>
                <td>
                  <span className={`badge badge-${contact.visibility}`}>
                    {contact.visibility}
                  </span>
                </td>
                {showOwner && <td>{contact.ownerDisplayName || '—'}</td>}
                <td className="actions-cell">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(contact)}>
                    View
                  </button>
                  {onEdit && (!canEdit || canEdit(contact)) && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(contact)}>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(contact)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
