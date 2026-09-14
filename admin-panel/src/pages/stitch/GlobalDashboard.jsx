import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useAppContext } from '../../context/AppContext';

export default function GlobalDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalShops: 0, totalRevenue: 0, pendingApplications: 0, totalOrders: 0 });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({ uptime: null, latency: null, dbLoad: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, appRes] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getShopkeeperRequests({ status: 'pending', limit: 5 })
        ]);

        if (dashRes.data?.success) {
          setStats(dashRes.data);
        }
        if (appRes.data?.success && Array.isArray(appRes.data.applications)) {
          setPendingApprovals(appRes.data.applications.map(a => ({
            id: a.id,
            name: a.applicantName || a.ownerName || 'Unknown',
            email: a.applicantEmail || a.email || '',
            category: a.category || 'General',
            date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            status: a.status === 'pending' ? 'In Review' : a.status === 'approved' ? 'Approved' : 'Rejected',
            initial: (a.applicantName || a.ownerName || 'NA').substring(0, 2).toUpperCase(),
            error: false
          })));
        }
      } catch (err) {
        console.error('GlobalDashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Fetch real system health
    adminAPI.getSystemHealth && adminAPI.getSystemHealth()
      .then(res => { if (res.data) setSystemHealth(res.data); })
      .catch(() => {});
    // Fallback: try direct API
    import('../../services/api').then(({ default: api }) => {
      api.get('/api/admin/system-health').then(res => {
        if (res.data) setSystemHealth(res.data);
      }).catch(() => {});
    });
  }, []);

  return (
    <>
      

<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg py-sm bg-surface-slate dark:bg-inverse-surface shadow-sm">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-primary dark:text-inverse-primary" data-icon="admin_panel_settings">admin_panel_settings</span>
<h1 className="font-headline-lg text-headline-lg font-bold text-primary dark:text-inverse-primary">Marketplace Admin</h1>
</div>
<div className="flex items-center gap-md">
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 transition-transform relative">
<span className="material-symbols-outlined cursor-pointer text-on-surface-variant hover:text-primary dark:text-outline" data-icon="notifications" onClick={() => navigate('/admin/notifications')}>notifications</span>
{unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-error-red rounded-full"></span>}
</button>
<button className="p-xs rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-95 cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
<span className="material-symbols-outlined text-on-surface-variant dark:text-outline">menu</span>
</button>
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                SA
            </div>
</div>
</header>
<main className="pt-24 pb-32 px-md md:px-xl max-w-container-max mx-auto space-y-xl">

<section className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">Global Overview</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Real-time platform performance and health metrics.</p>
</div>
<div className="flex items-center gap-sm">
<button className="bg-surface-container-lowest border border-border-gray px-md py-sm rounded-xl flex items-center gap-xs font-label-sm text-label-sm hover:bg-surface-container transition-all active:scale-95">
<span className="material-symbols-outlined text-[18px]" data-icon="calendar_today">calendar_today</span>
                    All Time
                    <span className="material-symbols-outlined text-[18px]" data-icon="expand_more">expand_more</span>
</button>
</div>
</section>

<section className="grid grid-cols-2 md:grid-cols-4 gap-lg">

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border-t-4 border-trust-blue flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex justify-between items-start">
<div className="p-sm bg-surface-container rounded-lg">
<span className="material-symbols-outlined text-primary" data-icon="group">group</span>
</div>
<span className="font-label-sm text-label-sm text-success-green flex items-center gap-base">
<span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span>
                        Live
                    </span>
</div>
<div className="mt-xl">
<p className="font-label-sm text-label-sm text-on-surface-variant">Total Users</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : stats.totalUsers?.toLocaleString() || '0'}</h3>
</div>
</div>

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border-t-4 border-marketplace-orange flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex justify-between items-start">
<div className="p-sm bg-secondary-fixed rounded-lg">
<span className="material-symbols-outlined text-secondary" data-icon="storefront">storefront</span>
</div>
<span className="font-label-sm text-label-sm text-success-green flex items-center gap-base">
<span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span>
                        Live
                    </span>
</div>
<div className="mt-xl">
<p className="font-label-sm text-label-sm text-on-surface-variant">Registered Shops</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : stats.totalShops?.toLocaleString() || '0'}</h3>
</div>
</div>

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border-t-4 border-success-green flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex justify-between items-start">
<div className="p-sm bg-tertiary-fixed rounded-lg">
<span className="material-symbols-outlined text-tertiary" data-icon="receipt">receipt</span>
</div>
<span className="font-label-sm text-label-sm text-success-green flex items-center gap-base">
<span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span>
                        Live
                    </span>
