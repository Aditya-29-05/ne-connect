import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  Radio,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Fleet / Vehicles', path: '/dashboard/vehicles', icon: Truck, badge: 'API Ready' },
    { name: 'Emergency Shipments', path: '/dashboard/shipments', icon: Package, badge: 'API Ready' },
    { name: 'Strategic Routes', path: '/dashboard/routes', icon: MapPin, badge: 'API Ready' },
    { name: 'Active Incidents', path: '/dashboard/incidents', icon: AlertTriangle, badge: 'API Ready' },
    { name: 'Live GPS Telemetry', path: '/dashboard/tracking', icon: Radio, badge: 'API Ready' }
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 69px)'
    }}>
      {/* Navigation section */}
      <div style={{ padding: '24px 16px', flex: 1 }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '14px',
          paddingLeft: '8px'
        }}>
          Operations Command
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.15))' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color="currentColor" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--accent-cyan)',
                    fontWeight: '700'
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile footer in sidebar */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.6)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)'
          }}>
            <User size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.name || 'Operator'}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.email || 'operator@ne-connect.org'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Level:</span>
          <span className={`badge badge-${user?.role?.toLowerCase()}`}>
            <ShieldCheck size={12} />
            {user?.role || 'DRIVER'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-block"
          style={{ fontSize: '0.8rem', padding: '8px 12px' }}
        >
          <LogOut size={14} />
          Sign Out of Command
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
