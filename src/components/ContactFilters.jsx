import { useMemo, useState } from 'react';
import {
  CONTACT_TYPES,
  CATEGORIES,
  PREFERRED_CONTACT_METHODS,
  VISIBILITY_OPTIONS,
} from '../services/contactService';
import './ContactFilters.css';

const emptyFilters = {
  contactType: '',
  category: '',
  preferredContactMethod: '',
  visibility: '',
};

export default function ContactFilters({ search, onSearchChange, filters, onFiltersChange }) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(emptyFilters);
  };

  return (
    <div className="contact-filters">
      <div className="filters-top">
        <input
          type="search"
          className="search-input"
          placeholder="Search names, emails, phones, labels, notes…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel card">
          <div className="form-row">
            <div className="form-group">
              <label>Contact Type</label>
              <select
                value={filters.contactType}
                onChange={(e) => handleFilterChange('contactType', e.target.value)}
              >
                <option value="">All types</option>
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Contact Method</label>
              <select
                value={filters.preferredContactMethod}
                onChange={(e) => handleFilterChange('preferredContactMethod', e.target.value)}
              >
                <option value="">All methods</option>
                {PREFERRED_CONTACT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Visibility</label>
              <select
                value={filters.visibility}
                onChange={(e) => handleFilterChange('visibility', e.target.value)}
              >
                <option value="">All visibility</option>
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { emptyFilters };
