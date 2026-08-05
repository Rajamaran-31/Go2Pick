import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api, { shopkeeperAPI } from '../../services/api';

export default function PayoutEarningsDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleWithdraw = () => {
    fetch('/api/withdraw', { method: 'POST' }).finally(() => {
      alert('Action triggered! Withdrawal Initiated');
      const toast = document.getElementById('payoutToast');
      if (toast) {
        toast.style.transform = 'translateX(0)';
        setTimeout(() => toast.style.transform = 'translateX(150%)', 3000);
      }
    });
  };

  const [transactions, setTransactions] = useState([]);
  const [earningsData, setEarningsData] = useState({ balance: 0, lastPayoutDate: null });

  useEffect(() => {
    api.get('/api/shopkeeper/payouts/transactions').then(res => {
      if (res.data?.transactions) setTransactions(res.data.transactions);
      if (res.data?.balance !== undefined) setEarningsData(prev => ({ ...prev, balance: res.data.balance }));
      if (res.data?.lastPayoutDate) setEarningsData(prev => ({ ...prev, lastPayoutDate: res.data.lastPayoutDate }));
    }).catch(err => console.error("API Error:", err));
  }, []);

  const [autoBillingEnabled, setAutoBillingEnabled] = useState(true);

  return (
    <>
      
{/* Top Navigation Bar */}
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm flex items-center justify-between px-md h-14 w-full">
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform" data-icon="arrow_back" onClick={() => navigate('/shopkeeper/reports')}>arrow_back</button>
<span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Go2Pick</span>
</div>
<div className="flex items-center gap-md">
<div className="hidden md:flex items-center gap-lg">
<nav className="flex gap-md">
<Link className="text-on-surface-variant hover:opacity-80 transition-opacity" to="/admin">Home</Link>
<Link className="text-on-surface-variant hover:opacity-80 transition-opacity" to="/admin/orders">Orders</Link>
<Link className="text-on-surface-variant hover:opacity-80 transition-opacity" to="/admin/profile">Profile</Link>
<Link className="text-primary font-bold border-b-2 border-primary" to="/admin/payouts">Earnings</Link>
</nav>
</div>
<img alt="User Profile" className="h-8 w-8 rounded-full border-2 border-surface-container shadow-sm" data-alt="A professional headshot of a mature male shop owner with a friendly smile, set in a brightly lit modern retail environment with soft blurred shelves of organized merchandise in the background. The lighting is warm and cinematic, reinforcing a high-trust, professional marketplace atmosphere with a clean and polished aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr0g-PBIXmWDYgVSlUMhDdCQG41sRSTZzffb2n8cnrRFxektOf4CGFe_PIrWg5bNPk7HSPrrljCP01eLMoVmEVcuabQDoeF_89wudvxs3fWVkKLv-pfZ5ROmLXpl6BdkmWlOZouztbLp88m8ETtssMFxb7jtcmBMFBZAtgmRSYDyQAhyrKKGHG7gMhR7pSZITlqjfPsCQb6DIveo0xi8-6sorZh-PGUWoOkmWOAWlN0z_waTG5zw331xYxPR6Eihgzwr9C0UXOxKpb"/>
</div>
</header>
<main className="pt-20 pb-24 px-gutter max-w-container-max mx-auto">
{/* Hero Section: Earnings Overview */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
{/* Balance Card */}
<div className="lg:col-span-1 bg-surface-container-lowest rounded-xl p-lg shadow-sm flex flex-col justify-between border-t-4 border-marketplace-orange overflow-hidden relative">
<div className="absolute top-0 right-0 p-lg opacity-10 pointer-events-none">
<span className="material-symbols-outlined text-6xl" data-icon="payments">payments</span>
</div>
<div>
<h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Available for Withdrawal</h2>
<div className="flex items-baseline gap-xs">
<span className="font-display-lg text-display-lg text-on-surface">₹{earningsData.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
</div>
</div>
<div className="mt-xl flex flex-col gap-md">
<button className="w-full bg-secondary-container text-on-secondary-container py-md px-lg rounded-xl font-title-md text-title-md shadow-md active:scale-[0.98] transition-all hover:bg-secondary active:text-white flex items-center justify-center gap-sm" onClick={handleWithdraw}>
<span className="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
                        Withdraw Funds
                    </button>
<p className="text-center font-label-sm text-label-sm text-on-surface-variant">{earningsData.lastPayoutDate ? `Last payout on ${new Date(earningsData.lastPayoutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No previous payouts'}</p>
</div>
</div>
{/* Earnings Chart */}
<div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-lg shadow-sm flex flex-col border-t-4 border-primary">
<div className="flex justify-between items-center mb-lg">
<h3 className="font-title-md text-title-md text-on-surface">Weekly Performance</h3>
<select className="bg-surface-slate border-border-gray rounded-lg py-1 px-4 font-label-sm text-label-sm focus:ring-primary focus:border-primary">
<option>Last 7 Days</option>
<option>Last 30 Days</option>
</select>
</div>
{/* Visual Placeholder for a Line Chart */}
<div className="flex-grow h-48 w-full flex items-end justify-between gap-2 px-md">
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[30%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Mon</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[50%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Tue</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[45%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Wed</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[70%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Thu</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[60%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Fri</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[85%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Sat</span>
</div>
<div className="group relative flex-1 flex flex-col items-center">
<div className="w-full bg-primary/20 rounded-t-sm h-[40%] group-hover:bg-primary transition-colors cursor-pointer"></div>
<span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">Sun</span>
</div>
</div>
<div className="mt-4 flex items-center justify-center gap-lg">
<div className="flex items-center gap-xs">
<span className="w-3 h-3 rounded-full bg-primary"></span>
<span className="font-label-sm text-label-sm">Gross Sales</span>
</div>
<div className="flex items-center gap-xs">
<span className="w-3 h-3 rounded-full bg-marketplace-orange"></span>
<span className="font-label-sm text-label-sm">Total Profit</span>
</div>
</div>
</div>
</div>
{/* Transactions Section */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-xl">
<div className="px-lg py-md border-b border-border-gray flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
<h3 className="font-title-md text-title-md text-on-surface">Recent Transactions</h3>
<div className="flex items-center gap-sm w-full sm:w-auto">
<div className="relative flex-grow sm:flex-grow-0">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="search">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-slate border-border-gray rounded-lg w-full font-body-md text-body-md focus:ring-primary focus:border-primary outline-none" placeholder="Search Order ID..." type="text"/>
</div>
<button className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant border border-border-gray px-4 py-2 rounded-lg hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined" data-icon="filter_list">filter_list</span>
                        Filter
                    </button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead className="bg-surface-slate border-b border-border-gray">
<tr>
<th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">ORDER ID</th>
<th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">DATE</th>
<th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">AMOUNT</th>
<th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">FEE (2.5%)</th>
<th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant text-right">NET EARNINGS</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{transactions.map((tx, idx) => (
<tr key={idx} className="hover:bg-surface-container-low transition-colors group">
<td className="px-lg py-md">
<span className="font-body-md text-body-md text-primary font-semibold">{tx.id}</span>
</td>
<td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">{tx.date}</td>
<td className="px-lg py-md font-body-md text-body-md">{tx.amount}</td>
<td className="px-lg py-md font-body-md text-body-md text-error-red">{tx.fee}</td>
<td className="px-lg py-md font-body-md text-body-md text-right font-bold text-success-green">{tx.net}</td>
</tr>
))}
</tbody>
</table>
</div>
<div className="px-lg py-md border-t border-border-gray flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Showing {Math.min(transactions.length, 5)} of {transactions.length} transactions</span>
<div className="flex gap-xs">
<button className="p-2 border border-border-gray rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30" disabled="">
<span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
</button>
<button className="p-2 border border-border-gray rounded-lg hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</div>
{/* Automated Billing & Invoices Management */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-xl">
<div className="px-lg py-md border-b border-border-gray flex justify-between items-center bg-primary/5">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
<h3 className="font-title-md text-title-md text-on-surface">Automated Billing &amp; Invoices</h3>
</div>
<div className="flex items-center gap-sm">
<span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Auto-Send Monthly Invoices</span>
<button 
  onClick={() => setAutoBillingEnabled(!autoBillingEnabled)} 
  className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${autoBillingEnabled ? 'bg-success-green' : 'bg-surface-slate border border-border-gray'}`}>
  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${autoBillingEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
</button>
</div>
</div>
<div className="p-lg grid grid-cols-1 md:grid-cols-3 gap-md">
<div className="border border-border-gray rounded-lg p-md">
<p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Next Batch Scheduled For</p>
<p className="font-title-md text-primary font-bold">—</p>
</div>
<div className="border border-border-gray rounded-lg p-md">
<p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Pending Invoices to Generate</p>
<p className="font-title-md text-marketplace-orange font-bold">—</p>
</div>
<div className="border border-border-gray rounded-lg p-md flex flex-col justify-center">
<button className="w-full py-2 bg-trust-blue text-white rounded-lg font-label-md hover:bg-primary transition-colors flex items-center justify-center gap-xs" onClick={() => {
    alert('Action triggered! Simulating email dispatch to all shopkeepers...');
}}>
<span className="material-symbols-outlined text-[18px]">send</span>
    Dispatch Now (Manual)
</button>
</div>
</div>
<div className="bg-surface-slate px-lg py-sm text-xs text-on-surface-variant">
Note: The automated cron job triggers on the 1st of every month to compute commission fees and dispatch PDF invoices to all active shopkeepers.
</div>
</div>

{/* Role Insight Bento Card */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
<div className="bg-surface-container-high rounded-xl p-lg flex items-center gap-lg">
<div className="p-md bg-white/50 rounded-full">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="monitoring">monitoring</span>
</div>
<div>
<h4 className="font-title-md text-title-md text-primary mb-1">Growth Forecast</h4>
<p className="font-body-md text-body-md text-on-surface-variant">Growth projections are calculated based on your recent sales trajectory and will appear here once enough data is available.</p>
</div>
</div>
<div className="bg-secondary-fixed rounded-xl p-lg flex items-center gap-lg">
<div className="p-md bg-white/50 rounded-full">
<span className="material-symbols-outlined text-secondary text-3xl" data-icon="verified_user">verified_user</span>
</div>
<div>
<h4 className="font-title-md text-title-md text-secondary mb-1">Account Protection</h4>
<p className="font-body-md text-body-md text-on-secondary-fixed-variant">All transactions are secured with 256-bit encryption and monitored by Go2Pick Fraud Prevention.</p>
</div>
</div>
</div>
</main>
{/* Bottom Navigation (Mobile Only) */}

{/* Toast Notification (Hidden by default) */}
<div className="fixed top-20 right-4 translate-x-[150%] transition-transform duration-300 z-50" id="payoutToast">
<div className="bg-primary text-white px-lg py-md rounded-xl shadow-xl flex items-center gap-md">
<span className="material-symbols-outlined" data-icon="check_circle">check_circle</span>
<div>
<p className="font-bold">Withdrawal Initiated</p>
<p className="text-xs opacity-90">Expected arrival: 1-3 business days.</p>
</div>
</div>
</div>


    </>
  );
}
