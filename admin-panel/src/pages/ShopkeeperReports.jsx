import React from 'react';

export default function ShopkeeperReports() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Analyze your shop's performance and revenue.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
          <button className="btn btn-primary">Export CSV</button>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: '24px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3>Revenue Chart Generation</h3>
          <p>Interactive chart data will render here.</p>
        </div>
      </div>
    </div>
  );
}
