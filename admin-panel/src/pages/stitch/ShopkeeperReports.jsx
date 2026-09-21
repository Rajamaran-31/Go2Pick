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
    thisWeek: { total: 0, count: 0 },
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

  const maxRevenue = reportData.dailyBreakdown.length > 0
    ? Math.max(...reportData.dailyBreakdown.map(d => d.revenue))
    : 0;

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
<div className="flex justify-between items-end mb-lg">
<div>
<h2 className="font-title-md text-title-md text-on-surface">Revenue Trends</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Last 7 days performance</p>
</div>
<div className="text-right">
<span className="font-display-lg text-display-lg text-marketplace-orange">₹{parseFloat(reportData.thisWeek?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
<p className="font-label-sm text-label-sm text-success-green flex items-center justify-end gap-1">
<span className="material-symbols-outlined text-sm">trending_up</span> {reportData.thisWeek?.count || 0} Orders
                    </p>
</div>
</div>

<div className="relative h-64 flex items-end justify-between gap-2 px-sm">

<div className="absolute left-0 top-0 h-full w-full flex flex-col justify-between pointer-events-none opacity-10">
<div className="border-t border-on-surface w-full"></div>
<div className="border-t border-on-surface w-full"></div>
<div className="border-t border-on-surface w-full"></div>
<div className="border-t border-on-surface w-full"></div>
</div>

{reportData.dailyBreakdown.map((day, idx) => {
  const barHeight = maxRevenue > 0
    ? Math.max(10, Math.round((day.revenue / maxRevenue) * 100))
    : 10;
  const isToday = idx === reportData.dailyBreakdown.length - 1;
  return (
    <div key={idx} className="flex-1 flex flex-col items-center group">
      <div 
        className={`chart-bar w-full max-w-[40px] rounded-t-lg transition-all ${
          isToday 
            ? 'bg-marketplace-orange shadow-lg' 
            : 'bg-surface-container-high group-hover:bg-surface-container-highest'
        }`}
        style={{ height: `${barHeight}%` }}
        title={`₹${day.revenue} (${day.orders} orders)`}
      ></div>
      <span className={`mt-xs font-label-sm text-label-sm ${isToday ? 'text-marketplace-orange font-bold' : 'text-on-surface-variant'}`}>
        {day.label}
      </span>
    </div>
  );
})}
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
{products.map(product => (
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
))}
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
