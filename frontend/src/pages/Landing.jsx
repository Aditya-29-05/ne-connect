import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="bg-grid" style={{ minHeight: 'calc(100vh - 69px)', padding: '60px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent-cyan)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            <Radio size={16} />
            <span>NORTH EAST EMERGENCY LOGISTICS & TELEMETRY PLATFORM</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            lineHeight: 1.15,
            marginBottom: '20px',
            fontWeight: '800'
          }}>
            Intelligent Transit & Disaster <br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Relief Coordination Command
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}>
            Unified operations platform built for high-stakes emergency supply chain management, real-time GPS fleet tracking, incident rerouting, and rugged transit dispatching across North East India.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Create Operator Account
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Sign In to Command
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '16px'
            }}>
              <Truck size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Emergency Fleet Dispatch</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Manage heavy 4x4s, medical ambulances, helicopters, and river boats with real-time status and telemetry tracking.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: '16px'
            }}>
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Critical Shipments</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Priority-based dispatching of anti-venom, emergency rations, and search-and-rescue equipment to remote facilities.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              marginBottom: '16px'
            }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Strategic Corridors</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              GeoJSON-mapped highway routes and mountain passes with real-time accessibility and risk-level monitoring.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Disruption Early Warning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Spatial incident tracking for landslides, flash floods, and bridge closures with automatic reroute alerts.
            </p>
          </div>
        </div>

        {/* Security & Architecture Badge */}
        <div className="glass-card" style={{
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>Enterprise Role-Based Access Control</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Secured by JWT tokens, bcrypt cryptography, and strict MongoDB schema enforcement.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-admin">ADMIN</span>
            <span className="badge badge-dispatcher">DISPATCHER</span>
            <span className="badge badge-driver">DRIVER</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;
