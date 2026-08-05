import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { adminAPI } from '../services/api';

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getShops().then(res => {
      if (res.data?.length > 0) setShops(res.data);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const handleToggle = async (id) => {
    try { await adminAPI.toggleShop(id); } catch {}
    setShops(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  const filtered = shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      header: 'Shop',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={row.image} alt={row.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          <span style={{ fontWeight: 600 }}>{row.name}</span>
        </div>
      ),
    },
    { header: 'Owner', accessor: 'owner_name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Rating', render: (row) => <span>⭐ {row.rating}</span> },
    { header: 'Orders', render: (row) => <span style={{ fontWeight: 600 }}>{row.total_orders}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    {
      header: 'Actions',
      render: (row) => (
        <button className={`btn btn-sm ${row.is_active ? 'btn-warning' : 'btn-primary'}`} onClick={() => handleToggle(row.id)}>
          {row.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Shops</h2>
          <p className="page-subtitle">{shops.length} registered shops</p>
        </div>
      </div>
      <div className="page-toolbar">
        <input className="search-input" type="text" placeholder="Search shops..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No shops found" />
    </div>
  );
}
