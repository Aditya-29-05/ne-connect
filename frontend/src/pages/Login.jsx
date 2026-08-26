import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine redirect destination if navigated from a protected route
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-grid" style={{
      minHeight: 'calc(100vh - 69px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px 32px'
      }}>
        {/* Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            marginBottom: '16px'
          }}>
            <Shield size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Operator Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Access the NE-Connect Command & Logistics Portal
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Operator Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="operator@ne-connect.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ padding: '12px', fontSize: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px'
        }}>
          Need a new operator account?{' '}
          <Link to="/register" style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
            Register Operator
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
