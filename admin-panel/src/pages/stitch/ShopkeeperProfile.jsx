import { useAppContext } from '../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { Link , useLocation, useNavigate} from 'react-router-dom';
import api from '../../services/api';
import { getShopTimeDisplay } from '../../utils/timeFormat';

export default function ShopkeeperProfile() {
  const { setIsShopkeeperMode, dbStatus } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shop, setShop] = useState(null);
  const [user, setUser] = useState(null);
  const [dashStats, setDashStats] = useState({ totalProducts: null, revenue: null, pendingOrders: null });

  const handleAlert = (msg) => {
    alert(msg);
  };

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [supportChecking, setSupportChecking] = useState(false);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSupportClick = async () => {
    setSupportChecking(true);
    try {
      if (dbStatus === 'disconnected') {
        alert("Support will be available soon.");
        setSupportChecking(false);
        return;
      }
      
      try {
        await api.get('/api/support/tickets');
        setIsSupportModalOpen(true);
      } catch (err) {
        if (err.response?.status === 404) {
          alert("Support will be available soon.");
        } else {
          setIsSupportModalOpen(true);
        }
      }
    } catch (err) {
      alert("Support will be available soon.");
    } finally {
      setSupportChecking(false);
    }
  };

  const handleHelpCenterClick = () => {
    setIsFAQModalOpen(true);
  };

  const handleSubmitSupportTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 5) {
      alert("Subject must be at least 5 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      alert("Description must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: user?.id || user?._id || null,
        role: "shopkeeper",
        supportContext: "shopkeeper",
        shopId: shop?.id || shop?.shopId || null,
        shopName: shop?.name || shop?.shopName || null,
        subject: subject.trim(),
        category: category,
        description: description.trim(),
        priority: "low",
        status: "open",
        createdAt: new Date().toISOString()
      };
      
      // 6. Debug logs: support ticket submit payload
      console.log("DEBUG [Frontend] support ticket submit payload:", payload);

      const res = await api.post('/api/support/tickets', payload);
      if (res.data?.success) {
        alert("Support ticket submitted successfully! Ticket ID: " + (res.data.ticketNumber || res.data.ticketId));
        setSubject('');
        setCategory('general');
        setDescription('');
        setIsSupportModalOpen(false);
      } else {
        alert("Failed to submit ticket: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting ticket: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    api.get('/api/auth/me').then(res => setUser(res.data)).catch(err => console.error("API Error:", err));
    api.get('/api/shopkeeper/my-shop').then(res => {
      const d = res.data?.shop || res.data;
      setShop(d);
    }).catch(err => console.error("API Error:", err));
    api.get('/api/shopkeeper/dashboard').then(res => {
      if (res.data) {
        const d = res.data;
        setDashStats({
          totalProducts: d.totalProducts ?? 0,
          revenue: d.revenue ?? 0,
          pendingOrders: d.pendingOrders ?? 0,
        });
      }
    }).catch(err => console.error("Dashboard API Error:", err));
  }, []);

  return (
    <>
      

<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm flex items-center justify-between px-md h-14">
<div className="flex items-center gap-md">
<button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform cursor-pointer" onClick={() => setIsDrawerOpen(true)}>menu</button>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Go2Pick</h1>
</div>
<div className="flex items-center">
<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-marketplace-orange/20">
<img className="w-full h-full object-cover" data-alt="A professional and friendly portrait of a male shop owner with a warm smile, wearing a clean white apron. He is standing in front of a blurred background of a modern, well-lit organic grocery store. The lighting is bright and natural, emphasizing a high-trust, dependable atmosphere with a professional marketplace aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhKX1P5YuqWxEgZaV23CVO24eKSCx26Tiljh9n7hhJgm6N_Ww2-NRcDmvrgTdFo9VDkwsdu0RR7PrzC5zvNmrVFbBHWBHyY4V_CkQ8ddGWmIJblOYNkqiECxT_bNZtplDVpRWa52m1fJABZfAJDozR5WnBxxDS1PveuiE2FoYCfM6L_R3RSWceVAKD1Ob2GWx1JmmT65gMobv_amlfMLZyEF69e82NDt7XTTWmx8t4K9Lu7sB_uk4njuLD3KjmZ2gemnk6fnp2oEfW"/>
</div>
</div>
</header>
<main className="pt-14 pb-24 px-gutter max-w-container-max mx-auto">

<section className="mt-lg mb-xl">
<div className="bg-white rounded-xl p-lg shadow-sm orange-glow flex flex-col md:flex-row items-center gap-lg">
<div className="relative">
<div className="w-24 h-24 md:w-32 md:w-32 rounded-2xl overflow-hidden border-4 border-marketplace-orange/10">
{shop?.imageUrl || shop?.shopImageUrl || shop?.image ? (
  <img className="w-full h-full object-cover" src={shop.imageUrl || shop.shopImageUrl || shop.image}/>
) : (
  <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant">
    <span className="material-symbols-outlined text-[48px]">storefront</span>
  </div>
)}
</div>
<div className="absolute -bottom-2 -right-2 bg-success-green text-white rounded-full p-1 border-2 border-white">
<span className="material-symbols-outlined text-sm" style={{fontVariationSettings: '\'FILL\' 1'}}>verified</span>
</div>
</div>
<div className="text-center md:text-left flex-1">
<h2 className="font-title-md text-title-md text-on-surface">{shop?.name || shop?.shopName || '—'}</h2>
<p className="text-on-surface-variant mb-md">Managed by <span className="font-semibold">{user?.fullName || user?.name || 'You'}</span></p>
<div className="flex flex-wrap justify-center md:justify-start gap-xs">
<span className="bg-surface-container-high text-primary px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">star</span> {shop?.rating || 0} ({shop?.ratingCount || 0} Reviews)
                        </span>
<span className="bg-surface-container-high text-secondary px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">schedule</span> {getShopTimeDisplay(shop?.opening_time || shop?.openingTime, shop?.closing_time || shop?.closingTime, shop?.isActive ?? shop?.is_active ?? true)}
                        </span>
</div>
</div>
<div className="w-full md:w-auto">
<button className="w-full md:w-auto bg-marketplace-orange text-white px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-md active:scale-95 transition-transform shadow-lg shadow-marketplace-orange/20" onClick={() => { setIsShopkeeperMode(false); navigate('/'); }}>
<span className="material-symbols-outlined">swap_horiz</span>
                        Switch to Customer Mode
                    </button>
</div>
</div>
</section>
<div className="grid grid-cols-1 md:grid-cols-12 gap-lg">

<div className="md:col-span-8 space-y-lg">
<section>
<div className="flex items-center gap-md mb-md">
<div className="w-10 h-10 rounded-lg bg-marketplace-orange/10 flex items-center justify-center text-marketplace-orange cursor-pointer" onClick={() => navigate('/shopkeeper/settings')}>
<span className="material-symbols-outlined">storefront</span>
</div>
<h3 className="font-title-md text-title-md">Shop Management</h3>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
<div className="bg-white p-lg rounded-xl shadow-sm border-l-4 border-marketplace-orange hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/shopkeeper/settings', { state: { section: 'profile-section' } })}>
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-on-surface-variant">info</span>
<span className="material-symbols-outlined text-outline-variant">chevron_right</span>
</div>
<h4 className="font-semibold text-lg mb-xs">Business Information</h4>
<p className="text-body-md text-on-surface-variant">Tax ID, Legal Entity, and Contact Details</p>
</div>
<div className="bg-white p-lg rounded-xl shadow-sm border-l-4 border-warning-amber hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/shopkeeper/settings', { state: { section: 'hours-section' } })}>
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-on-surface-variant">schedule</span>
<span className="material-symbols-outlined text-outline-variant">chevron_right</span>
</div>
<h4 className="font-semibold text-lg mb-xs">Operating Hours</h4>
<p className="text-body-md text-on-surface-variant">Set daily schedules and holiday breaks</p>
</div>
<div className="bg-white p-lg rounded-xl shadow-sm border-l-4 border-trust-blue sm:col-span-2 hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative group" onClick={() => navigate('/shopkeeper/settings', { state: { section: 'location-section' } })}>
<div className="relative z-10">
<div className="flex justify-between items-start mb-md">
<span className="material-symbols-outlined text-on-surface-variant">map</span>
<span className="material-symbols-outlined text-outline-variant">chevron_right</span>
</div>
<h4 className="font-semibold text-lg mb-xs">Pickup Settings</h4>
<p className="text-body-md text-on-surface-variant">Define pickup locations and preparation times</p>
</div>
<div className="absolute top-0 right-0 h-full w-48 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
<img className="w-full h-full object-cover" data-alt="A stylized aerial map representation with subtle orange and blue location pins marking a clean city grid. The aesthetic is modern and corporate, using soft shadows and a light color palette to represent logistical efficiency and service coverage. The lighting is even and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7HGwd03Ar00USesAaEYUEN4jLWptURBSnFUDaDfFkiHubzguY143zppbMusVIFsdSc2dYcgD-BOfM5H5DmNV5BdtEdNNlcWV9foUwGJNHkT2jzoQtOJXFZ_A88MF_pdPMQnDIzju92FLaQjXt7rkm4RrKJd5uKUWeMC8jl2t5yKCexxs1pdU3sWMhSkEdYbNJefXOilJ6YvtY85mBX5QmxUGWC7GJtd9BRum8dtIT1wB8GG80k5ulGHiyqBUx1NlBfd6qcw_VFuza"/>
</div>
</div>
</div>
</section>
<section>
<div className="flex items-center gap-md mb-md">
<div className="w-10 h-10 rounded-lg bg-marketplace-orange/10 flex items-center justify-center text-marketplace-orange cursor-pointer" onClick={() => navigate('/shopkeeper/settings')}>
<span className="material-symbols-outlined">settings</span>
</div>
<h3 className="font-title-md text-title-md">Account Settings</h3>
</div>
<div className="bg-white rounded-xl divide-y divide-border-gray shadow-sm">
<button className="w-full flex items-center justify-between p-lg hover:bg-surface-slate transition-colors" onClick={() => navigate('/settings/payouts')} style={{ display: 'none' }}>
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">payments</span>
<div className="text-left">
<p className="font-semibold">Payout Methods</p>
<p className="text-body-md text-on-surface-variant">Linked Bank Accounts and Cards</p>
</div>
</div>
<span className="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
<button className="w-full flex items-center justify-between p-lg hover:bg-surface-slate transition-colors" onClick={() => navigate('/settings/security')}>
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant">security</span>
<div className="text-left">
<p className="font-semibold">Security</p>
<p className="text-body-md text-on-surface-variant">Password, 2FA, and Logins</p>
</div>
</div>
<span className="material-symbols-outlined text-outline-variant">chevron_right</span>
</button>
</div>
</section>
</div>

<div className="md:col-span-4 space-y-lg">
<section className="bg-primary-container text-on-primary-container p-lg rounded-xl shadow-lg relative overflow-hidden">
<div className="relative z-10">
<h3 className="font-title-md text-title-md mb-md">Need Help?</h3>
<p className="text-body-md mb-lg opacity-90">Our dedicated merchant support team is available 24/7 to help you grow your business.</p>
<div className="space-y-sm">
<button className="w-full bg-white text-primary px-md py-md rounded-lg font-semibold flex items-center justify-center gap-md hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50" onClick={handleContactSupportClick} disabled={supportChecking}>
<span className="material-symbols-outlined">support_agent</span>
                                {supportChecking ? 'Checking...' : 'Contact Support'}
                            </button>
<button className="w-full border border-white/30 text-white px-md py-md rounded-lg font-semibold flex items-center justify-center gap-md hover:bg-white/10 active:scale-95 transition-all" onClick={handleHelpCenterClick}>
<span className="material-symbols-outlined">help</span>
                                Help Center
                            </button>
<button className="w-full border border-white/30 text-white px-md py-md rounded-lg font-semibold flex items-center justify-center gap-md hover:bg-white/10 active:scale-95 transition-all" onClick={() => navigate('/shopkeeper/support/tickets')}>
<span className="material-symbols-outlined">mail</span>
                                My Tickets
                            </button>
</div>
</div>

<div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
</section>
<section className="bg-white p-lg rounded-xl shadow-sm">
<h3 className="font-semibold text-lg mb-md">Quick Summary</h3>
<div className="space-y-md">
<div className="flex justify-between items-center text-body-md">
<span className="text-on-surface-variant">Total Products</span>
<span className="font-bold">{dashStats.totalProducts === null ? '...' : dashStats.totalProducts}</span>
</div>
<div className="flex justify-between items-center text-body-md">
<span className="text-on-surface-variant">This Month Sales</span>
<span className="font-bold text-success-green">{dashStats.revenue === null ? '...' : `₹${parseFloat(dashStats.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
</div>
<div className="flex justify-between items-center text-body-md">
<span className="text-on-surface-variant">Active Orders</span>
<span className="font-bold text-marketplace-orange">{dashStats.pendingOrders === null ? '...' : `${dashStats.pendingOrders} Pending`}</span>
</div>
</div>
</section>
<div className="pb-32">
<button className="w-full py-md text-error font-semibold flex items-center justify-center gap-md hover:bg-error-container/20 rounded-xl transition-colors" onClick={() => handleAlert("Signing Out...")}>
<span className="material-symbols-outlined">logout</span>
                    Sign Out Account
                </button>
</div>
</div>
</div>
</main>



{/* FAB removed per user request */}




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

{/* Contact Support Modal */}
{isSupportModalOpen && (
  <div className="fixed inset-0 z-[250] flex items-center justify-center p-md bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-scale-in">
      <div className="bg-[#f97316] text-white px-lg py-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-white">support_agent</span>
          <h3 className="font-title-md text-title-md font-bold text-white">Contact Support</h3>
        </div>
        <button className="material-symbols-outlined hover:opacity-80 active:scale-95 transition-transform text-white" onClick={() => setIsSupportModalOpen(false)}>close</button>
      </div>
      <form onSubmit={handleSubmitSupportTicket} className="p-lg space-y-md">
        <div className="space-y-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Subject</label>
          <input 
            type="text" 
            className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange focus:ring-1 focus:ring-marketplace-orange outline-none transition-all" 
            placeholder="What issue are you experiencing?" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            required 
            minLength={5}
            maxLength={200}
          />
        </div>
        <div className="space-y-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Category</label>
          <select 
            className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange outline-none"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="general">General Inquiry</option>
            <option value="account">Account & Store Profile</option>
            <option value="products">Product Catalog</option>
            <option value="orders">Orders & Fulfillment</option>
          </select>
        </div>
        <div className="space-y-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Description</label>
          <textarea 
            className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange focus:ring-1 focus:ring-marketplace-orange outline-none transition-all" 
            rows="5" 
            placeholder="Please describe your issue in detail. Must be at least 10 characters." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
            minLength={10}
          ></textarea>
        </div>
        <div className="flex gap-md pt-md">
          <button 
            type="button" 
            className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-md rounded-xl font-semibold transition-colors" 
            onClick={() => setIsSupportModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 bg-[#f97316] text-white py-md rounded-xl font-semibold flex items-center justify-center gap-md hover:bg-opacity-95 active:scale-[0.98] transition-all shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting...
              </>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Help Center (FAQ) Modal */}
{isFAQModalOpen && (
  <div className="fixed inset-0 z-[250] flex items-center justify-center p-md bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-surface-dim w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
      <div className="bg-[#1e3a8a] text-white px-lg py-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-white">help</span>
          <h3 className="font-title-md text-title-md font-bold text-white">Help Center & FAQ</h3>
        </div>
        <button className="material-symbols-outlined hover:opacity-80 active:scale-95 transition-transform text-white" onClick={() => setIsFAQModalOpen(false)}>close</button>
      </div>
      <div className="p-lg overflow-y-auto space-y-lg divide-y divide-border-gray text-left">
        
        <div className="pt-0">
          <h4 className="font-bold text-on-surface mb-xs flex items-center gap-2 text-md">
            <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
            How to add a product?
          </h4>
          <p className="text-body-md text-on-surface-variant pl-4 text-left">
            Navigate to the <span className="font-semibold">Products</span> page from the navigation drawer. Click on the <span className="font-semibold">Add Product</span> button (or use bulk import). Fill in details like title, category, description, and upload product images, then click Save.
          </p>
        </div>

        <div className="pt-md">
          <h4 className="font-bold text-on-surface mb-xs flex items-center gap-2 text-md">
            <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
            How to manage pickup orders?
          </h4>
          <p className="text-body-md text-on-surface-variant pl-4 text-left">
            In the <span className="font-semibold">Orders</span> section, view incoming pickup requests. When an order is prepared, change its status to <span className="font-semibold">Ready for Pickup</span>. The customer will receive an alert to collect their items.
          </p>
        </div>

        <div className="pt-md">
          <h4 className="font-bold text-on-surface mb-xs flex items-center gap-2 text-md">
            <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
            How to update stock?
          </h4>
          <p className="text-body-md text-on-surface-variant pl-4 text-left">
            Open the <span className="font-semibold">Products</span> manager, find the desired item, and edit the stock quantity. You can also quickly toggle the availability switch to mark items out of stock instantly.
          </p>
        </div>

        <div className="pt-md">
          <h4 className="font-bold text-on-surface mb-xs flex items-center gap-2 text-md">
            <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
            How to change shop timing?
          </h4>
          <p className="text-body-md text-on-surface-variant pl-4 text-left">
            Go to <span className="font-semibold">Settings</span> (via profile or drawer) and locate the <span className="font-semibold">Business Hours</span> section. Enable or disable individual weekdays and configure open/close hours using 12-hour formatting. Save all changes.
          </p>
        </div>

        <div className="pt-md">
          <h4 className="font-bold text-on-surface mb-xs flex items-center gap-2 text-md">
            <span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span>
            How to switch back to customer mode?
          </h4>
          <p className="text-body-md text-on-surface-variant pl-4 text-left">
            Click the <span className="font-semibold">Switch to Customer Mode</span> button on the top header or shop card. This toggles your workspace back to the customer shopping experience.
          </p>
        </div>

      </div>
      <div className="p-md bg-surface-container-low border-t border-border-gray flex justify-end shrink-0">
        <button 
          className="bg-[#1e3a8a] text-white px-lg py-sm rounded-xl font-semibold shadow-md active:scale-95 transition-all"
          onClick={() => setIsFAQModalOpen(false)}
        >
          Got it
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
