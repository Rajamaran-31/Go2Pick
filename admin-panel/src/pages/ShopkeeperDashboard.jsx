import React, { useState, useEffect } from 'react';
import { shopkeeperAPI } from '../services/api';

export default function ShopkeeperDashboard() {
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, pendingOrders: 0, totalProducts: 0, recentOrders: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    shopkeeperAPI.getDashboard()
      .then(res => {
        if (res.data) setStats(res.data);
      })
      .catch(err => console.error("Failed to fetch shopkeeper dashboard:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopkeeper Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here is what is happening with your shop today.</p>
        </div>
        <button className="btn btn-primary">Download Report</button>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Total Revenue</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : `₹${(stats.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Active Orders</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : stats.totalOrders || 0}</div>
          <div style={{ color: 'var(--warning)', fontSize: '14px', marginTop: '8px' }}>{stats.pendingOrders || 0} pending fulfillment</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Products</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{isLoading ? '...' : stats.totalProducts || 0}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(stats.recentOrders || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No recent orders yet.</div>
          ) : (
            stats.recentOrders.map(order => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>Order #{typeof order.id === 'string' ? order.id.slice(-4) : order.id}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{order.items_count || 0} items • ₹{(order.total || 0).toLocaleString('en-IN')}</div>
                </div>
                <span className="badge badge-info">{order.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
