import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { adminAPI } from '../services/api';

export default function Shopkeepers() {
  const [shopkeepers, setShopkeepers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getUsers({ role: 'shopkeeper' }).then(res => {
      if (res.data.users?.length > 0) setShopkeepers(res.data.users);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const filtered = shopkeepers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.shop_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Name', render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
    { header: 'Shop', render: (row) => row.shop_name || '—' },
    { header: 'Category', render: (row) => row.category || '—' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Joined', render: (row) => new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_blocked ? 'blocked' : 'active'} /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Shopkeepers</h2>
          <p className="page-subtitle">{filtered.length} registered shopkeepers</p>
        </div>
      </div>
      <div className="page-toolbar">
        <input className="search-input" type="text" placeholder="Search shopkeepers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No shopkeepers found" />
    </div>
  );
}
