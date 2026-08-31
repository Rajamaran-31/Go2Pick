import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function NotificationsCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { 
    notifications, 
    setIsShopApproved, 
    setIsShopkeeperMode, 
    setHasGetAccessNotification,
    refreshNotifications,
    markAllNotificationsAsRead,
    unreadCount
  } = useAppContext();
  const { user, refreshUser } = useAuth();

  React.useEffect(() => {
    refreshNotifications().then(() => {
      markAllNotificationsAsRead();
    });
  }, []);

  const visibleNotifications = notifications.filter(n => !(n.type === "SHOPKEEPER_APPLICATION" && user?.role !== "super_admin"));

  return (
    <>
      
{/* TopAppBar */}
<header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center justify-between px-md h-14">
<div className="flex items-center gap-sm">
<button onClick={() => setIsDrawerOpen(true)} className="active:scale-95 transition-transform text-primary hover:opacity-80 transition-opacity cursor-pointer">
<span className="material-symbols-outlined">menu</span>
</button>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<button className="relative active:scale-95 transition-transform text-primary">
<span className="material-symbols-outlined">notifications</span>
{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-error-red w-2 h-2 rounded-full"></span>}
</button>
<div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
<img alt="User Profile" className="w-full h-full object-cover" data-alt="A professional studio headshot of a friendly, diverse man in his late 20s with a modern haircut and stylish glasses. The background is a soft, solid pastel blue that complements the corporate modern aesthetic of the UI. Lighting is bright and even, highlighting clear skin and a warm, inviting smile, reinforcing trust and dependability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZG6KrovJxIHiZxn6FYi-NfLd92btdlcT_SjW3u-uWhD0duAmbzP1cFu05cnYpo5wi36l6mdjCFFvswhoDyez2YvP65n-ZpsVHqqDBdgr0N5BsOzM90bT4PTGam_rSTXFnCoBsMAvGf2sXYDKi1HTx5TMBHRh5QGP5TOkTAcc3hNQQlrXFNFb8SIJpNRL5AhkqEnve_A4Eoc3aWRZkdzEEbLEvbiBWc0we4WkkeKi-sITtbnuvyDgPbij3uMw-_dqyZqOpdxyGh7x9"/>
</div>
</div>
</header>
<main className="pt-20 px-gutter max-w-2xl mx-auto">
{/* Header Section */}
<div className="mb-lg flex justify-between items-end">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Notifications</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Stay updated with your orders and local offers</p>
</div>
<button onClick={markAllNotificationsAsRead} className="font-label-sm text-label-sm text-primary hover:underline transition-all">Mark all as read</button>
</div>
{/* Filters */}
<div className="flex gap-sm mb-lg overflow-x-auto pb-2 no-scrollbar">
<button className="px-md py-xs rounded-full bg-primary text-on-primary font-label-sm text-label-sm shadow-sm active:scale-95 transition-all">All</button>
<button className="px-md py-xs rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all active:scale-95">Orders</button>
<button className="px-md py-xs rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all active:scale-95">Promos</button>
<button className="px-md py-xs rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-all active:scale-95">New Shops</button>
</div>
{/* Notifications List */}
<div className="space-y-sm">
  {visibleNotifications.length === 0 ? (
    <div className="py-2xl flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center mb-lg">
        <span className="material-symbols-outlined text-[48px] text-outline">notifications_off</span>
      </div>
      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">All caught up!</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-xs">You don't have any new notifications at the moment.</p>
    </div>
  ) : (
    visibleNotifications.map((n) => {
      console.log("DEBUG [NotificationsCenter] notification object:", n);
      console.log("DEBUG [NotificationsCenter] actionType:", n.actionType);
      const isShopApprovalNotif = n.actionType === "ENABLE_SHOPKEEPER_DASHBOARD" || 
                                  n.type === "SHOP_APPROVED" || 
                                  n.type === "shop_approved" || 
                                  Boolean(n.show_get_access_button);
      if (isShopApprovalNotif) {
        return (
          <div key={n.id} className={`group bg-surface-container-low p-md rounded-xl shadow-sm border-l-4 border-success-green hover:bg-surface-container-high transition-all ${n.isRead ? 'opacity-70' : ''}`}>
            <div className="flex gap-md">
              <div className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center flex-shrink-0 text-success-green">
                <span className="material-symbols-outlined" style={{'fontVariationSettings': "'FILL' 1"}}>storefront</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-title-md text-body-lg font-bold text-on-surface">{n.title}</h3>
                  {!n.isRead && <span className="font-label-sm text-[10px] text-success-green font-bold">New</span>}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{n.message}</p>
                <div className="mt-md flex gap-sm">
                  <button 
                    onClick={() => {
                      // Call enable-dashboard directly as requested
                      api.post(`/api/shopkeeper/enable-dashboard`)
                      .then(res => {
                        console.log("DEBUG [NotificationsCenter] enable dashboard response:", res.data);
                        refreshUser().then(() => {
                          setIsShopApproved(true);
                          setIsShopkeeperMode(true);
                          setHasGetAccessNotification(false);
                          alert("🎉 Shopkeeper mode unlocked! Opening your dashboard.");
                          navigate('/shopkeeper');
                        });
                      })
                      .catch(err => {
                        console.error("DEBUG [NotificationsCenter] Failed to enable shopkeeper dashboard:", err);
                        alert(`Failed to enable shopkeeper dashboard. Error: ${err.response?.data?.detail || err.message}`);
                      });
                    }}
                    className="bg-success-green text-on-primary font-label-sm text-label-sm px-md py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-bold flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                    {n.actionLabel || "Get Access to Shopkeeper Dashboard"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Default generic notification
      return (
        <div key={n.id} className={`group bg-surface-container-lowest p-md rounded-xl shadow-sm hover:bg-surface-container-low transition-all ${n.isRead ? 'opacity-70' : ''}`}>
          <div className="flex gap-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-title-md text-body-lg font-bold text-on-surface">{n.title}</h3>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{n.message}</p>
            </div>
          </div>
        </div>
      );
    })
  )}
</div>
{/* Empty State Logic (Hidden by default) */}
<div className="hidden py-2xl flex flex-col items-center justify-center text-center" id="empty-state">
<div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center mb-lg">
<span className="material-symbols-outlined text-[48px] text-outline">notifications_off</span>
</div>
<h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">All caught up!</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-xs">You don't have any new notifications at the moment. Check back later for updates.</p>
</div>
</main>
{/* BottomNavBar */}



{isDrawerOpen && (
  <div className="fixed inset-0 z-[200] flex">
    <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
    <div className="relative w-64 bg-surface dark:bg-surface-dim h-full shadow-lg flex flex-col p-4 animate-slide-in-left">
      <button className="self-end material-symbols-outlined mb-4" onClick={() => setIsDrawerOpen(false)}>close</button>
      <h2 className="text-title-md font-bold mb-4">Navigation Menu</h2>
      <div className="flex flex-col gap-2">
         <button onClick={() => { setIsDrawerOpen(false); navigate('/'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">home</span> Home</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/explore'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">explore</span> Explore</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/cart'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">shopping_cart</span> Cart</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/orders'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">receipt_long</span> Orders</button>
         <button onClick={() => { setIsDrawerOpen(false); navigate('/profile'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">person</span> Profile</button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
