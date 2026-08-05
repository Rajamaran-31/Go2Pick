import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { adminAPI } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    adminAPI.getOrders().then(res => {
      if (res.data.orders?.length > 0) setOrders(res.data.orders);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.shop_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { header: 'Order ID', render: (row) => <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{typeof row.id === 'string' ? row.id.slice(-8) : row.id}</span> },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Shop', accessor: 'shop_name' },
    { header: 'Items', render: (row) => row.items_count },
    { header: 'Total', render: (row) => <span style={{ fontWeight: 600 }}>₹{row.total.toLocaleString('en-IN')}</span> },
    { header: 'Pickup', render: (row) => `${row.pickup_date} ${row.pickup_time}` },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">{filtered.length} orders</p>
        </div>
      </div>
      <div className="page-toolbar">
        <input className="search-input" type="text" placeholder="Search by customer or shop..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No orders found" />
    </div>
  );
}
