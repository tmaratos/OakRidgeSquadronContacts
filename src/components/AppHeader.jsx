import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

export default function AppHeader() {
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const closeMenu = () => setMenuOpen(false);

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

        <button
          type="button"
          className="header-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="menu-bar" aria-hidden="true" />
          <span className="menu-bar" aria-hidden="true" />
          <span className="menu-bar" aria-hidden="true" />
        </button>

        <nav
          id="main-nav"
          className={`header-nav ${menuOpen ? 'open' : ''}`}
          aria-label="Main navigation"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/my-contacts"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            My Contacts
          </NavLink>
          <NavLink
            to="/shared-contacts"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Shared Contacts
          </NavLink>
          <NavLink
            to="/organizations"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={closeMenu}
          >
            Organizations
          </NavLink>

          <div className="header-user header-user-mobile">
            <span className="user-name">{profile?.displayName}</span>
            <span className="user-capid">CAPID {profile?.capid}</span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </nav>

        <div className="header-user header-user-desktop">
          <span className="user-name">{profile?.displayName}</span>
          <span className="user-capid">CAPID {profile?.capid}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
