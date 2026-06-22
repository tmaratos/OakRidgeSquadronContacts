import { Component } from 'react';

export default class ErrorBoundary extends Component {
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

  handleReload = () => {
    window.location.reload();
  };

  handleBackToLogin = () => {
    window.location.hash = '#/login';
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="loading-screen error-boundary"
          role="alert"
          style={{ background: 'var(--bg-dark, #0f1c2e)' }}
        >
          <h1>Something went wrong</h1>
          <p>The contact directory hit an unexpected error.</p>
          <p className="error-boundary-detail">{this.state.error.message}</p>
          <div className="error-boundary-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload
            </button>
            <button type="button" className="btn btn-secondary" onClick={this.handleBackToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
