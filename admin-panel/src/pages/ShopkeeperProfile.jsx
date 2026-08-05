import React from 'react';

export default function ShopkeeperProfile() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shop Profile</h1>
          <p className="page-subtitle">Update your store details and business information.</p>
        </div>
        <button className="btn btn-primary">Save Changes</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--surface-hover)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            🏪
          </div>
          <button className="btn btn-outline btn-sm">Change Logo</button>
        </div>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Business Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Shop Name</label>
              <input type="text" placeholder="Enter shop name" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Contact Email</label>
              <input type="email" placeholder="Enter email" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Store Description</label>
              <textarea rows="4" placeholder="Enter store description" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }}></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
