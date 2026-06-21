import './GlobalSearchBar.css';

export default function GlobalSearchBar({ value, onChange, className = '' }) {
  return (
    <input
      type="search"
      className={`global-search-input ${className}`.trim()}
      placeholder="Search contacts, organizations, phone numbers, emails, notes, tags..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search contacts"
    />
  );
}