</div>
<div className="mt-xl">
<p className="font-label-sm text-label-sm text-on-surface-variant">Total Orders</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : (stats.totalOrders || 0).toLocaleString()}</h3>
</div>
</div>

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border-t-4 border-warning-amber flex flex-col justify-between hover:shadow-md transition-shadow">
<div className="flex justify-between items-start">
<div className="p-sm bg-warning-amber/10 rounded-lg">
<span className="material-symbols-outlined text-warning-amber" data-icon="pending_actions">pending_actions</span>
</div>
{stats.pendingApplications > 0 && (
<span className="font-label-sm text-label-sm text-error-red flex items-center gap-base">
<span className="material-symbols-outlined text-[14px]">priority_high</span>
  Action Needed
</span>
)}
</div>
<div className="mt-xl">
<p className="font-label-sm text-label-sm text-on-surface-variant">Pending Approvals</p>
<h3 className="font-headline-lg text-headline-lg text-on-surface">{isLoading ? '...' : stats.pendingApplications || '0'}</h3>
</div>
</div>
</section>

<section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">

<div className="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-border-gray">
<div className="flex justify-between items-center mb-lg">
<h4 className="font-title-md text-title-md">Platform Activity</h4>
<div className="flex gap-sm">
<div className="flex items-center gap-xs font-label-sm text-label-sm">
<span className="w-3 h-3 rounded-full bg-primary"></span>
                            Users
                        </div>
<div className="flex items-center gap-xs font-label-sm text-label-sm">
<span className="w-3 h-3 rounded-full bg-marketplace-orange"></span>
                            Orders
                        </div>
</div>
</div>
<div className="relative h-64 w-full chart-gradient rounded-lg border border-dashed border-outline-variant flex items-end px-md pb-md">

<div className="flex items-end justify-between w-full h-full gap-xs">

<div className="w-full h-24 bg-primary/20 rounded-t-sm"></div>
<div className="w-full h-32 bg-primary/30 rounded-t-sm"></div>
<div className="w-full h-28 bg-primary/20 rounded-t-sm"></div>
<div className="w-full h-40 bg-primary/40 rounded-t-sm"></div>
<div className="w-full h-48 bg-primary/50 rounded-t-sm"></div>
<div className="w-full h-44 bg-primary/40 rounded-t-sm"></div>
<div className="w-full h-56 bg-primary/60 rounded-t-sm"></div>
<div className="w-full h-60 bg-primary rounded-t-sm"></div>
</div>
<div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
<span className="font-label-sm text-label-sm text-outline">Growth Trend (Last 30 Days)</span>
</div>
</div>
<div className="flex justify-between mt-md px-md">
<span className="font-label-sm text-label-sm text-outline">Day 1</span>
<span className="font-label-sm text-label-sm text-outline">Day 15</span>
<span className="font-label-sm text-label-sm text-outline">Today</span>
</div>
</div>

