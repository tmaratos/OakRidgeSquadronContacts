import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import PasswordChange from './components/PasswordChange';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import Dashboard from './components/Dashboard';
import MyContacts from './components/MyContacts';
import SharedContacts from './components/SharedContacts';
import Organizations from './components/Organizations';
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

  if (!profile?.isActive) {
    return (
      <div className="loading-screen">
        Your account is not active. Please contact squadron leadership.
      </div>
    );
  }

  if (profile?.mustChangePassword) {
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-contacts" element={<MyContacts />} />
          <Route path="/shared-contacts" element={<SharedContacts />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AppFooter />
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
    return <Navigate to="/" replace />;
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
