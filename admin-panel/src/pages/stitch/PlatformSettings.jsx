import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { adminAPI, API_BASE } from '../../services/api';

const defaultCategoryImages = {
  'Bakery': `${API_BASE}/static/bakery.jpg`,
  'Electronics': `${API_BASE}/static/electronics.jpg`,
  'Grocery': `${API_BASE}/static/grocery.jpg`,
  'Groceries': `${API_BASE}/static/grocery.jpg`,
  'Home': `${API_BASE}/static/home.jpg`,
  'Pharmacy': `${API_BASE}/static/pharmacy.jpg`,
  'Ready to Eat': `${API_BASE}/static/ready_to_eat.jpg`
};

export default function PlatformSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [showInviteAdminModal, setShowInviteAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Operations');
  const [customAdminRole, setCustomAdminRole] = useState('');
  
  const [showToast, setShowToast] = useState(false);
  const [isAutoOptEnabled, setIsAutoOptEnabled] = useState(true);

  const [categories, setCategories] = useState([]);
  const [platformStats, setPlatformStats] = useState({ totalShops: 0, totalProducts: 0 });

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => {
        if (res.data) setPlatformStats({ totalShops: res.data.totalShops || 0, totalProducts: res.data.totalProducts || 0 });
      })
      .catch(err => console.error('Failed to fetch platform stats:', err));
  }, []);

  React.useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/admin/categories')
        .then(res => {
          if (Array.isArray(res.data)) {
            setCategories(res.data);
          }
        })
        .catch(err => console.error("Error fetching categories:", err));
    });
  }, []);

  return (
    <>
      
{/* TopAppBar */}
<header className="fixed top-0 w-full z-50 flex items-center justify-between px-md h-14 w-full bg-surface/80 backdrop-blur-md border-b border-border-gray shadow-sm">
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-trust-blue active:scale-95 duration-150 p-xs rounded-full hover:bg-surface-container-low transition-colors" onClick={() => navigate('/admin')}>arrow_back</button>
<button className="material-symbols-outlined text-trust-blue active:scale-95 duration-150 p-xs rounded-full hover:bg-surface-container-low transition-colors">menu</button>
<span className="text-headline-lg-mobile font-headline-lg-mobile text-trust-blue font-black tracking-tight">Go2Pick</span>
</div>
<div className="flex items-center gap-md">
<div className="hidden md:flex items-center gap-sm px-md border-r border-border-gray">
<span className="text-on-surface-variant font-label-sm text-label-sm">Mode: <span className="text-trust-blue font-bold">Global Admin</span></span>
</div>
<div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-label-sm font-bold active:scale-95 transition-transform cursor-pointer">
                AU
            </div>
</div>
</header>
{/* NavigationDrawer (Sidebar) */}
<aside className="fixed inset-y-0 left-0 z-[60] flex flex-col py-lg h-full w-80 rounded-r-xl bg-surface shadow-xl hidden md:flex pt-20">
<div className="px-lg pb-lg mb-lg border-b border-border-gray">
<div className="flex items-center gap-md">
<img alt="Super Admin" className="w-12 h-12 rounded-lg object-cover" data-alt="A professional headshot of a senior executive in a high-tech corporate environment. The subject is wearing a tailored navy suit, looking confident and approachable. The background is a softly blurred modern office with glass partitions and cool blue architectural lighting, maintaining a clean, high-trust corporate aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAu4vPn2okerhhhYhpBLC-cz8lcRVBG5lImsbnYEpc_VX2cmNYCoxQVofz7Tf2hb8VK2cLcIjZwh_2PD-G1PNTka1jzltb5dphjBFGeUttxdDuKo0E-woRlDMqA9Jiy9kdh-Z9YEumirgWi5nqRVRglF8OdccOs12MnWEt8_fofSg1BqonKe8iHuzEtEW-ZgBHXe_fagqEMIqWTHv3yxCYTVKlR-SN52lbzt8lN-3kYU5O4BgIEssFcWNXkCa3PIAxNj0avZ07oV_ij"/>
<div>
<p className="font-title-md text-title-md text-trust-blue leading-tight">Super Admin</p>
<p className="font-body-md text-body-md text-on-surface-variant">Platform Controller</p>
<p className="text-[10px] uppercase tracking-widest text-outline mt-1">v2.4.0</p>
</div>
</div>
</div>
<nav className="flex-1 px-sm space-y-1 overflow-y-auto custom-scrollbar">
<Link className="flex items-center gap-md bg-[#1B2A4A] text-white rounded-lg mx-2 my-1 px-md py-sm transition-all duration-200" to="/admin/settings">
<span className="material-symbols-outlined">settings_input_component</span>
<span className="font-body-md text-body-md">Global Config</span>
</Link>
<Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/logs">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-body-md text-body-md">Merchant Logs</span>
</Link>
<Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/health">
<span className="material-symbols-outlined">health_and_safety</span>
<span className="font-body-md text-body-md">System Health</span>
</Link>
<Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/audit">
<span className="material-symbols-outlined">policy</span>
<span className="font-body-md text-body-md">Audit Trail</span>
</Link>
<Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/reviews">
<span className="material-symbols-outlined">reviews</span>
<span className="font-body-md text-body-md">Review Management</span>
</Link>
<Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/support">
<span className="material-symbols-outlined">contact_support</span>
<span className="font-body-md text-body-md">Support</span>
</Link>
</nav>
<div className="mt-auto px-lg pt-lg border-t border-border-gray">
<button className="flex items-center gap-md text-error w-full px-md py-sm rounded-lg hover:bg-error-container/10 transition-colors">
<span className="material-symbols-outlined">logout</span>
<span className="font-label-sm text-label-sm">Terminate Session</span>
</button>
</div>
</aside>
{/* Main Content Canvas */}
<main className="md:pl-80 pt-14 pb-32 min-h-screen">
<div className="max-w-7xl mx-auto p-md md:p-xl">
{/* Header Section */}
<div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Platform Settings</h2>
<p className="text-on-surface-variant font-body-lg text-body-lg">Control the global parameters of the Go2Pick marketplace ecosystem.</p>
</div>
<div className="flex gap-sm">
<button className="px-lg py-sm rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-xs">
<span className="material-symbols-outlined text-[20px]">refresh</span>
                        Discard Changes
                    </button>
<button onClick={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} className="px-lg py-sm rounded-xl bg-trust-blue text-white shadow-lg hover:shadow-xl transition-all font-label-sm text-label-sm flex items-center gap-xs">
<span className="material-symbols-outlined text-[20px]">save</span>
                        Save All Changes
                    </button>
</div>
</div>
{/* Bento Grid Layout */}
<div className="grid grid-cols-12 gap-gutter">
{/* Service Fees Section (Level 1 Card) - Hidden in MVP */}
<section className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-lg shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border-t-4 border-trust-blue" style={{ display: 'none' }}>
<div className="flex items-center gap-sm mb-lg">
<span className="material-symbols-outlined text-trust-blue">payments</span>
<h3 className="font-title-md text-title-md text-on-surface">Service Fees</h3>
</div>
<div className="space-y-lg">
<div className="group">
<label className="block text-label-sm font-label-sm text-on-surface-variant mb-xs">Commission Percentage</label>
<div className="relative">
<input className="w-full h-12 bg-white border border-border-gray rounded-lg px-md font-body-md text-body-md focus:ring-2 focus:ring-trust-blue focus:border-trust-blue outline-none transition-all" type="number" value="12.5"/>
<span className="absolute right-md top-1/2 -translate-y-1/2 text-outline font-bold">%</span>
</div>
<p className="mt-2 text-[11px] text-outline italic">Applied to every transaction subtotal.</p>
</div>
<div className="group">
<label className="block text-label-sm font-label-sm text-on-surface-variant mb-xs">Flat Processing Fee</label>
<div className="relative">
<span className="absolute left-md top-1/2 -translate-y-1/2 text-outline font-bold">₹</span>
<input className="w-full h-12 bg-white border border-border-gray rounded-lg pl-xl pr-md font-body-md text-body-md focus:ring-2 focus:ring-trust-blue focus:border-trust-blue outline-none transition-all" type="number" value="0.50"/>
</div>
</div>
<div className="p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
<div className="flex items-center justify-between mb-sm">
<span className="text-label-sm text-on-surface-variant">Merchant Payout Delay</span>
<span className="bg-success-green/10 text-success-green px-xs py-[2px] rounded text-[10px] font-bold">STABLE</span>
</div>
<select className="w-full bg-white border border-border-gray rounded-lg px-md h-10 font-body-md text-body-md outline-none">
<option>Instant (T+0)</option>
<option selected="">Standard (T+2)</option>
<option>Extended (T+5)</option>
</select>
</div>
</div>
</section>
{/* Categories Management (Table/List) */}
<section className="col-span-12 lg:col-span-12 bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] overflow-hidden flex flex-col">
<div className="p-lg border-b border-border-gray flex items-center justify-between">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-marketplace-orange">category</span>
<h3 className="font-title-md text-title-md text-on-surface">Categories</h3>
</div>
<button onClick={() => setShowAddCategoryModal(true)} className="px-md py-xs rounded-lg bg-marketplace-orange/10 text-marketplace-orange hover:bg-marketplace-orange/20 transition-colors font-label-sm text-label-sm flex items-center gap-xs">
<span className="material-symbols-outlined text-[18px]">add</span>
                            Add New Category
                        </button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low border-b border-border-gray">
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">CATEGORY NAME</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant text-center">ITEMS</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant">REVENUE CONTRIBUTION</th>
<th className="px-lg py-md text-label-sm font-label-sm text-on-surface-variant text-right">STATUS</th>
<th className="px-lg py-md"></th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{ (showAllCategories ? categories : categories.slice(0, 3)).map((cat) => (
<tr key={cat.id} className="hover:bg-surface-container-low/50 transition-colors group">
<td className="px-lg py-md">
<div className="flex items-center gap-md">
<div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
  <img 
    className="w-full h-full object-cover" 
    src={cat.image || defaultCategoryImages[cat.name] || defaultCategoryImages['Grocery']} 
    alt={cat.name}
    onError={(e) => {
      e.target.src = defaultCategoryImages[cat.name] || defaultCategoryImages['Grocery'];
    }}
  />
</div>
<span className="font-body-md text-body-md font-semibold">{cat.name}</span>
</div>
</td>
<td className="px-lg py-md text-center font-body-md text-body-md text-on-surface-variant">{cat.items}</td>
<td className="px-lg py-md">
<div className="w-full bg-border-gray rounded-full h-1.5 max-w-[100px]">
<div className="bg-trust-blue h-1.5 rounded-full" style={{width: cat.width}}></div>
</div>
</td>
<td className="px-lg py-md text-right">
<span className={`px-sm py-xs ${cat.statusClass} rounded-full text-[11px] font-bold`}>{cat.status}</span>
</td>
<td className="px-lg py-md text-right">
<button onClick={() => { setCategories(categories.filter(c => c.id !== cat.id)); window.alert('Action successful'); }} className="material-symbols-outlined text-outline hover:text-error-red transition-colors p-xs">delete</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
<div className="mt-auto p-md border-t border-border-gray text-center">
<button onClick={() => setShowAllCategories(!showAllCategories)} className="text-trust-blue font-label-sm text-label-sm hover:underline">{showAllCategories ? 'Show less' : 'View all 12 categories'}</button>
</div>
</section>
{/* Administrative Roles */}
<section className="col-span-12 bg-surface-container-lowest rounded-xl p-lg shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)]">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-secondary">admin_panel_settings</span>
<h3 className="font-title-md text-title-md text-on-surface">Administrative Roles &amp; Permissions</h3>
</div>
<div className="flex gap-sm">
<div className="relative">
<span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
<input className="pl-xl pr-md h-10 border border-border-gray rounded-lg bg-surface-container-low font-body-md text-body-md outline-none focus:ring-2 focus:ring-trust-blue transition-all w-64" placeholder="Search admins..." type="text"/>
</div>
<button onClick={() => setShowInviteAdminModal(true)} className="h-10 px-md bg-secondary text-white rounded-lg font-label-sm text-label-sm hover:bg-secondary/90 transition-colors">Invite Admin</button>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
{/* Role Card 1 */}
<div className="p-lg rounded-xl border border-border-gray bg-white hover:border-trust-blue transition-colors group relative overflow-hidden">
<div className="flex justify-between items-start mb-md">
<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container">
<img alt="Marcus Chen" className="w-full h-full object-cover" data-alt="A portrait of a male data analyst in a bright, modern office. He is smiling warmly, wearing a grey polo shirt and glasses. In the background, large screens display colorful data visualizations and dashboard interfaces, illuminated by natural afternoon light filtered through large windows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1FS8-iqCfoPyqtf8V5K4W6jIDyCUOH-K5NLmHBsjNSJQdypOZ4457e-JE5IoR23nVM1TSds4yloFZvCwFyOVYGnKJoMjaqkAPWZ0Ay6o1TjPeoytNuOblqTi6zYPIJRMPgh-lkIjJFjplaqGJVPZGHx4YpHs65evqCPJyEwPpoifUlkrQsOhnRXxrO_uNsZlZotBSm29Qbfc3_7Wwl0_0VvTuaSrYayHYv4A90NP4xXVvG7aqWpT0m6u-oLfGROCChsaPzn21hHWY"/>
</div>
<span className="bg-primary-container text-on-primary-container px-sm py-xs rounded text-[10px] font-bold uppercase tracking-wider">Super Admin</span>
</div>
<h4 className="font-title-md text-title-md mb-xs">Marcus Chen</h4>
<p className="text-on-surface-variant font-body-md text-body-md mb-md">marcus.c@go2pick.com</p>
<div className="flex flex-wrap gap-xs mb-lg">
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">FULL_ACCESS</span>
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">REVENUE_EDIT</span>
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">USER_DELETE</span>
</div>
<div className="flex items-center justify-between border-t border-border-gray pt-md">
<span className="text-[11px] text-outline">Last active: 2 mins ago</span>
<button onClick={() => navigate('/admin/settings/role')} className="text-trust-blue material-symbols-outlined text-[20px] invisible group-hover:visible">settings</button>
</div>
</div>
{/* Role Card 2 */}
<div className="p-lg rounded-xl border border-border-gray bg-white hover:border-trust-blue transition-colors group relative overflow-hidden">
<div className="flex justify-between items-start mb-md">
<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container">
<img alt="Sarah Jenkins" className="w-full h-full object-cover" data-alt="A portrait of a professional female operations manager in a high-trust workspace. She has a pleasant, focused expression and is wearing a crisp white blouse. Behind her is a minimalist wall featuring a company logo and a warm, inviting accent light that creates a premium, professional atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYd2Xnq29og9txfvrDDdLN2fFDX538rOEAg34-syOc-5A-pm6A-OCnOKfRBf_-YljpLspsi1uLXYXXSolzsJqn65wRUvzOeFu-WStrVeQflftO2Te4fw-qiuH6DVi41jONYLKlm2EH36A01PvNOHN9XB1_53klDRd4niq7mVKoVwlAlC4qvZ2PHOZM8vtVAmm90rAJ1v34dGvo0CItn2zTVyfgQqwDi49df1dHBbSe5QBJ6YUejUOm6ytCYpYyFUktyFv6wkpirAGG"/>
</div>
<span className="bg-secondary-container text-white px-sm py-xs rounded text-[10px] font-bold uppercase tracking-wider">Operations</span>
</div>
<h4 className="font-title-md text-title-md mb-xs">Sarah Jenkins</h4>
<p className="text-on-surface-variant font-body-md text-body-md mb-md">s.jenkins@go2pick.com</p>
<div className="flex flex-wrap gap-xs mb-lg">
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">CATEGORIES_VIEW</span>
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">MERCHANT_MGMT</span>
</div>
<div className="flex items-center justify-between border-t border-border-gray pt-md">
<span className="text-[11px] text-outline">Last active: 4 hours ago</span>
<button onClick={() => navigate('/admin/settings/role')} className="text-trust-blue material-symbols-outlined text-[20px] invisible group-hover:visible">settings</button>
</div>
</div>
{/* Role Card 3 */}
<div className="p-lg rounded-xl border border-border-gray bg-white hover:border-trust-blue transition-colors group relative overflow-hidden">
<div className="flex justify-between items-start mb-md">
<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container">
<img alt="David Miller" className="w-full h-full object-cover" data-alt="A portrait of a young male software developer in a modern, creative studio environment. He is wearing a dark hoodie and has a tech-savvy, attentive look. The background is filled with blurred neon lighting accents and multiple computer monitors showing code snippets, establishing a high-tech, modern visual style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKnrjnAQAQIygHyp14fiMkB1T741NPTTL6Y9jMaJ1_ZcZHemD9rE_JvmICnmuQ6s6P-rqKEfj8iURIrhiccHpfmPlKZff2_C43M4CeXizDRA6710J6gnFmvusmJxwM--uihk9bORd3FLjNQi3rv20bxqhWGj7GWBeDuQUwATOkH7PKOZ19nm8rHuV9ZoyMecAkvFoLVaA-iJQpNeDhDzaPuhFkdSpZ4J9sSwKpL5q2wau_XOhA8bnUpxPj9CyW90OqJwGNwiKddOdY"/>
</div>
<span className="bg-surface-variant text-primary px-sm py-xs rounded text-[10px] font-bold uppercase tracking-wider">Developer</span>
</div>
<h4 className="font-title-md text-title-md mb-xs">David Miller</h4>
<p className="text-on-surface-variant font-body-md text-body-md mb-md">d.miller@go2pick.tech</p>
<div className="flex flex-wrap gap-xs mb-lg">
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">LOGS_READ</span>
<span className="px-xs py-[2px] bg-surface-container text-on-surface-variant rounded text-[9px] font-bold">API_CONFIG</span>
</div>
<div className="flex items-center justify-between border-t border-border-gray pt-md">
<span className="text-[11px] text-outline">Last active: Online</span>
<button onClick={() => navigate('/admin/settings/role')} className="text-trust-blue material-symbols-outlined text-[20px] invisible group-hover:visible">settings</button>
</div>
</div>
</div>
</section>
</div>
{/* Dashboard Insights (Asymmetric Layout Extra) */}
<div className="mt-xl grid grid-cols-1 md:grid-cols-12 gap-gutter">
<div className="md:col-span-12 lg:col-span-9 bg-inverse-surface text-inverse-on-surface rounded-xl p-xl shadow-xl flex flex-col md:flex-row items-center gap-xl relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-trust-blue opacity-10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
<div className="relative z-10 flex-1">
<h4 className="font-headline-lg-mobile text-headline-lg-mobile mb-sm">Platform Health Snapshot</h4>
<p className="text-body-lg text-body-lg opacity-80 mb-lg max-w-2xl">The marketplace is currently stable. No critical system alerts in the last 24 hours.</p>
<div className="flex gap-xl">
<div>
<p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Active Merchants</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile">{platformStats.totalShops.toLocaleString()}</p>
</div>
<div className="border-l border-white/20 pl-xl">
<p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Active Products</p>
<p className="text-headline-lg-mobile font-headline-lg-mobile">{platformStats.totalProducts.toLocaleString()}</p>
</div>
</div>
</div>
<button className="relative z-10 bg-white text-trust-blue px-xl py-md rounded-xl font-bold hover:bg-surface-container-high transition-colors shadow-lg" onClick={() => alert("Downloading Platform Health Report...")}>Download Report</button>
</div>
<div className="md:col-span-12 lg:col-span-3 bg-white rounded-xl p-lg border border-border-gray shadow-sm flex flex-col items-center justify-center text-center">
<div className="w-16 h-16 rounded-full bg-marketplace-orange/10 flex items-center justify-center text-marketplace-orange mb-md">
<span className="material-symbols-outlined text-[32px]">auto_awesome</span>
</div>
<h5 className="font-title-md text-title-md mb-xs">Auto-Optimization</h5>
<p className="text-body-md text-body-md text-on-surface-variant mb-lg">AI-driven fee adjustments are currently enabled for peak hours.</p>
<label className="relative inline-flex items-center cursor-pointer">
<input checked={isAutoOptEnabled} onChange={() => setIsAutoOptEnabled(!isAutoOptEnabled)} className="sr-only peer" type="checkbox"/>
<div className="w-11 h-6 bg-border-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-trust-blue"></div>
</label>
</div>
</div>
</div>
</main>
{/* FAB for Super Admin (Restricted Context) */}
<button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-trust-blue text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-[100]">
<span className="material-symbols-outlined text-[28px]">add_moderator</span>
</button>


{showAddCategoryModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center">
        <h3 className="font-title-lg text-on-surface">Add New Category</h3>
        <button onClick={() => setShowAddCategoryModal(false)} className="text-on-surface-variant hover:text-error-red transition-colors material-symbols-outlined">close</button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-1">Category Name</label>
          <input 
            type="text" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full border border-border-gray rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" 
            placeholder="e.g. Pet Supplies" 
          />
        </div>
      </div>
      <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-gray flex justify-end gap-3">
        <button onClick={() => setShowAddCategoryModal(false)} className="px-4 py-2 text-on-surface-variant font-label-sm hover:bg-surface-container rounded-lg transition-colors">Cancel</button>
        <button 
          onClick={() => {
            if (newCatName) {
              setCategories([...categories, {
                id: Date.now(),
                name: newCatName,
                icon: 'category',
                items: '0',
                width: '0%',
                status: 'ACTIVE',
                statusClass: 'bg-success-green/10 text-success-green'
              }]);
              setNewCatName('');
              setShowAddCategoryModal(false);
            }
          }}
          className="px-4 py-2 bg-primary text-white font-label-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          Add Category
        </button>
      </div>
    </div>
  </div>
)}


{showInviteAdminModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center">
        <h3 className="font-title-lg text-on-surface">Invite New Admin</h3>
        <button onClick={() => setShowInviteAdminModal(false)} className="text-on-surface-variant hover:text-error-red transition-colors material-symbols-outlined">close</button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-1">Email Address</label>
          <input 
            type="email" 
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="w-full border border-border-gray rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" 
            placeholder="colleague@go2pick.com" 
          />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-variant mb-1">Assign Role</label>
          <select 
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value)}
            className="w-full border border-border-gray rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
          >
            <option value="Super Admin">Super Admin</option>
            <option value="Operations">Operations</option>
            <option value="Support Lead">Support Lead</option>
            <option value="Financial Controller">Financial Controller</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {newAdminRole === 'Other' && (
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Custom Role Name</label>
            <input 
              type="text" 
              value={customAdminRole}
              onChange={(e) => setCustomAdminRole(e.target.value)}
              className="w-full border border-border-gray rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" 
              placeholder="e.g. Marketing Manager" 
            />
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-gray flex justify-end gap-3">
        <button onClick={() => setShowInviteAdminModal(false)} className="px-4 py-2 text-on-surface-variant font-label-sm hover:bg-surface-container rounded-lg transition-colors">Cancel</button>
        <button 
          onClick={() => {
            if (newAdminEmail) {
              const assignedRole = newAdminRole === 'Other' ? customAdminRole : newAdminRole;
              window.alert(`Invitation sent to ${newAdminEmail} as ${assignedRole}`);
              setNewAdminEmail('');
              setNewAdminRole('Operations');
              setCustomAdminRole('');
              setShowInviteAdminModal(false);
            }
          }}
          className="px-4 py-2 bg-secondary text-white font-label-sm rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Send Invite
        </button>
      </div>
    </div>
  </div>
)}

{showToast && (
  <div className="fixed bottom-6 right-6 z-[300] bg-success-green text-white px-lg py-md rounded-xl shadow-2xl flex items-center gap-sm animate-slide-up">
    <span className="material-symbols-outlined">check_circle</span>
    <span className="font-label-md font-bold">Changes saved successfully!</span>
  </div>
)}

    </>
  );
}
