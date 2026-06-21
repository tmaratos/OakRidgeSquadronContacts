import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import PasswordChange from './components/PasswordChange';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import MobileNav from './components/MobileNav';
import SearchScreen from './components/SearchScreen';
import Contacts from './components/Contacts';
import AddContact from './components/AddContact';
import Organizations from './components/Organizations';
import Account from './components/Account';
import './components/Login.css';

function PublicShell({ children }) {
  return (
    <div className="public-shell">
      {children}
      <AppFooter />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="loading-screen">
        <p>Unable to load your profile. Firestore may be unavailable.</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Try refreshing, or sign out and sign in again.
        </p>
      </div>
    );
  }

  if (!profile.isActive) {
    return (
      <div className="loading-screen">
        Your account is not active. Please contact squadron leadership.
      </div>
    );
  }

  if (profile.mustChangePassword) {
    return (
      <PublicShell>
        <PasswordChange />
      </PublicShell>
    );
  }

  return (
    <div className="app-layout">
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/add" element={<AddContact />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/account" element={<Account />} />
          <Route path="/password-change" element={<PasswordChange />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </main>
      <AppFooter />
      <MobileNav />
    </div>
  );
}

function LoginRoute() {
  const { user, profile, loading } = useAuth();
  const [showForgot, setShowForgot] = useState(false);

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (user && profile?.isActive && !profile?.mustChangePassword) {
    return <Navigate to="/search" replace />;
  }

  if (user && profile?.mustChangePassword) {
    return (
      <PublicShell>
        <PasswordChange />
      </PublicShell>
    );
  }

  if (showForgot) {
    return (
      <PublicShell>
        <ForgotPasswordForm onBack={() => setShowForgot(false)} />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <Login onForgotPassword={() => setShowForgot(true)} />
    </PublicShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
