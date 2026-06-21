import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

const DESKTOP_NAV = [
  { to: '/search', label: 'Search' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/add', label: 'Add' },
  { to: '/organizations', label: 'Organizations' },
  { to: '/account', label: 'Account' },
];

export default function AppHeader() {
  const { profile } = useAuth();

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <img
            src={`${import.meta.env.BASE_URL}squadron-logo.svg`}
            alt="TN-170"
            className="header-logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${import.meta.env.BASE_URL}squadron-logo.jpeg`;
            }}
          />
          <div>
            <span className="header-title">Contact Directory</span>
            <span className="header-squadron">Oak Ridge Composite Squadron TN-170</span>
          </div>
        </div>

        <nav className="header-nav header-nav-desktop" aria-label="Main navigation">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-user header-user-desktop">
          <span className="user-name">{profile?.displayName}</span>
          <span className="user-capid">CAPID {profile?.capid}</span>
        </div>
      </div>
    </header>
  );
}
