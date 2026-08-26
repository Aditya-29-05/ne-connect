import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Radio, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
        }}>
          <Radio size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff' }}>
            NE<span style={{ color: 'var(--accent-cyan)' }}>-CONNECT</span>
          </span>
          <span style={{
            display: 'block',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Logistics Command
          </span>
        </div>
      </Link>

      {/* Action Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '8px 14px' }}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-emerald)',
                boxShadow: '0 0 8px var(--accent-emerald)'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.name}
              </span>
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-danger" style={{ fontSize: '0.875rem', padding: '8px 14px' }}>
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
              <LogIn size={16} />
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '8px 16px' }}>
              <UserPlus size={16} />
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