<div className="space-y-lg">

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-border-gray">
<h4 className="font-title-md text-title-md mb-md">Quick Navigation</h4>
<div className="grid grid-cols-2 gap-sm">
<button onClick={() => navigate('/admin/approvals')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-primary mb-xs" data-icon="how_to_reg">how_to_reg</span>
<span className="font-body-md text-body-md font-semibold text-center">Shop Approvals</span>
</button>
<button onClick={() => navigate('/admin/shops')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-marketplace-orange mb-xs" data-icon="storefront">storefront</span>
<span className="font-body-md text-body-md font-semibold text-center">Shop Management</span>
</button>
<button onClick={() => navigate('/admin/users')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-tertiary mb-xs" data-icon="group">group</span>
<span className="font-body-md text-body-md font-semibold text-center">User Management</span>
</button>
<button onClick={() => navigate('/admin/settings')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-trust-blue mb-xs" data-icon="settings">settings</span>
<span className="font-body-md text-body-md font-semibold text-center">Platform Settings</span>
</button>
<button onClick={() => navigate('/admin/support')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-success-green mb-xs" data-icon="support_agent">support_agent</span>
<span className="font-body-md text-body-md font-semibold text-center">Support</span>
</button>
<button onClick={() => navigate('/admin/reviews')} className="w-full flex flex-col items-center justify-center p-md rounded-lg border border-border-gray hover:bg-surface-container-low transition-colors group">
<span className="material-symbols-outlined text-warning-amber mb-xs" data-icon="reviews">reviews</span>
<span className="font-body-md text-body-md font-semibold text-center">Reviews</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-border-gray">
<div className="flex justify-between items-center mb-md">
<h4 className="font-title-md text-title-md">System Health</h4>
<span className="flex items-center gap-xs px-sm py-base bg-success-green/10 text-success-green rounded-full font-label-sm text-label-sm">
<span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
                            Stable
                        </span>
</div>
<div className="space-y-md">
<div>
<div className="flex justify-between items-center mb-base">
<span className="font-label-sm text-label-sm text-on-surface-variant">API Latency</span>
<span className="font-label-sm text-label-sm font-bold">{systemHealth.latency ?? '–'}</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-success-green" style={{width: systemHealth.latency ? '15%' : '0%'}}></div>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-base">
<span className="font-label-sm text-label-sm text-on-surface-variant">DB Load</span>
<span className="font-label-sm text-label-sm font-bold">{systemHealth.dbLoad ?? '–'}</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-warning-amber" style={{width: systemHealth.dbLoad ? systemHealth.dbLoad : '0%'}}></div>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden">
<div className="p-lg border-b border-border-gray flex justify-between items-center">
<h4 className="font-title-md text-title-md">Pending Shop Approvals</h4>
<button onClick={() => navigate('/admin/approvals')} className="text-primary font-label-sm text-label-sm hover:underline">View All Approvals</button>
</div>
{isLoading ? (
  <div className="p-lg text-center text-on-surface-variant">Loading approvals...</div>
) : pendingApprovals.length === 0 ? (
  <div className="p-lg text-center text-on-surface-variant">No pending shop applications.</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
<tr>
<th className="px-lg py-md">Shop Name</th>
<th className="px-lg py-md">Category</th>
<th className="px-lg py-md">Applied Date</th>
<th className="px-lg py-md">Verification</th>
<th className="px-lg py-md text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{pendingApprovals.map((app) => (
<tr key={app.id} className="hover:bg-surface-container-lowest transition-colors">
<td className="px-lg py-md flex items-center gap-sm">
<div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-primary">{app.initial}</div>
<div>
<p className="font-body-md font-semibold">{app.name}</p>
<p className="text-[12px] text-outline">{app.email}</p>
</div>
</td>
<td className="px-lg py-md font-body-md">{app.category}</td>
<td className="px-lg py-md font-body-md text-outline">{app.date}</td>
<td className="px-lg py-md">
<span className={`px-sm py-base rounded-full text-[12px] font-semibold ${app.error ? 'bg-error-red/10 text-error-red' : 'bg-warning-amber/10 text-warning-amber'}`}>{app.status}</span>
</td>
<td className="px-lg py-md text-right">
<button onClick={() => navigate('/admin/approvals')} className="text-trust-blue hover:underline font-label-sm text-label-sm">Review</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</section>
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
