import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';

export default function ShopApprovals() {
  const navigate = useNavigate();
  const { unreadCount } = useAppContext();
  const [filter, setFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const [unauthorized, setUnauthorized] = useState(false);
  const [stats, setStats] = useState({ pendingApplications: 0, totalShops: 0, processedCount: 0 });

  const fetchRequests = () => {
    Promise.all([
      adminAPI.getShopkeeperRequests({ status: 'pending' }),
      adminAPI.getDashboard()
    ]).then(([resApps, resDash]) => {
      setUnauthorized(false);
      console.log("DEBUG [Admin] admin applications API response:", resApps.data);
      const apps = resApps.data?.applications || (Array.isArray(resApps.data) ? resApps.data : []);
      console.log("DEBUG [Admin] application count:", apps.length);
      const mappedShops = apps.map(r => {
        const applicantName = r.applicantName || r.ownerName || r.user_name || 'Unknown';
        const shopName = r.shopName || r.shop_name || 'Unknown Shop';
        return {
          id: r.id,
          name: applicantName,
          shop: shopName,
          category: r.category,
          status: r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected',
          initial: applicantName ? applicantName.substring(0, 2).toUpperCase() : 'NA',
          color: 'bg-primary-container'
        };
      });
      setShops(mappedShops);
      
      const pendingCount = mappedShops.filter(s => s.status === 'Pending').length;
      setStats({
        pendingApplications: resDash.data?.pendingApplications ?? pendingCount,
        totalShops: resDash.data?.totalShops ?? 0,
        processedCount: 0
      });
    }).catch(err => {
      console.error("Failed to fetch shop requests", err);
      if (err.response?.status === 403) {
        setUnauthorized(true);
      }
    });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await adminAPI.approveRequest(id);
      console.log("DEBUG [Admin] approve response:", response.data);
      fetchRequests();
    } catch (err) {
      alert("Failed to approve: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectRequest(id);
      fetchRequests();
    } catch (err) {
      alert("Failed to reject: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredShops = shops.filter(s => 
    s.status === 'Pending' && 
    ((s.shop || '').toLowerCase().includes(filter.toLowerCase()) || 
    (s.name || '').toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <>
<header className="fixed top-0 left-0 right-0 h-20 bg-surface border-b border-border-gray flex items-center justify-between px-md lg:px-xl z-[100]">
<div className="flex items-center gap-md">
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 transition-transform relative" onClick={() => navigate('/admin/notifications')}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline" data-icon="notifications">notifications</span>
{unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error-red rounded-full"></span>}
</button>
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">menu</span>
</button>
<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="Admin Avatar" className="w-full h-full object-cover" data-alt="A professional headshot of a corporate administrator in a modern office environment. The lighting is bright and clean, emphasizing a high-trust and authoritative persona. The background is slightly blurred with soft blue and slate tones to match the modern corporate aesthetic of the dashboard." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCocArS-SRrIxPAjSVSUmqC8ZRcVsIlie8NZ3z1NCn4yqnWYZ68Vwt_FhCWZo9DBXc_SgmoK5LcbkPqNgFRqFJkJ7Vb2fRYKsHT9-xdNkNoXmQNC_N6BHyroszFWgbBzWzz5RwVxnplTxog1arCHoGt2TGDc3jD8oTUPySJ9YvOBRCM7tWBPhq_l2LVONyC4TPMRGyY4o7X6zBHybD99qrmOuJT6hbKD_hXZISyXHIXC1XC-Fm1vzehVEigQmoV9oJVOe-ggMnOMLQu"/>
</div>
</div>
</header>

<main className="pt-24 pb-32 px-md lg:px-xl max-w-container-max mx-auto">

<section className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Shop Approvals</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Manage and review incoming merchant partnership requests.</p>
</div>

<div className="relative w-full md:w-80">
<span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
<input value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full pl-12 pr-md py-sm rounded-xl border-border-gray bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-body-md" placeholder="Filter applications..." type="text"/>
</div>
</section>

{unauthorized && (
  <div className="bg-error-container/40 text-on-error-container p-lg rounded-xl mb-xl border border-error/15 flex flex-col gap-md animate-in fade-in slide-in-from-top-2 duration-300" id="admin-unauthorized-banner">
    <div className="flex items-start gap-sm">
      <span className="material-symbols-outlined text-error text-[28px] mt-[2px] flex-shrink-0">gpp_maybe</span>
      <div>
        <h3 className="font-title-md text-title-md font-bold text-error">Access Denied (403 Forbidden)</h3>
        <p className="font-body-md text-body-md text-on-error-container/90 mt-xs leading-relaxed">
          Your current session is logged in as a customer (<strong>rajamaran32@gmail.com</strong>). Customer accounts do not have permission to view or approve shopkeeper applications.
        </p>
      </div>
    </div>
    <div className="flex items-center gap-md mt-xs">
      <button 
        onClick={() => {
          localStorage.removeItem('go2pick_token');
          localStorage.removeItem('go2pick_user');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          navigate('/login');
        }}
        className="px-lg py-sm bg-error text-on-error font-title-md rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-xs"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Log In as Super Admin
      </button>
      <button 
        onClick={() => navigate('/')}
        className="px-lg py-sm bg-surface-container-lowest text-on-surface-variant font-title-md rounded-xl hover:bg-surface-container-low transition-colors border border-border-gray"
      >
        Go to Storefront
      </button>
    </div>
  </div>
)}

<div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
<div className="bg-white p-lg rounded-xl shadow-sm border-t-4 border-warning-amber flex items-center justify-between">
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Pending Review</p>
<p className="text-headline-lg font-headline-lg text-on-surface">{stats.pendingApplications}</p>
</div>
<span className="material-symbols-outlined text-warning-amber text-4xl" data-icon="pending_actions">pending_actions</span>
</div>
<div className="bg-white p-lg rounded-xl shadow-sm border-t-4 border-trust-blue flex items-center justify-between">
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Processed Today</p>
<p className="text-headline-lg font-headline-lg text-on-surface">{stats.processedCount}</p>
</div>
<span className="material-symbols-outlined text-trust-blue text-4xl" data-icon="verified">verified</span>
</div>
<div className="bg-white p-lg rounded-xl shadow-sm border-t-4 border-success-green flex items-center justify-between">
<div>
<p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Onboarded Shops</p>
<p className="text-headline-lg font-headline-lg text-on-surface">{stats.totalShops}</p>
</div>
<span className="material-symbols-outlined text-success-green text-4xl" data-icon="storefront">storefront</span>
</div>
</div>

<div className="bg-white rounded-xl shadow-md overflow-hidden border border-border-gray">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-container-low text-on-surface-variant">
<tr>
<th className="px-lg py-md font-label-sm text-label-sm">Applicant Name</th>
<th className="px-lg py-md font-label-sm text-label-sm">Shop Name</th>
<th className="px-lg py-md font-label-sm text-label-sm">Category</th>
<th className="px-lg py-md font-label-sm text-label-sm">Status</th>
<th className="px-lg py-md font-label-sm text-label-sm text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{filteredShops.length === 0 ? (
  <tr>
    <td colSpan="5" className="px-lg py-12 text-center text-on-surface-variant">
      <div className="flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">rule</span>
        <p>No pending shop applications.</p>
      </div>
    </td>
  </tr>
) : filteredShops.map(shop => (
<tr key={shop.id} className="hover:bg-surface-slate transition-colors group">
<td className="px-lg py-md">
<div className="flex items-center gap-sm">
<div className={`w-8 h-8 rounded-full ${shop.color} text-white flex items-center justify-center font-bold text-xs`}>{shop.initial}</div>
<span className="font-body-md font-semibold text-on-surface">{shop.name}</span>
</div>
</td>
<td className="px-lg py-md font-body-md text-on-surface">{shop.shop}</td>
<td className="px-lg py-md font-body-md text-on-surface-variant">{shop.category}</td>
<td className="px-lg py-md">
<span className={`px-sm py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${shop.status === 'Approved' ? 'bg-success-green/10 text-success-green border-success-green/20' : shop.status === 'Rejected' ? 'bg-error-red/10 text-error-red border-error-red/20' : 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'}`}>{shop.status}</span>
</td>
<td className="px-lg py-md text-right">
<button onClick={() => navigate('/admin/shop-review', { state: { shop } })} className="px-md py-xs rounded-lg border border-trust-blue text-trust-blue font-label-sm text-label-sm hover:bg-trust-blue hover:text-white transition-all active:scale-95 mr-2">View</button>
{shop.status === 'Pending' && (
  <>
<button onClick={() => handleApprove(shop.id)} className="px-md py-xs rounded-lg border border-success-green text-success-green font-label-sm text-label-sm hover:bg-success-green hover:text-white transition-all active:scale-95 mr-2">Approve</button>
<button onClick={() => handleReject(shop.id)} className="px-md py-xs rounded-lg border border-error-red text-error-red font-label-sm text-label-sm hover:bg-error-red hover:text-white transition-all active:scale-95">Reject</button>
  </>
)}
</td>
</tr>
))}
</tbody>
</table>
</div>

<div className="px-lg py-md bg-surface-container-low flex items-center justify-between border-t border-border-gray">
<span className="text-label-sm font-label-sm text-on-surface-variant">Showing {filteredShops.length} of {shops.length} requests</span>
<div className="flex items-center gap-xs">
<button className="p-xs rounded-lg hover:bg-white transition-colors disabled:opacity-30" disabled="">
<span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
</button>
<button className="p-xs rounded-lg hover:bg-white transition-colors">
<span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
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
