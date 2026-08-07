import React, { useState, useEffect } from 'react';
import { Link, useNavigate , useLocation} from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isShopApproved , setIsShopkeeperMode, unreadCount } = useAppContext();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    api.get('/api/customer/orders?limit=1').then(res => {
      if (res.data?.orders) {
        const mapped = res.data.orders.map(o => ({
          id: o.id || o._id,
          name: o.items?.[0]?.name || o.items?.[0]?.productName || 'Order',
          image: o.items?.[0]?.image || o.items?.[0]?.productImage || 'https://placehold.co/150',
          price: o.totalAmount || o.total_amount || 0,
          status: o.orderStatus || o.order_status || 'placed'
        }));
        setOrders(mapped.slice(0,1));
      }
    }).catch(err => console.error("API Error:", err));
  }, []);

  const { refreshUser } = useAuth();
  useEffect(() => {
    refreshUser().then(userData => {
      if (userData) setUser(userData);
    }).catch(err => console.error("Error fetching user details in profile page:", err));
  }, []);

  return (
    <div className="py-8 px-gutter max-w-container-max mx-auto space-y-lg min-h-screen">

<section className="relative">
<div className="bg-primary rounded-xl overflow-hidden h-32 md:h-48 mb-16 shadow-lg">
<div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
</div>
<div className="absolute bottom-0 left-gutter flex flex-col md:flex-row items-end md:items-center gap-md">
<div className="relative">
<img alt={user?.fullName || "User"} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface shadow-xl object-cover" src={user?.profileImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuCqaKhpkooD-GGOSou9UxsVlzCVUMrg0eHvq6KI2s93EYjZ_2TaUBy_5yqbENieIx1CEk4Dehv845KEFutVKzxYT31DBtFHufbDAL05lJ9zhtr-s1kF8wXtgoLrM1ToskwCH4RDWOgDTuyDtCR0rsDpMXZFOmiiQys7hBuljFX9mFncVlo48c6-MLsSpkXpiLBn-Yy6n-rF8IHvZU3BIuH0c6GbPL80fL4xPlak3uxA6l-C-_B_zIt9gypIDLvFwGGmHdFOB8Iaprl7"}/>
<div className="absolute bottom-1 right-1 bg-success-green w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-surface"></div>
</div>
<div className="mb-2 md:mb-4">
<h2 className="font-title-md text-title-md text-on-background">{user?.fullName || 'User'}</h2>
<p className="font-body-md text-body-md text-on-surface-variant">{user?.email || ''}</p>
</div>
</div>
</section>

<section className="bg-secondary-container rounded-xl p-lg flex flex-col md:flex-row items-center justify-between gap-md shadow-md text-on-secondary-container">
{user?.isShopkeeper === true || user?.shopkeeperStatus === 'approved' || user?.activeShopId || user?.role === 'shopkeeper' ? (
  <>
    <div className="flex-1 space-y-xs text-center md:text-left">
    <h3 className="font-title-md text-title-md font-bold">Shopkeeper Dashboard</h3>
    <p className="font-body-md text-body-md opacity-90">Toggle between Customer and Shopkeeper modes to manage your orders or shop inventory.</p>
    </div>
    <div className="flex items-center bg-white/20 p-1 rounded-full shadow-inner border border-white/10">
      <button 
        disabled={isSwitching}
        onClick={async () => {
          console.log("Switch to Shopkeeper clicked");
          try {
            setIsSwitching(true);
            
            // Refetch GET /api/auth/me before switching
            const freshUser = await refreshUser();
            if (freshUser) setUser(freshUser);
            
            if ((freshUser || user)?.shopkeeperDashboardEnabled !== true) {
              try {
                await api.post('/api/shopkeeper/enable-dashboard');
              } catch (dashboardErr) {
                console.warn("Enable dashboard error", dashboardErr);
              }
            }
            
            // POST /api/auth/switch-mode
            await api.post('/api/auth/switch-mode', { activeMode: "shopkeeper" });
            
            // Refetch GET /api/auth/me after switch success
            const finalUser = await refreshUser();
            if (finalUser) setUser(finalUser);

            // Navigate to /shopkeeper
            navigate('/shopkeeper');
          } catch (err) {
            const msg = err.response?.data?.detail || err.message;
            console.error("Failed to switch mode:", msg);
            alert("Failed to switch mode: " + msg);
            setIsSwitching(false);
          }
        }}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all bg-marketplace-orange text-white shadow-md hover:opacity-90 ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSwitching ? "Switching..." : "Switch to Shopkeeper"}
      </button>
    </div>
  </>
) : (
  <>
    <div className="flex-1 space-y-xs text-center md:text-left">
    <h3 className="font-title-md text-title-md font-bold">Turn your passion into profit</h3>
    <p className="font-body-md text-body-md opacity-90">Join thousands of sellers on Go2Pick. Start managing your own shop today with our precise shopkeeper tools.</p>
    </div>
    <button onClick={() => navigate('/register-shop')} className="bg-on-secondary-container text-on-secondary px-lg py-sm rounded-full font-label-sm text-label-sm hover:opacity-90 transition-all active:scale-95 flex items-center gap-xs">
    Become a Shopkeeper
    <span className="material-symbols-outlined">arrow_forward</span>
    </button>
  </>
)}
</section>

