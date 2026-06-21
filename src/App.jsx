import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import PasswordChange from './components/PasswordChange';
import AppHeader from './components/AppHeader';
import Dashboard from './components/Dashboard';
import MyContacts from './components/MyContacts';
import SharedContacts from './components/SharedContacts';
import Organizations from './components/Organizations';
import './components/Login.css';

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
    return <PasswordChange />;
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
    return <PasswordChange />;
  }

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;
  }

  return <Login onForgotPassword={() => setShowForgot(true)} />;
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
