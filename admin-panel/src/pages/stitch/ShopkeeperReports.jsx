import { useAppContext } from '../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';


export default function ShopkeeperReports() {
  const { setIsShopkeeperMode } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const handleAlert = (msg) => {
    fetch('/api/action', { method: 'POST' }).finally(() => alert(`Action triggered! ${msg}`));
  };
  const [activeTab, setActiveTab] = useState('Weekly');
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reportData, setReportData] = useState({
    today: { total: 0, count: 0 },
    thisWeek: { total: 0, count: 0 },
    thisMonth: { total: 0, count: 0 },
    dailyBreakdown: []
  });

  useEffect(() => {
    api.get('/api/shopkeeper/reports').then(res => {
      if (res.data?.success) {
        setReportData(res.data);
      }
    }).catch(err => console.error("API Error:", err));
    api.get('/api/shopkeeper/reports/top-products').then(res => {
      if (res.data?.products) setProducts(res.data.products);
    }).catch(err => console.error("API Error:", err));
    api.get('/api/shopkeeper/invoices').then(res => {
      if (res.data?.invoices) setInvoices(res.data.invoices);
    }).catch(err => console.error("API Error:", err));
  }, []);

  // Generate fallback 7 days if dailyBreakdown is not yet loaded or empty
  const defaultBreakdown = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({
    label,
    revenue: 0,
    orders: 0
  }));

  const chartDays = (reportData.dailyBreakdown && reportData.dailyBreakdown.length > 0)
    ? reportData.dailyBreakdown
    : defaultBreakdown;

  const maxRevenue = Math.max(...chartDays.map(d => Number(d.revenue) || 0), 0);

  const activeStat = activeTab === 'Daily'
    ? (reportData.today || { total: 0, count: 0 })
    : activeTab === 'Monthly'
    ? (reportData.thisMonth || { total: 0, count: 0 })
    : (reportData.thisWeek || { total: 0, count: 0 });

  return (
    <>
      

<header className="fixed top-0 w-full z-50 bg-surface-bright/80 backdrop-blur-md shadow-sm flex justify-between items-center h-16 px-md border-b border-border-gray">
<div className="flex items-center gap-xs">
<button className="material-symbols-outlined text-marketplace-orange mr-2" onClick={() => navigate('/shopkeeper')}>arrow_back</button>
<span className="material-symbols-outlined text-marketplace-orange">storefront</span>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-marketplace-orange">Reports</h1>
</div>
<button className="px-sm py-xs bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm rounded-lg hover:bg-surface-container-high active:scale-95 transition-all" onClick={() => { setIsShopkeeperMode(false); navigate('/'); }}>
            Switch to Customer
        </button>
</header>
<main className="pt-20 pb-24 px-md max-w-container-max mx-auto space-y-lg">

<section className="flex bg-white p-1 rounded-xl shadow-sm border border-border-gray w-fit mx-auto">
<button className={`px-lg py-xs font-label-sm text-label-sm rounded-lg transition-all ${activeTab === 'Daily' ? 'bg-marketplace-orange text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-slate'}`} onClick={() => setActiveTab('Daily')}>Daily</button>
<button className={`px-lg py-xs font-label-sm text-label-sm rounded-lg transition-all ${activeTab === 'Weekly' ? 'bg-marketplace-orange text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-slate'}`} onClick={() => setActiveTab('Weekly')}>Weekly</button>
<button className={`px-lg py-xs font-label-sm text-label-sm rounded-lg transition-all ${activeTab === 'Monthly' ? 'bg-marketplace-orange text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-slate'}`} onClick={() => setActiveTab('Monthly')}>Monthly</button>
</section>

<section className="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-border-gray">
<div className="flex flex-wrap justify-between items-end gap-3 mb-lg">
<div>
<h2 className="font-title-md text-title-md text-on-surface font-bold">Revenue Trends</h2>
<p className="font-body-md text-body-md text-on-surface-variant">
  {activeTab === 'Daily' ? 'Today' : activeTab === 'Monthly' ? 'This month' : 'Last 7 days'} performance
</p>
</div>
<div className="text-right">
<span className="font-display-lg text-display-lg text-marketplace-orange font-bold">
  ₹{parseFloat(activeStat.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</span>
<p className="font-label-sm text-label-sm text-success-green flex items-center justify-end gap-1">
<span className="material-symbols-outlined text-sm">trending_up</span> {activeStat.count || 0} Orders
</p>
</div>
</div>

{/* Responsive Chart Area */}
<div className="relative h-60 sm:h-72 w-full pt-8 pb-2">

{/* Background Guidelines */}
<div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-15 pb-8 pt-4">
  <div className="border-b border-dashed border-on-surface w-full flex justify-between">
    <span className="text-[10px] text-on-surface font-mono -mt-2">₹{maxRevenue > 0 ? Number(maxRevenue).toLocaleString('en-IN') : '100'}</span>
  </div>
  <div className="border-b border-dashed border-on-surface w-full flex justify-between">
    <span className="text-[10px] text-on-surface font-mono -mt-2">₹{maxRevenue > 0 ? Number(Math.round(maxRevenue / 2)).toLocaleString('en-IN') : '50'}</span>
  </div>
  <div className="border-b border-dashed border-on-surface w-full"></div>
  <div className="border-b border-solid border-on-surface w-full flex justify-between">
    <span className="text-[10px] text-on-surface font-mono -mt-2">₹0</span>
  </div>
</div>

{/* Responsive Bars */}
<div className="relative h-full w-full flex items-end justify-between gap-1 sm:gap-3 px-1 sm:px-3 z-10">
{chartDays.map((day, idx) => {
  const rev = Number(day.revenue) || 0;
  const barHeight = maxRevenue > 0
    ? Math.max(8, Math.round((rev / maxRevenue) * 100))
    : 8;
  const isToday = idx === chartDays.length - 1;
  const hasRevenue = rev > 0;

  return (
    <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0">
      {/* Tooltip Popup on Hover / Tap */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none absolute -top-12 z-30 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center">
        <span className="font-bold text-amber-400">₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        <span className="text-slate-300 text-[10px]">{day.orders || 0} order{(day.orders || 0) === 1 ? '' : 's'}</span>
      </div>

      {/* Bar Track & Fill */}
      <div className="w-full flex-1 flex items-end justify-center pb-2">
        <div 
          className={`w-full max-w-[28px] sm:max-w-[40px] md:max-w-[52px] rounded-t-md sm:rounded-t-lg transition-all duration-500 shadow-sm ${
            isToday 
              ? 'bg-gradient-to-t from-marketplace-orange to-amber-500 shadow-md ring-2 ring-marketplace-orange/30' 
              : hasRevenue 
              ? 'bg-gradient-to-t from-marketplace-orange/85 to-amber-500/85 group-hover:brightness-110 shadow-sm'
              : 'bg-marketplace-orange/20 group-hover:bg-marketplace-orange/35'
          }`}
          style={{ height: `${barHeight}%` }}
        />
      </div>

      {/* Day Label */}
      <span className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors pt-1 ${
        isToday 
          ? 'text-marketplace-orange font-bold' 
          : hasRevenue
          ? 'text-on-surface font-semibold'
          : 'text-slate-400 group-hover:text-slate-600'
      }`}>
        {day.label}
      </span>
    </div>
  );
})}
</div>
</div>
</section>

<section className="space-y-md">
<div className="flex justify-between items-center px-xs">
<h2 className="font-title-md text-title-md text-on-surface">Top Selling Products</h2>
<button className="text-marketplace-orange font-label-sm text-label-sm hover:underline" onClick={() => handleAlert("Exporting CSV...")}>Export CSV</button>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-slate border-b border-border-gray">
<tr>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant">Product</th>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant text-right">Sold</th>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant text-right">Revenue</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{products.length === 0 ? (
<tr>
  <td colSpan="3" className="px-md py-lg text-center text-on-surface-variant font-body-md text-sm">
    No sales recorded yet. Top selling products will appear here once orders are placed.
  </td>
</tr>
) : (
products.map(product => (
<tr key={product.id} className="hover:bg-surface-slate transition-colors">
<td className="px-md py-md flex items-center gap-md">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
<span className="material-symbols-outlined text-marketplace-orange" data-icon={product.icon}>{product.icon}</span>
</div>
<div>
<p className="font-body-md text-on-surface font-semibold">{product.name}</p>
<p className="font-label-sm text-xs text-on-surface-variant">{product.category}</p>
</div>
</td>
<td className="px-md py-md text-right font-body-md">{product.sold}</td>
<td className="px-md py-md text-right font-body-md font-semibold">{product.revenue}</td>
</tr>
)))}
</tbody>
</table>
</div>
</section>

<section className="bg-marketplace-orange/10 border border-marketplace-orange/20 rounded-xl p-md flex items-start gap-md">
<div className="bg-marketplace-orange text-white p-xs rounded-lg">
<span className="material-symbols-outlined">lightbulb</span>
</div>
<div>
<h4 className="font-title-md text-sm text-marketplace-orange">Pro Insight</h4>
<p className="font-body-md text-sm text-on-surface-variant">Your revenue increased by 15% during peak hours (8 AM - 10 AM). Consider offering a 'Morning Bundle' to further capitalize on this trend.</p>
</div>
</section>

<section className="space-y-md mt-lg" style={{ display: 'none' }}>
<div className="flex justify-between items-center px-xs">
<h2 className="font-title-md text-title-md text-on-surface">Monthly Invoices &amp; Statements</h2>
<button className="text-marketplace-orange font-label-sm text-label-sm hover:underline" onClick={() => handleAlert("Downloading All Invoices...")}>Download All</button>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-slate border-b border-border-gray">
<tr>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant">Billing Period</th>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant text-right">Commission Fee</th>
<th className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{invoices.map(inv => (
<tr key={inv.id} className="hover:bg-surface-slate transition-colors">
<td className="px-md py-md">
<p className="font-body-md text-on-surface font-semibold">{inv.month}</p>
<p className="font-label-sm text-xs text-on-surface-variant">Issued: {inv.date}</p>
</td>
<td className="px-md py-md text-right font-body-md font-semibold text-error-red">-{inv.amount}</td>
<td className="px-md py-md text-right">
<div className="flex items-center justify-end gap-sm">
<button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors" onClick={() => handleAlert(`Downloading ${inv.id}.pdf`)} title="Download PDF">
<span className="material-symbols-outlined text-[18px] text-trust-blue">download</span>
</button>
<button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors" onClick={() => handleAlert(`Sending ${inv.id} to your email...`)} title="Email Invoice">
<span className="material-symbols-outlined text-[18px] text-marketplace-orange">mail</span>
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
</section>

</main>




    </>
  );
}