<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">

<section className="space-y-md">
<div className="flex items-center gap-xs px-base">
<span className="material-symbols-outlined text-trust-blue" style={{fontVariationSettings: '\'FILL\' 1'}}>person_filled</span>
<h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">My Account</h4>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<button onClick={() => navigate('/profile/edit')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">edit_square</span>
<span className="font-body-md text-body-md">Edit Profile</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
<button onClick={() => navigate('/profile/address')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">location_on</span>
<span className="font-body-md text-body-md">Shipping Address</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
</section>

<section className="space-y-md">
<div className="flex items-center gap-xs px-base">
<span className="material-symbols-outlined text-trust-blue" style={{fontVariationSettings: '\'FILL\' 1'}}>activity_zone</span>
<h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Activity</h4>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<Link to="/orders" className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">history</span>
<span className="font-body-md text-body-md">Order History</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</Link>
<button onClick={() => navigate('/profile/reviews')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">reviews</span>
<span className="font-body-md text-body-md">My Reviews</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
</section>

<section className="space-y-md">
<div className="flex items-center gap-xs px-base">
<span className="material-symbols-outlined text-trust-blue" style={{fontVariationSettings: '\'FILL\' 1'}}>tune</span>
<h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Preferences</h4>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<button onClick={() => navigate('/notifications')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">notifications</span>
<span className="font-body-md text-body-md">Notifications</span>
</div>
<div className="flex items-center gap-xs">
{unreadCount > 0 && (
  <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[10px] font-bold">{unreadCount}</span>
)}
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</div>
</button>
<button onClick={() => navigate('/profile/language')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">language</span>
<span className="font-body-md text-body-md">Language</span>
</div>
<div className="flex items-center gap-xs">
<span className="text-label-sm text-outline">EN</span>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</div>
</button>
<button onClick={() => navigate('/support')} className="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">help</span>
<span className="font-body-md text-body-md">Help & Support</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
</section>
</div>

<section className="space-y-md pb-lg">
<h4 className="font-title-md text-title-md px-base">Recent Delivery</h4>
{orders.map(order => (
<div key={order.id} onClick={() => navigate('/track-order')} className="glass-card rounded-xl p-md flex items-center gap-md shadow-sm cursor-pointer hover:shadow-md transition-shadow">
<img alt={order.name} className="w-16 h-16 rounded-lg object-cover bg-surface-container" src={order.image}/>
<div className="flex-1">
<div className="flex justify-between items-start">
<div>
<p className="font-label-sm text-label-sm text-success-green">{order.status}</p>
<p className="font-body-md text-body-md font-bold">{order.name}</p>
</div>
<p className="font-body-md text-body-md font-bold text-trust-blue">₹{order.price.toFixed(2)}</p>
</div>
</div>
</div>
))}
</section>

<div className="flex justify-center pt-md pb-32">
<button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-xs text-error font-label-sm text-label-sm hover:opacity-80 transition-opacity px-lg py-sm">
<span className="material-symbols-outlined">logout</span>
                Sign Out
            </button>
</div>
</div>
  );
}
