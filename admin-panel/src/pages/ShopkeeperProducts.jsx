import React from 'react';

export default function ShopkeeperProducts() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Inventory</h1>
          <p className="page-subtitle">Manage your shop's products and pricing.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline">Bulk Import / Export</button>
          <button className="btn btn-primary">+ Add New Product</button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            style={{ 
              padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-dark)', 
              background: 'rgba(0,0,0,0.2)', color: 'white', width: '300px'
            }} 
          />
          <button className="btn btn-accent" style={{ opacity: 0.8 }}>Apply Bulk Action</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-dark)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 16px' }}><input type="checkbox" /></th>
              <th style={{ padding: '12px 16px' }}>Product</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Price</th>
              <th style={{ padding: '12px 16px' }}>Stock</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No products added yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
