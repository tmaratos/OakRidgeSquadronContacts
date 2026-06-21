import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { auth, firebaseInitError } from './firebase';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading-screen" role="alert">
          <h1>Something went wrong</h1>
          <p>The contact directory could not load. Please refresh the page or try again later.</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function ConfigError({ message }) {
  return (
    <div className="loading-screen" role="alert">
      <h1>Configuration Error</h1>
      <p>Unable to connect to Firebase. The app cannot start without a valid configuration.</p>
      {message && <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{message}</p>}
    </div>
  );
}

function Root() {
  if (firebaseInitError || !auth) {
    return <ConfigError message={firebaseInitError} />;
  }

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
