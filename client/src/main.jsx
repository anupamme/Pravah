import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Runtime Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#050B14', color: '#F8FAFC', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ color: '#38BDF8', fontSize: '1.5rem', marginBottom: '1rem' }}>Pravah Platform Recovery</h1>
          <p style={{ color: 'rgba(248, 250, 252, 0.7)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '500px', textAlign: 'center' }}>
            An interface component encountered an error during render. Click below to reload.
          </p>
          <pre style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#EF4444', maxWidth: '600px', overflowX: 'auto', marginBottom: '1.5rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#38BDF8', color: '#050B14', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Reload Platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
