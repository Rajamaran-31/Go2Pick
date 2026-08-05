import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { adminAPI } from '../services/api';
import './Requests.css';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminAPI.getShopkeeperRequests().then(res => {
      const data = res.data?.applications || res.data;
      if (Array.isArray(data) && data.length > 0) setRequests(data);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const handleApprove = async (id) => {
    try { await adminAPI.approveRequest(id); } catch {}
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setSelectedRequest(null);
  };

  const handleReject = async (id) => {
    try { await adminAPI.rejectRequest(id); } catch {}
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setSelectedRequest(null);
  };

  const filtered = requests.filter(r => !filter || r.status === filter);

  const columns = [
    { header: 'Owner', render: (row) => <span style={{ fontWeight: 600 }}>{row.ownerName || row.owner_name}</span> },
    { header: 'Shop Name', render: (row) => <span>{row.shopName || row.shop_name}</span> },
    { header: 'Category', accessor: 'category' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Date', render: (row) => new Date(row.submittedAt || row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-outline" onClick={() => setSelectedRequest(row)}>View</button>
          {row.status === 'pending' && (
            <>
              <button className="btn btn-sm btn-primary" onClick={() => handleApprove(row.id)}>Approve</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleReject(row.id)}>Reject</button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Shopkeeper Requests</h2>
          <p className="page-subtitle">{requests.filter(r => r.status === 'pending').length} pending requests</p>
        </div>
      </div>
      <div className="page-toolbar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No requests found" />

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        footer={
          selectedRequest?.status === 'pending' && (
            <>
              <button className="btn btn-danger" onClick={() => handleReject(selectedRequest.id)}>Reject</button>
              <button className="btn btn-primary" onClick={() => handleApprove(selectedRequest.id)}>Approve</button>
            </>
          )
        }
      >
        {selectedRequest && (
          <div className="request-details">
            <div className="detail-row"><span className="detail-label">Owner Name</span><span>{selectedRequest.ownerName || selectedRequest.owner_name}</span></div>
            <div className="detail-row"><span className="detail-label">Shop Name</span><span>{selectedRequest.shopName || selectedRequest.shop_name}</span></div>
            <div className="detail-row"><span className="detail-label">Category</span><span>{selectedRequest.category}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span>{selectedRequest.phone}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span>{selectedRequest.email}</span></div>
            <div className="detail-row"><span className="detail-label">Address</span><span>{selectedRequest.address}</span></div>
            <div className="detail-row"><span className="detail-label">Description</span><span>{selectedRequest.description || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={selectedRequest.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
