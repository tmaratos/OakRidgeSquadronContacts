import { useCallback, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import PasswordChange from './components/PasswordChange';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import MobileNav from './components/MobileNav';
import Directory from './components/Directory';
import Account from './components/Account';
import FloatingActionButton from './components/FloatingActionButton';
import QuickActionSheet from './components/QuickActionSheet';
import ContactFormSheet from './components/ContactFormSheet';
import ImportContacts from './components/ImportContacts';
import { createContact } from './services/contactService';
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
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const refreshDirectoryRef = useRef(null);

  const handleDirectoryRefresh = useCallback((refreshFn) => {
    refreshDirectoryRef.current = refreshFn;
  }, []);

  const handleCreateContact = async (formData) => {
    await createContact(formData, { uid: user.uid, profile });
    setShowAddContact(false);
    await refreshDirectoryRef.current?.();
  };

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
          <Route path="/" element={<Navigate to="/directory" replace />} />
          <Route
            path="/directory"
            element={<Directory onContactsChanged={handleDirectoryRefresh} />}
          />
          <Route path="/account" element={<Account />} />
          <Route path="/password-change" element={<PasswordChange />} />
          <Route path="*" element={<Navigate to="/directory" replace />} />
        </Routes>
      </main>
      <AppFooter />
      <MobileNav />
      <FloatingActionButton onClick={() => setQuickActionsOpen(true)} />
      <QuickActionSheet
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onAddContact={() => setShowAddContact(true)}
        onImportContacts={() => setShowImport(true)}
      />
      {showAddContact && (
        <ContactFormSheet
          title="Add Contact"
          onSubmit={handleCreateContact}
          onClose={() => setShowAddContact(false)}
          submitLabel="Create Contact"
        />
      )}
      <ImportContacts
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => refreshDirectoryRef.current?.()}
      />
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
    return <Navigate to="/directory" replace />;
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
