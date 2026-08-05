import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalShops: 0, pendingApplications: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => {
        if (res.data?.success) setStats(res.data);
      })
      .catch(err => console.error("Failed to fetch dashboard:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Dashboard</h1>
          <p className="page-subtitle">Platform overview and key metrics across all shops.</p>
        </div>
      </div>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Total Platform Revenue</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Active Shops</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : stats.totalShops}</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Pending Approvals</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : stats.pendingApplications}</div>
        </div>
      </div>
    </div>
  );
}
