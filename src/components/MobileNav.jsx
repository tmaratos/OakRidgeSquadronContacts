import { NavLink } from 'react-router-dom';
import './MobileNav.css';

const TABS = [
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/contacts', label: 'Contacts', icon: '👥' },
  { to: '/add', label: 'Add', icon: '➕' },
  { to: '/organizations', label: 'Orgs', icon: '🏢' },
  { to: '/account', label: 'Account', icon: '⚙️' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon" aria-hidden="true">{tab.icon}</span>
          <span className="mobile-nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
