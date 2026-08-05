import React from 'react';

export default function ShopDetails() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shop Details</h1>
          <p className="page-subtitle">View deep analytics and configuration for a specific shop.</p>
        </div>
        <button className="btn btn-danger">Suspend Shop</button>
      </div>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Performance Overview</h2>
        <div style={{ height: '200px', border: '1px dashed var(--border-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Detailed Metrics view goes here
        </div>
      </div>
    </div>
  );
}
