import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { adminAPI } from '../services/api';
import './Customers.css';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getUsers({ role: 'customer' }).then(res => {
      if (res.data.users?.length > 0) setCustomers(res.data.users);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const handleToggleBlock = async (id) => {
    try {
      await adminAPI.toggleBlockUser(id);
      setCustomers(prev => prev.map(c => {
        if (c.id === id) {
          const is_blocked = c.isBlocked !== undefined ? !c.isBlocked : !c.is_blocked;
          return { ...c, isBlocked: is_blocked, is_blocked };
        }
        return c;
      }));
    } catch {
      setCustomers(prev => prev.map(c => {
        if (c.id === id) {
          const is_blocked = c.isBlocked !== undefined ? !c.isBlocked : !c.is_blocked;
          return { ...c, isBlocked: is_blocked, is_blocked };
        }
        return c;
      }));
    }
  };

  const filtered = customers.filter(c => {
    const name = (c.fullName || c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const columns = [
    { header: 'Name', render: (row) => <span style={{ fontWeight: 600 }}>{row.fullName || row.name}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Orders', render: (row) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.orderCount || row.order_count || 0}</span> },
    { header: 'Joined', render: (row) => new Date(row.createdAt || row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Status', render: (row) => <StatusBadge status={(row.isBlocked !== undefined ? row.isBlocked : row.is_blocked) ? 'blocked' : 'active'} /> },
    {
      header: 'Actions',
      render: (row) => {
        const isBlocked = row.isBlocked !== undefined ? row.isBlocked : row.is_blocked;
        return (
          <button
            className={`btn btn-sm ${isBlocked ? 'btn-primary' : 'btn-danger'}`}
            onClick={() => handleToggleBlock(row.id)}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">{filtered.length} total customers</p>
        </div>
      </div>
      <div className="page-toolbar">
        <input
          className="search-input" type="text" placeholder="Search customers..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No customers found" />
    </div>
  );
}
