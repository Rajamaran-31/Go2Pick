import { useAppContext } from '../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const mapApiOrderToDashboard = (apiOrder) => {
  let status = 'Pending';
  let statusClass = 'bg-trust-blue/10 text-trust-blue border-trust-blue/20';

  const backendStatus = apiOrder.orderStatus ? apiOrder.orderStatus.toLowerCase() : 'placed';
  if (backendStatus === 'placed') {
    status = 'Pending';
    statusClass = 'bg-trust-blue/10 text-trust-blue border-trust-blue/20';
  } else if (backendStatus === 'accepted' || backendStatus === 'preparing') {
    status = 'Preparing';
    statusClass = 'bg-warning-amber/10 text-warning-amber border-warning-amber/20';
  } else if (backendStatus === 'ready_for_pickup') {
    status = 'Ready';
    statusClass = 'bg-success-green/10 text-success-green border-success-green/20';
  } else if (backendStatus === 'picked_up' || backendStatus === 'delivered' || backendStatus === 'completed') {
    status = 'Completed';
    statusClass = 'bg-success-green/10 text-success-green border-success-green/20';
  } else if (backendStatus === 'cancelled' || backendStatus === 'canceled') {
    status = 'Cancelled';
    statusClass = 'bg-outline-variant/10 text-on-surface-variant border-outline-variant/20';
  }

  const itemCount = apiOrder.items ? apiOrder.items.reduce((acc, it) => acc + (it.quantity || 0), 0) : 0;

  return {
    id: `#GP-${apiOrder.id.slice(-4).toUpperCase()}`,
    customer: apiOrder.customerName || 'Customer',
    items: `${itemCount} ${itemCount === 1 ? 'Product' : 'Products'}`,
    total: `₹${parseFloat(apiOrder.totalAmount || 0).toFixed(2)}`,
    status,
    statusClass,
    productsList: (apiOrder.items || []).map(item => {
      const u = item.unit || item.productUnit || item.product_unit || 'pc';
      return {
        name: item.name,
        quantity: item.quantity,
        price: `₹${parseFloat(item.price || 0).toFixed(2)} / ${u}`,
        unit: u
      };
    }),
    raw: apiOrder
  };
};

