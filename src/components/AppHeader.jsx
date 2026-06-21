import { NavLink } from 'react-router-dom';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './AppHeader.css';

export default function AppHeader() {
  const { profile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

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

        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Dashboard
          </NavLink>
          <NavLink to="/my-contacts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            My Contacts
          </NavLink>
          <NavLink to="/shared-contacts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Shared Contacts
          </NavLink>
          <NavLink to="/organizations" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Organizations
          </NavLink>
        </nav>

        <div className="header-user">
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
