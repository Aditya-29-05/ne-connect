import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!email.trim()) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please verify your details.');
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
        maxWidth: '480px',
        padding: '36px 32px'
      }}>
        {/* Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
            marginBottom: '16px'
          }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Register Operator</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join the NE-Connect logistics response team
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="e.g. Suresh Das"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="operator@ne-connect.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password (min. 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="reg-confirm-password">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {/* Info note regarding initial role */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)'
          }}>
            <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>Public registrations automatically assign secure <strong>DRIVER / FIELD OPERATOR</strong> access.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ padding: '12px', fontSize: '1rem' }}
          >
            {loading ? 'Registering...' : 'Create Account & Enter'}
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
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
