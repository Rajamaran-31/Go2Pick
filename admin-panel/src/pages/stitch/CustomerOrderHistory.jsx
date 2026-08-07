import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function CustomerOrderHistory() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return 'Placed';
      case 'preparing': return 'Preparing';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'picked_up': return 'Picked Up';
      case 'completed': return 'Completed';
      case 'delivered': return 'Delivered';
      case 'cancelled':
      case 'canceled': return 'Canceled';
      default: return status || 'Placed';
    }
  };

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/api/orders/my');
        const data = res.data;
        if (data.success && Array.isArray(data.orders)) {
          const mapped = data.orders.map(o => ({
            id: o.id || o._id,
            date: o.created_at || o.createdAt 
              ? new Date(o.created_at || o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent',
            shop: o.shop_name || o.shopName || 'Shop',
            status: mapStatus(o.order_status || o.orderStatus),
            price: o.total_amount || o.totalAmount || 0,
            image: (o.items && o.items[0]?.image) || 'https://placehold.co/150'
          }));
          setOrders(mapped);
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.shop.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === 'All Orders') return true;
    if (activeFilter === 'Active' && (order.status === 'Placed' || order.status === 'Preparing' || order.status === 'Ready for Pickup' || order.status === 'Picked Up')) return true;
    if (activeFilter === 'Completed' && (order.status === 'Completed' || order.status === 'Delivered')) return true;
    if (activeFilter === 'Canceled' && order.status === 'Canceled') return true;
    return false;
  });

  const handleAction = (action) => {
    window.alert(`Action triggered: ${action}`);
  };

  return (
    <div className="py-8 px-4 max-w-2xl mx-auto min-h-screen">
{/* Page Header */}
<header className="py-4">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-4">Order History</h2>
{/* Search Bar */}
<div className="relative w-full mb-6 group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-trust-blue transition-colors">search</span>
<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-border-gray rounded-xl focus:ring-2 focus:ring-trust-blue focus:border-transparent outline-none transition-all shadow-sm" placeholder="Search by Order ID or Shop..." type="text"/>
</div>
{/* Filter Chips */}
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
{['All Orders', 'Active', 'Completed', 'Canceled'].map(filter => (
  <button 
    key={filter}
    onClick={() => setActiveFilter(filter)} 
    className={`whitespace-nowrap px-5 py-2 rounded-full text-label-sm font-label-sm border shadow-sm transition-all hover:shadow-md ${activeFilter === filter ? 'bg-primary text-on-primary border-transparent active-filter' : 'bg-surface-container-lowest text-on-surface-variant border-border-gray hover:border-trust-blue'}`}
  >
    {filter}
  </button>
))}
</div>
</header>
{/* Order List Section */}
<section className="mt-4 space-y-4">
{isLoading ? (
  <div className="text-center py-10 text-on-surface-variant">Loading orders...</div>
) : filteredOrders.length > 0 ? filteredOrders.map(order => (
  <div key={order.id} onClick={() => navigate(`/track-order?id=${order.id}`)} className={`bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-surface-container hover:shadow-md transition-shadow cursor-pointer ${order.status === 'Completed' ? 'opacity-90' : ''} ${order.status === 'Canceled' ? 'opacity-75' : ''}`}>
    <div className="flex gap-4 mb-4">
    <img alt="Shop Logo" className={`w-16 h-16 rounded-lg object-cover ${order.status === 'Canceled' ? 'grayscale' : ''}`} src={order.image}/>
    <div className="flex-1">
    <div className="flex justify-between items-start">
    <h3 className="font-title-md text-title-md text-on-background">{order.shop}</h3>
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
      order.status === 'Preparing' || order.status === 'Placed' ? 'bg-surface-container text-primary' : 
      order.status === 'Ready for Pickup' ? 'bg-success-green/10 text-success-green' : 
      order.status === 'Completed' || order.status === 'Delivered' ? 'bg-surface-dim/40 text-on-surface-variant' : 
      'bg-error-red/10 text-error-red'
    }`}>{order.status}</span>
    </div>
    <p className="text-label-sm font-label-sm text-outline mt-1">{order.date} • #{order.id}</p>
    </div>
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-border-gray">
    <span className={`text-title-md font-title-md text-on-background ${order.status === 'Canceled' ? 'text-outline' : ''}`}>₹{order.price.toFixed(2)}</span>
    <button onClick={(e) => { e.stopPropagation(); navigate(`/track-order?id=${order.id}`); }} className="text-trust-blue font-label-sm text-label-sm flex items-center gap-1 active:scale-95 transition-transform">
                            View Details
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
    </button>
    </div>
  </div>
)) : (
  <div className="flex flex-col items-center justify-center py-20 text-center" id="empty-state">
  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
  <span className="material-symbols-outlined text-4xl text-outline">receipt_long</span>
  </div>
  <h4 className="font-title-md text-title-md text-on-background">No orders found</h4>
  <p className="text-body-md text-outline mt-2 px-12">We couldn't find any orders matching your current search or filter.</p>
  <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-trust-blue text-white rounded-full font-label-sm text-label-sm active:scale-95 transition-transform">Explore Shops</button>
  </div>
)}
</section>
</div>
  );
}
