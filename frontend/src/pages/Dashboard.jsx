import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', timestamp: null });

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.health();
        if (isMounted && res.success) {
          setBackendHealth({ status: 'online', timestamp: res.timestamp });
        }
      } catch (err) {
        if (isMounted) {
          setBackendHealth({ status: 'offline', error: err.message });
        }
      }
    };
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  const modules = [
    {
      id: 'vehicles',
      title: 'Vehicle Fleet Management',
      icon: Truck,
      color: '#3b82f6',
      badge: 'CRUD Active',
      description: 'Fleet registry, 4x4s, heavy transport, river boats, medical ambulances, and status dispatch.',
      endpoints: ['POST /api/vehicles', 'GET /api/vehicles', 'PUT /api/vehicles/:id', 'DELETE /api/vehicles/:id']
    },
    {
      id: 'shipments',
      title: 'Emergency Relief Shipments',
      icon: Package,
      color: '#06b6d4',
      badge: 'CRUD Active',
      description: 'Critical cargo allocation (medicine, rations, water, rescue equipment) with priority routing.',
      endpoints: ['POST /api/shipments', 'GET /api/shipments', 'PUT /api/shipments/:id', 'DELETE /api/shipments/:id']
    },
    {
      id: 'routes',
      title: 'Strategic Transit Corridors',
      icon: MapPin,
      color: '#f59e0b',
      badge: 'GeoJSON 2dsphere',
      description: 'Geospatial LineString road networks, accessibility parameters, and dynamic risk scoring.',
      endpoints: ['POST /api/routes', 'GET /api/routes', 'PUT /api/routes/:id', 'DELETE /api/routes/:id']
    },
    {
      id: 'incidents',
      title: 'Incident & Disaster Alerts',
      icon: AlertTriangle,
      color: '#f43f5e',
      badge: 'Spatial Index',
      description: 'Early warning for landslides, flood inundation, road blockages, and affected radius analysis.',
      endpoints: ['POST /api/incidents', 'GET /api/incidents', 'PUT /api/incidents/:id', 'DELETE /api/incidents/:id']
    },
    {
      id: 'tracking',
      title: 'Vehicle Telemetry & GPS',
      icon: Radio,
      color: '#10b981',
      badge: 'Live Stream Ready',
      description: 'Real-time telemetry ingestion, speed/heading tracking, and chronological trip history.',
      endpoints: ['POST /api/vehicles/:id/location', 'GET /api/vehicles/:id/location-history']
    }
  ];

  return (
    <div className="app-container">
      {/* Reusable Sidebar Navigation */}
      <Sidebar />

      {/* Main Command Center Body */}
      <main className="main-content">
        <div className="page-body">
          
          {/* Welcome Banner */}
          <div className="glass-card" style={{
            padding: '28px 32px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>
                  Welcome back, {user?.name || 'Operator'}
                </h1>
                <span className={`badge badge-${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                NE-Connect Command Center is active. All backend REST modules are secured and authenticated via JWT.
              </p>
            </div>

            {/* Live System Health Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 18px',
              background: 'rgba(11, 15, 25, 0.7)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: backendHealth.status === 'online' ? 'var(--accent-emerald)' : '#f59e0b',
                boxShadow: backendHealth.status === 'online' ? '0 0 10px var(--accent-emerald)' : 'none'
              }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>
                  Backend Express API
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {backendHealth.status === 'online' ? 'Connected (HTTP 200 OK)' : 'Checking status...'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Active Session</span>
                <ShieldCheck size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                {user?.role} Access
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                ● JWT Authenticated
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Database Service</span>
                <Database size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                MongoDB Atlas
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                ● 5 Core Collections Online
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Geo-Spatial Engine</span>
                <Compass size={18} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                2dsphere Ready
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '4px' }}>
                ● WGS-84 Coordinates Order
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Current Sprint</span>
                <Activity size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                NEC-13
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginTop: '4px' }}>
                ● Frontend Foundation
              </div>
            </div>
          </div>

          {/* Core Modules Grid */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '16px', fontWeight: '700' }}>
              Core Logistics Modules
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: `${m.color}20`,
                        border: `1px solid ${m.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: m.color
                      }}>
                        <Icon size={22} />
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}>
                        {m.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{m.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '18px', flex: 1 }}>
                      {m.description}
                    </p>

                    {/* Endpoints pill list */}
                    <div style={{
                      background: 'rgba(11, 15, 25, 0.5)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Registered Endpoints:
                      </div>
                      {m.endpoints.map((ep, idx) => (
                        <div key={idx} style={{ color: 'var(--accent-cyan)' }}>
                          • {ep}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
