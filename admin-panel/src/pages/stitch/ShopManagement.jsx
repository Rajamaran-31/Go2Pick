import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';

export default function ShopManagement() {
  const navigate = useNavigate();
  const { unreadCount } = useAppContext();
  const [filterCat, setFilterCat] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActiveShops: 0,
    avgRating: '0.00',
    pendingApplications: 0
  });

  const fetchShops = async () => {
    try {
      const [shopsRes, dashRes] = await Promise.all([
        adminAPI.getShops(),
        adminAPI.getDashboard()
      ]);
      const data = shopsRes.data;
      const list = Array.isArray(data) ? data : (data.shops || []);
      const mappedShops = list.map(s => ({
        id: s.id || s._id,
        name: s.name || s.shopName || 'Unknown',
        category: s.category || 'General',
        owner: s.ownerName || s.owner_name || 'Owner',
        rev: `₹${(s.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        rating: s.rating || 0,
        img: s.image || 'https://placehold.co/150',
        isActive: s.isActive !== false,
        suspended: !s.isActive
      }));
      setShops(mappedShops);

      const activeShops = mappedShops.filter(s => s.isActive);
      const avg = activeShops.length ? (activeShops.reduce((acc, s) => acc + s.rating, 0) / activeShops.length) : 0.0;
      
      setStats({
        totalActiveShops: activeShops.length,
        avgRating: avg.toFixed(2),
        pendingApplications: dashRes.data?.pendingApplications || 0
      });
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  const handleToggle = async (shop) => {
    try {
      await adminAPI.toggleShop(shop.id);
      fetchShops();
    } catch (err) {
      alert('Failed to update shop: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredShops = shops.filter(s => 
    (filterCat === 'All' || s.category === filterCat) && 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <>
      

<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-sm bg-surface-slate dark:bg-inverse-surface shadow-sm">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-high p-xs rounded-full transition-colors" onClick={() => navigate('/admin')}>arrow_back</span>
<span className="material-symbols-outlined text-primary dark:text-inverse-primary" style={{fontSize: '28px'}}>admin_panel_settings</span>
<h1 className="font-headline-lg text-headline-lg font-bold text-primary dark:text-inverse-primary">Marketplace Admin</h1>
</div>
<div className="flex items-center gap-md">
{/* Search Icon Removed */}
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 transition-transform relative" onClick={() => navigate('/admin/notifications')}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">notifications</span>
{unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error-red rounded-full"></span>}
</button>
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">menu</span>
</button>
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                AD
            </div>
</div>
</header>
<main className="pt-24 pb-24 px-md md:px-lg max-w-container-max mx-auto">

<div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
<div className="md:col-span-2 glass-card p-lg rounded-xl shadow-sm border-t-4 border-primary">
<div className="flex justify-between items-start">
<div>
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-base">Total Active Shops</p>
<h2 className="font-display-lg text-display-lg text-on-surface">{isLoading ? '...' : stats.totalActiveShops.toLocaleString()}</h2>
</div>
<span className="material-symbols-outlined text-primary text-[32px]">storefront</span>
</div>
<p className="text-success-green font-label-sm mt-sm flex items-center gap-base">
<span className="material-symbols-outlined text-[16px]">trending_up</span> Live
                </p>
</div>
<div className="glass-card p-lg rounded-xl shadow-sm border-t-4 border-marketplace-orange">
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-base">Avg Rating</p>
<h2 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : stats.avgRating}</h2>
<div className="flex gap-base mt-sm text-warning-amber">
  {Array.from({ length: 5 }).map((_, index) => {
    const starVal = index + 1;
    const rating = parseFloat(stats.avgRating);
    let iconName = 'star';
    let fill = '\'FILL\' 0';
    if (rating >= starVal) {
      iconName = 'star';
      fill = '\'FILL\' 1';
    } else if (rating > starVal - 1) {
      iconName = 'star_half';
      fill = '\'FILL\' 0.5';
    }
    return (
      <span key={index} className="material-symbols-outlined" style={{ fontVariationSettings: fill }}>{iconName}</span>
    );
  })}
</div>
</div>
<div className="glass-card p-lg rounded-xl shadow-sm border-t-4 border-tertiary">
<p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-base">Pending Applications</p>
<h2 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : stats.pendingApplications}</h2>
<button onClick={() => navigate('/admin/approvals')} className="mt-sm text-primary font-label-sm hover:underline">Review Now</button>
</div>
</div>

<section className="mb-lg flex flex-col md:flex-row gap-md items-end md:items-center justify-between">
<div className="flex flex-wrap gap-sm">
<button onClick={() => setFilterCat('All')} className={`px-md py-xs rounded-full font-label-sm flex items-center gap-xs ${filterCat === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors'}`}>
                    All Shops
                </button>
<button onClick={() => setFilterCat('Electronics')} className={`px-md py-xs rounded-full font-label-sm flex items-center gap-xs ${filterCat === 'Electronics' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors'}`}>
                    Electronics
                </button>
<button onClick={() => setFilterCat('Fashion')} className={`px-md py-xs rounded-full font-label-sm flex items-center gap-xs ${filterCat === 'Fashion' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors'}`}>
                    Fashion
                </button>
<button onClick={() => setFilterCat('Home Decor')} className={`px-md py-xs rounded-full font-label-sm flex items-center gap-xs ${filterCat === 'Home Decor' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors'}`}>
                    Home Decor
                </button>
<button onClick={() => window.alert('Action successful')} className="px-md py-xs border border-border-gray text-on-surface-variant rounded-full font-label-sm flex items-center gap-xs">
<span className="material-symbols-outlined text-[18px]">filter_list</span> More Filters
                </button>
</div>
<div className="relative w-full md:w-72">
<input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-surface-container-lowest border-border-gray rounded-xl px-lg py-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Search shop name or owner..." type="text"/>
<span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-outline">search</span>
</div>
</section>

<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-border-gray">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-slate">
<tr>
<th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Shop Name &amp; Category</th>
<th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Owner</th>
<th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Total Revenue</th>
<th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Rating</th>
<th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{isLoading ? (
  <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">Loading shops...</td></tr>
) : filteredShops.length === 0 ? (
  <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">No shops registered yet.</td></tr>
) : filteredShops.map(shop => (
<tr key={shop.id} className="shop-row transition-colors cursor-pointer hover:bg-surface-container-high" onClick={() => navigate('/admin/shop-review', { state: { shop } })}>
<td className="px-lg py-md">
<div className="flex items-center gap-md">
<div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden">
<img alt={shop.name} className="w-full h-full object-cover" src={shop.img}/>
</div>
<div>
<p className="font-title-md text-on-surface leading-tight">{shop.name}</p>
<span className="text-label-sm text-primary bg-primary-container/10 px-xs py-[2px] rounded">{shop.category}</span>
</div>
</div>
</td>
<td className="px-lg py-md font-body-md text-on-surface-variant">{shop.owner}</td>
<td className="px-lg py-md font-title-md text-on-surface">{shop.rev}</td>
<td className="px-lg py-md">
<div className="flex items-center gap-xs">
<span className="font-bold text-on-surface">{shop.rating}</span>
<span className="material-symbols-outlined text-warning-amber text-[18px]" style={{fontVariationSettings: '\'FILL\' 1'}}>star</span>
</div>
</td>
<td className="px-lg py-md text-right">
<div className="flex justify-end gap-sm">
{shop.featured ? (
<div onClick={() => setShops(shops.map(s => s.id === shop.id ? {...s, featured: false} : s))} className="px-sm py-xs bg-marketplace-orange text-white rounded-lg font-label-sm flex items-center gap-xs shadow-sm cursor-pointer">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: '\'FILL\' 1'}}>verified</span> Featured
</div>
) : (
<button onClick={() => setShops(shops.map(s => s.id === shop.id ? {...s, featured: true} : s))} className="px-sm py-xs bg-marketplace-orange/10 text-marketplace-orange hover:bg-marketplace-orange hover:text-white rounded-lg font-label-sm transition-all flex items-center gap-xs active:scale-95" title="Feature Shop">
<span className="material-symbols-outlined text-[18px]">verified</span> Feature
</button>
)}
<button onClick={(e) => { e.stopPropagation(); if (window.confirm(`${shop.isActive ? 'Suspend' : 'Activate'} ${shop.name}?`)) handleToggle(shop); }} className={`px-sm py-xs rounded-lg font-label-sm transition-all flex items-center gap-xs active:scale-95 ${shop.isActive ? 'bg-error-red/10 text-error-red hover:bg-error-red hover:text-white' : 'bg-success-green/10 text-success-green hover:bg-success-green hover:text-white'}`} title={shop.isActive ? 'Suspend Shop' : 'Activate Shop'}>
<span className="material-symbols-outlined text-[18px]">{shop.isActive ? 'block' : 'check_circle'}</span> {shop.isActive ? 'Suspend' : 'Activate'}
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>

<div className="px-lg py-md bg-surface-slate flex items-center justify-between">
<p className="font-label-sm text-on-surface-variant">Showing {filteredShops.length} of {shops.length} entries</p>
<div className="flex gap-xs">
<button className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<button className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-label-sm">1</button>
<button className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center hover:bg-surface-container transition-colors font-label-sm">2</button>
<button className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center hover:bg-surface-container transition-colors font-label-sm">3</button>
<button className="w-8 h-8 rounded-lg border border-border-gray flex items-center justify-center hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
</div>
</main>

{isDrawerOpen && (
  <div className="fixed inset-0 z-[200] flex">
    <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
    <div className="relative w-64 bg-surface dark:bg-surface-dim h-full shadow-lg flex flex-col p-4 animate-slide-in-left">
      <button className="self-end material-symbols-outlined mb-4" onClick={() => setIsDrawerOpen(false)}>close</button>
      <h2 className="text-title-md font-bold mb-4">Navigation Menu</h2>
      <div className="flex flex-col gap-2">
         <button onClick={() => { setIsDrawerOpen(false); navigate('/admin'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/approvals'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">rule</span> Approvals</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/users'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">group</span> Users</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/shops'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">storefront</span> Shops</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/settings'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">settings</span> Settings</button>
      </div>
    </div>
  </div>
)}

    </>
  );
}
