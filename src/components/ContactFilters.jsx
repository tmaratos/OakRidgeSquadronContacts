import { useMemo, useState } from 'react';
import {
  CONTACT_TYPES,
  CATEGORIES,
  PREFERRED_CONTACT_METHODS,
  VISIBILITY_OPTIONS,
  STATUS_OPTIONS,
} from '../services/contactService';
import GlobalSearchBar from './GlobalSearchBar';
import './ContactFilters.css';

const emptyFilters = {
  contactType: '',
  category: '',
  preferredContactMethod: '',
  visibility: '',
  status: '',
  organization: '',
};

export default function ContactFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  organizations = [],
  showVisibilityFilter = true,
}) {
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
      <GlobalSearchBar value={search} onChange={onSearchChange} />

      <div className="filters-top">
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
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Organization</label>
              <select
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
              >
                <option value="">All organizations</option>
                {organizations.map((org) => (
                  <option key={org.key} value={org.key}>{org.displayName}</option>
                ))}
              </select>
            </div>

            {showVisibilityFilter && (
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
            )}
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