export default function ShopkeeperDashboard() {
  const { user, setUser, refreshUser } = useAuth();
  const { setIsShopkeeperMode, unreadCount } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const handleAlert = (msg) => {
    fetch('/api/action', { method: 'POST' }).finally(() => alert(`Action triggered! ${msg}`));
  };
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({
    revenue: '₹0.00',
    orders: 0,
    activeProducts: 0,
    pendingOrders: 0
  });
  const [weeklySales, setWeeklySales] = useState([10, 10, 10, 10, 10, 10, 10]); // Mon to Sun heights in %

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, ordersRes, shopRes] = await Promise.all([
          api.get('/api/shopkeeper/dashboard'),
          api.get('/api/shopkeeper/orders?limit=100'),
          api.get('/api/shopkeeper/my-shop')
        ]);

        if (shopRes.data && shopRes.data.success) {
          const shopData = shopRes.data.shop || shopRes.data;
          console.log("DEBUG [ShopkeeperDashboard] my-shop API response:", shopRes.data);
          console.log("DEBUG [ShopkeeperDashboard] saved shop imageUrl:", shopData?.imageUrl);
          console.log("DEBUG [ShopkeeperDashboard] saved coverImageUrl:", shopData?.coverImageUrl);
          setShop(shopData);
        }

        if (dashboardRes.data && dashboardRes.data.success) {
          const d = dashboardRes.data;
          setStats({
            revenue: `₹${parseFloat(d.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            orders: d.totalOrders || 0,
            activeProducts: d.totalProducts || 0,
            pendingOrders: d.pendingOrders || 0
          });
        }

        if (ordersRes.data && ordersRes.data.success) {
          const allOrders = ordersRes.data.orders || [];
          const mapped = allOrders.map(mapApiOrderToDashboard);
          setOrders(mapped.slice(0, 5));

          // Calculate weekly sales chart heights
          const salesByDay = [0, 0, 0, 0, 0, 0, 0];
          allOrders.forEach(o => {
            if (o.orderStatus !== 'cancelled') {
              const date = new Date(o.createdAt);
              const day = date.getDay();
              const index = day === 0 ? 6 : day - 1; // Mon is 0, Sun is 6
              salesByDay[index] += parseFloat(o.totalAmount || 0);
            }
          });
          const maxSales = Math.max(...salesByDay);
          const heights = salesByDay.map(val => {
            if (maxSales === 0) return 10;
            return Math.max(10, Math.round((val / maxSales) * 100));
          });
          setWeeklySales(heights);
        }
      } catch (err) {
        console.error("Failed to fetch shopkeeper dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.get('/api/shopkeeper/products/low-stock').then(res => {
      if (res.data?.products) setLowStock(res.data.products);
    }).catch(err => console.error("API Error:", err));
  }, []);

  return (
    <>

<header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md h-16 w-full">
<div className="flex items-center gap-xs">
<button className="material-symbols-outlined text-marketplace-orange cursor-pointer" onClick={() => setIsDrawerOpen(true)}>menu</button>
<span className="material-symbols-outlined text-marketplace-orange cursor-pointer" onClick={() => navigate('/shop-details')} data-icon="storefront">storefront</span>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold text-marketplace-orange">Shop Management</h1>
</div>
<div className="flex items-center gap-md">
<div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/shopkeeper/notifications')}>
  <span className="material-symbols-outlined text-on-surface-variant hover:text-primary">notifications</span>
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-error-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</div>
<button 
  disabled={isSwitching}
  className={`hidden md:flex font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors px-md py-2 rounded-xl border border-border-gray ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`} 
  onClick={async () => {
    try {
      setIsSwitching(true);
      await api.post('/api/auth/switch-mode', { activeMode: "customer" });
      localStorage.setItem('go2pick_mode', 'customer');
      if (user) {
        setUser({ ...user, activeMode: "customer", currentMode: "customer" });
      }
      navigate('/');
      refreshUser().catch(err => console.error("Background refresh failed", err));
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      console.error("Failed to switch to customer mode:", msg);
      alert("Failed to switch to customer mode: " + msg);
      setIsSwitching(false);
    }
  }}
>
    {isSwitching ? "Switching..." : "Switch to Customer"}
</button>
<div className="cursor-pointer w-10 h-10 rounded-full overflow-hidden border-2 border-marketplace-orange/20" onClick={() => navigate('/shopkeeper/profile')}>
  {shop?.imageUrl || shop?.shopImageUrl || shop?.image ? (
    <img alt="Shop Logo" className="w-full h-full object-cover" src={shop.imageUrl || shop.shopImageUrl || shop.image}/>
  ) : (
    <div className="w-full h-full bg-marketplace-orange/20 flex items-center justify-center text-marketplace-orange font-bold">SK</div>
  )}
</div>
</div>
</header>
<main className="max-w-container-max mx-auto p-md space-y-lg pt-20 pb-32">

<section className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<p className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">{shop?.category || "Category not set"}</p>
<h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold">{shop?.name || shop?.shopName || "Shop name not set"}</h2>
</div>
<div className="flex gap-xs">
<button className="flex items-center gap-xs bg-white text-on-surface-variant font-label-sm text-label-sm px-md py-2 rounded-xl shadow-sm hover:bg-surface-container transition-colors active:scale-95" onClick={() => handleAlert("Filtering Last 7 Days")}>
<span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    Last 7 Days
                </button>
<button className="flex items-center gap-xs bg-marketplace-orange text-on-primary font-label-sm text-label-sm px-md py-2 rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95" onClick={() => handleAlert("Exporting Data...")}>
<span className="material-symbols-outlined text-[18px]">download</span>
                    Export Data
                </button>
</div>
</section>

<section className="grid grid-cols-2 md:grid-cols-4 gap-md">

<div className="bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border-t-4 border-trust-blue">
<div className="flex justify-between items-start mb-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Total Revenue</span>
<span className="material-symbols-outlined text-trust-blue" data-icon="payments">payments</span>
</div>
<p className="font-headline-lg-mobile text-headline-lg-mobile font-bold">{stats.revenue}</p>
<p className="font-label-sm text-label-sm text-success-green flex items-center mt-base">
<span className="material-symbols-outlined text-[14px]">arrow_upward</span> Live
                </p>
</div>

<div className="cursor-pointer bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border-t-4 border-marketplace-orange" onClick={() => navigate('/shopkeeper/orders')}>
<div className="flex justify-between items-start mb-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Total Orders</span>
<span className="material-symbols-outlined text-marketplace-orange" data-icon="shopping_bag">shopping_bag</span>
</div>
<p className="font-headline-lg-mobile text-headline-lg-mobile font-bold">{stats.orders}</p>
<p className="font-label-sm text-label-sm text-success-green flex items-center mt-base">
<span className="material-symbols-outlined text-[14px]">arrow_upward</span> Live
                </p>
</div>

<div className="cursor-pointer bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border-t-4 border-tertiary" onClick={() => navigate('/shopkeeper/products')}>
<div className="flex justify-between items-start mb-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Active Products</span>
<span className="material-symbols-outlined text-tertiary" data-icon="inventory_2">inventory_2</span>
</div>
<p className="font-headline-lg-mobile text-headline-lg-mobile font-bold">{stats.activeProducts}</p>
<p className="font-label-sm text-label-sm text-on-surface-variant mt-base">Active listing</p>
</div>

<div className="bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border-t-4 border-warning-amber">
<div className="flex justify-between items-start mb-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Pending Orders</span>
<span className="material-symbols-outlined text-warning-amber" data-icon="pending">pending</span>
</div>
<p className="font-headline-lg-mobile text-headline-lg-mobile font-bold">{stats.pendingOrders}</p>
<p className="font-label-sm text-label-sm text-on-surface-variant mt-base">Needs processing</p>
</div>
</section>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">

<section className="cursor-pointer lg:col-span-8 bg-surface-container-lowest p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)]" onClick={() => navigate('/shopkeeper/reports')}>
<div className="flex justify-between items-center mb-xl">
<h3 className="font-title-md text-title-md font-bold">Sales this Week</h3>
<div className="flex gap-xs">
<div className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
<span className="w-3 h-3 bg-marketplace-orange rounded-full"></span>
                            Current Week
                        </div>
</div>
</div>

<div className="flex items-end justify-between h-48 md:h-64 pt-md">
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/20 rounded-t-lg transition-all hover:h-[45%]" style={{ height: `${weeklySales[0]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Mon</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/40 rounded-t-lg transition-all hover:h-[70%]" style={{ height: `${weeklySales[1]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Tue</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/60 rounded-t-lg transition-all hover:h-[60%]" style={{ height: `${weeklySales[2]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Wed</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/80 rounded-t-lg transition-all hover:h-[90%]" style={{ height: `${weeklySales[3]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Thu</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange rounded-t-lg transition-all hover:opacity-80" style={{ height: `${weeklySales[4]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Fri</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/50 rounded-t-lg transition-all hover:h-[50%]" style={{ height: `${weeklySales[5]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Sat</span>
</div>
<div className="flex flex-col items-center gap-xs w-full">
<div className="w-2/3 bg-marketplace-orange/30 rounded-t-lg transition-all hover:h-[35%]" style={{ height: `${weeklySales[6]}%` }}></div>
<span className="font-label-sm text-[10px] uppercase text-outline">Sun</span>
</div>
</div>
</section>

<section className="lg:col-span-4 bg-surface-container-lowest p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border-l-4 border-error-red">
<div className="flex justify-between items-center mb-md">
<h3 className="font-title-md text-title-md font-bold">Low Stock Alert</h3>
<span className="bg-error-container text-on-error-container font-label-sm text-[10px] px-2 py-0.5 rounded-full">{lowStock.length} ITEMS</span>
</div>
{lowStock.length === 0 ? (
  <p className="text-on-surface-variant font-body-md text-sm text-center py-md">No low stock items</p>
) : (
<div className="space-y-md">
{lowStock.slice(0, 3).map((item, idx) => (
<div key={idx} className="flex items-center gap-md group cursor-pointer" onClick={() => navigate('/shopkeeper/products')}>
<div className="w-12 h-12 rounded-lg bg-surface-slate overflow-hidden flex-shrink-0">
{item.image ? (
  <img alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform" src={item.image}/>
) : (
  <div className="w-full h-full flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined">inventory_2</span></div>
)}
</div>
<div className="flex-1 border-b border-border-gray pb-xs">
<h4 className="font-body-md text-body-md font-semibold">{item.name}</h4>
<p className={`font-label-sm text-label-sm ${item.stock <= 5 ? 'text-error-red' : 'text-warning-amber'}`}>Only {item.stock} left in stock</p>
</div>
<button className="material-symbols-outlined text-outline hover:text-marketplace-orange">chevron_right</button>
</div>
))}
</div>
)}
<button className="w-full mt-lg text-marketplace-orange font-label-sm text-label-sm py-2 rounded-lg border border-marketplace-orange/20 hover:bg-secondary-fixed transition-colors" onClick={() => setShowLowStockModal(true)}>
    Show all low stock
</button>
</section>

<section className="lg:col-span-12 bg-surface-container-lowest p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)]">
<div className="flex justify-between items-center mb-xl">
<h3 className="font-title-md text-title-md font-bold">Recent Orders</h3>
<Link to="/shopkeeper/orders" className="text-primary font-label-sm hover:underline">View All Orders</Link>
</div>
{orders.length === 0 ? (
  <div className="py-xl text-center text-on-surface-variant">
    <span className="material-symbols-outlined text-[48px] mb-2 block">receipt_long</span>
    <p>No orders yet.</p>
  </div>
) : (
<div className="overflow-x-auto hide-scrollbar">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-border-gray">
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Items</th>
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total</th>
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-border-gray">
{orders.map((order, idx) => (
<tr key={idx} className="hover:bg-surface-slate transition-colors">
<td className="py-md font-body-md text-body-md">{order.id}</td>
<td className="py-md font-body-md text-body-md font-semibold">{order.customer}</td>
<td className="py-md font-body-md text-body-md">{order.items}</td>
<td className="py-md font-body-md text-body-md font-bold">{order.total}</td>
<td className="py-md">
<span className={`font-label-sm text-[11px] px-2.5 py-1 rounded-full border ${order.statusClass}`}>{order.status}</span>
</td>
<td className="py-md text-right">
<button className="text-marketplace-orange hover:underline text-xs font-bold bg-marketplace-orange/10 px-2.5 py-1 rounded" onClick={() => setSelectedOrder(order)}>View Details</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</section>
</div>
</main>

{/* FAB removed per user request */}



<div className="hidden md:block">

</div>


{isDrawerOpen && (
  <div className="fixed inset-0 z-[200] flex">
    <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
    <div className="relative w-64 bg-surface dark:bg-surface-dim h-full shadow-lg flex flex-col p-4 animate-slide-in-left">
      <button className="self-end material-symbols-outlined mb-4" onClick={() => setIsDrawerOpen(false)}>close</button>
      <h2 className="text-title-md font-bold mb-4">Navigation Menu</h2>
      <div className="flex flex-col gap-2">
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard</button>
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper/orders'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">receipt_long</span> Orders</button>
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper/products'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">inventory_2</span> Products</button>
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper/reports'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">analytics</span> Reports</button>
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper/settings'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">settings</span> Settings</button>
          <button onClick={() => { setIsDrawerOpen(false); navigate('/shopkeeper/support'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">support_agent</span> Support Tickets</button>
      </div>
    </div>
  </div>
)}
{showLowStockModal && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
      <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-surface-slate">
        <h3 className="font-title-lg text-on-surface">All Low Stock Products</h3>
        <button onClick={() => setShowLowStockModal(false)} className="text-on-surface-variant hover:text-error-red transition-colors material-symbols-outlined">close</button>
      </div>
      <div className="p-6 overflow-y-auto space-y-md custom-scrollbar">
        {lowStock.length === 0 ? (
          <p className="text-center text-on-surface-variant">No low stock items</p>
        ) : lowStock.map((item, idx) => (
          <div key={idx} className="flex items-center gap-md group cursor-pointer border p-3 rounded-lg border-border-gray hover:border-marketplace-orange/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-surface-slate overflow-hidden flex-shrink-0">
              {item.image ? (
                <img alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform" src={item.image}/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined">inventory_2</span></div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-body-md text-body-md font-semibold text-on-surface">{item.name}</h4>
              <p className={`font-label-sm text-label-sm ${item.stock <= 5 ? 'text-error-red' : 'text-warning-amber'}`}>Only {item.stock} left in stock</p>
            </div>
            <button onClick={() => { setShowLowStockModal(false); navigate('/shopkeeper/products'); }} className="px-3 py-1 bg-marketplace-orange/10 text-marketplace-orange rounded hover:bg-marketplace-orange/20 text-[12px] font-bold">Restock</button>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-gray flex justify-end">
        <button onClick={() => setShowLowStockModal(false)} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-sm transition-colors text-on-surface">Close</button>
      </div>
    </div>
  </div>
)}
{selectedOrder && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-surface-slate">
        <h3 className="font-title-lg text-on-surface">Order Details ({selectedOrder.id})</h3>
        <button onClick={() => setSelectedOrder(null)} className="text-on-surface-variant hover:text-error-red transition-colors material-symbols-outlined">close</button>
      </div>
      <div className="p-6 space-y-md">
        <div className="bg-surface-slate p-md rounded-xl space-y-xs border border-border-gray mb-md text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Customer Mobile:</span>
            <span className="text-on-surface font-bold">{selectedOrder.raw?.customerPhone || selectedOrder.raw?.customer_phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Order Code (Pickup):</span>
            <span className="text-on-surface font-bold tracking-wider">{selectedOrder.raw?.pickupCode || selectedOrder.raw?.pickup_code || 'N/A'}</span>
          </div>
        </div>
        {selectedOrder.productsList ? selectedOrder.productsList.map((prod, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-border-gray pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-container rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-outline">shopping_bag</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{prod.name}</p>
                <p className="text-xs text-on-surface-variant">Qty: {prod.quantity} {prod.unit === 'pc' ? (prod.quantity > 1 ? 'pcs' : 'pc') : prod.unit}</p>
              </div>
            </div>
            <span className="font-bold text-on-surface">{prod.price}</span>
          </div>
        )) : (
          <div className="flex justify-between items-center border-b border-border-gray pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-container rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-outline">shopping_bag</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">Various Items</p>
                <p className="text-xs text-on-surface-variant">Qty: {selectedOrder.items.split(' ')[0]}</p>
              </div>
            </div>
            <span className="font-bold text-on-surface">{selectedOrder.total}</span>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-gray flex justify-end">
        <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-sm transition-colors text-on-surface">Close</button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
