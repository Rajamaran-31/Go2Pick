import React from 'react';

export default function ShopReviewDetail() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shop Review Moderation</h1>
          <p className="page-subtitle">Inspect flagged or pending shop reviews.</p>
        </div>
      </div>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ borderLeft: '4px solid var(--warning)', paddingLeft: '16px', marginBottom: '24px' }}>
          <h4>Flagged by automated system (Profanity)</h4>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>"This shop is absolutely *** terrible..."</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-danger">Delete Review</button>
          <button className="btn btn-outline">Approve Anyway</button>
        </div>
      </div>
    </div>
  );
}
