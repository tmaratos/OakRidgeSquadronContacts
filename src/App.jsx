import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import PasswordChange from './components/PasswordChange';
import AppHeader from './components/AppHeader';
import Dashboard from './components/Dashboard';
import MyContacts from './components/MyContacts';
import SharedContacts from './components/SharedContacts';
import './components/Login.css';

function ForgotPasswordModal({ onClose }) {
  return (
    <div className="forgot-modal-overlay" onClick={onClose}>
      <div className="forgot-modal card" onClick={(e) => e.stopPropagation()}>
        <h2>Forgot Password</h2>
        <p>
          Password resets are handled outside this contact directory. Please contact
          squadron leadership if you need your password reset.
        </p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
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

  return (
    <>
      <Login onForgotPassword={() => setShowForgot(true)} />
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
