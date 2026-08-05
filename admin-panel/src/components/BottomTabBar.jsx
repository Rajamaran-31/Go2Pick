import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function BottomTabBar() {
  const location = useLocation();
  const { user } = useAuth();
  const activeMode = user?.activeMode || user?.currentMode || localStorage.getItem('go2pick_mode') || 'customer';

  // Hide the bottom tab bar on these specific routes
  const hiddenPrefixes = ['/login', '/signup', '/welcome', '/forgot-password', '/reset-password', '/verify-email', '/admin/login'];
  const isHidden = hiddenPrefixes.some(prefix => location.pathname === prefix || location.pathname?.startsWith(prefix + '/'));

  if (isHidden) {
    return null;
  }

  // Admin Tab Bar Layout
  if (location.pathname.startsWith('/admin')) {
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[100] bg-surface dark:bg-surface-dim shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center border-t border-border-gray/30 rounded-t-xl"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)', 
          height: 'calc(64px + env(safe-area-inset-bottom))', 
          boxSizing: 'border-box' 
        }}
      >
        <Link 
          to="/admin" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 transition-all ${location.pathname === '/admin' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">dashboard</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Dashboard</span>
        </Link>
        <Link 
          to="/admin/approvals" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 transition-all ${location.pathname.includes('/admin/approvals') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">rule</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Approvals</span>
        </Link>
        <Link 
          to="/admin/users" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 transition-all ${location.pathname.includes('/admin/users') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">group</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Users</span>
        </Link>
        <Link 
          to="/admin/shops" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 transition-all ${location.pathname.includes('/admin/shops') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">storefront</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Shops</span>
        </Link>
        <Link 
          to="/admin/settings" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 transition-all ${location.pathname.includes('/admin/settings') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">settings</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Settings</span>
        </Link>
      </nav>
    );
  }

  // Shopkeeper Tab Bar Layout
  if (activeMode === 'shopkeeper' || location.pathname.startsWith('/shopkeeper')) {
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[100] bg-surface dark:bg-surface-dim shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center border-t border-border-gray/30 rounded-t-xl"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)', 
          height: 'calc(64px + env(safe-area-inset-bottom))', 
          boxSizing: 'border-box' 
        }}
      >
        <Link 
          to="/shopkeeper" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center mx-1 py-1 rounded-xl transition-all ${location.pathname === '/shopkeeper' ? 'text-marketplace-orange bg-secondary-fixed' : 'text-on-surface-variant hover:text-marketplace-orange'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">dashboard</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Dashboard</span>
        </Link>
        <Link 
          to="/shopkeeper/orders" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center mx-1 py-1 rounded-xl transition-all ${location.pathname.includes('/shopkeeper/orders') ? 'text-marketplace-orange bg-secondary-fixed' : 'text-on-surface-variant hover:text-marketplace-orange'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">receipt_long</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Orders</span>
        </Link>
        <Link 
          to="/shopkeeper/products" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center mx-1 py-1 rounded-xl transition-all ${location.pathname.includes('/shopkeeper/products') || location.pathname.includes('/shopkeeper/bulk') ? 'text-marketplace-orange bg-secondary-fixed' : 'text-on-surface-variant hover:text-marketplace-orange'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">inventory_2</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Products</span>
        </Link>
        <Link 
          to="/shopkeeper/reports" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center mx-1 py-1 rounded-xl transition-all ${location.pathname.includes('/shopkeeper/reports') ? 'text-marketplace-orange bg-secondary-fixed' : 'text-on-surface-variant hover:text-marketplace-orange'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">analytics</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Reports</span>
        </Link>
        <Link 
          to="/shopkeeper/settings" 
          className={`flex-1 min-w-0 flex flex-col items-center justify-center mx-1 py-1 rounded-xl transition-all ${location.pathname.includes('/shopkeeper/settings') ? 'text-marketplace-orange bg-secondary-fixed' : 'text-on-surface-variant hover:text-marketplace-orange'}`}
        >
          <span className="material-symbols-outlined text-[22px] md:text-[24px]">settings</span>
          <span className="font-label-sm text-[11px] md:text-label-sm mt-1 truncate w-full text-center">Settings</span>
        </Link>
      </nav>
    );
  }

  // Customer Tab Bar Layout
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[100] bg-surface shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-border-gray/30 flex justify-between items-center"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)', 
        height: 'calc(64px + env(safe-area-inset-bottom))', 
        boxSizing: 'border-box' 
      }}
    >
      <Link 
        to="/" 
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 active:scale-90 duration-200 ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[24px]">home</span>
        <span className="font-label-sm text-[11px] md:text-label-sm font-bold mt-1 truncate w-full text-center">Home</span>
      </Link>
      <Link 
        to="/explore" 
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 active:scale-90 duration-200 ${location.pathname === '/explore' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[24px]">explore</span>
        <span className="font-label-sm text-[11px] md:text-label-sm font-bold mt-1 truncate w-full text-center">Explore</span>
      </Link>
      <Link 
        to="/cart" 
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 active:scale-90 duration-200 ${location.pathname === '/cart' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[24px]">shopping_cart</span>
        <span className="font-label-sm text-[11px] md:text-label-sm font-bold mt-1 truncate w-full text-center">Cart</span>
      </Link>
      <Link 
        to="/orders" 
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 active:scale-90 duration-200 ${location.pathname === '/orders' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[24px]">receipt_long</span>
        <span className="font-label-sm text-[11px] md:text-label-sm font-bold mt-1 truncate w-full text-center">Orders</span>
      </Link>
      <Link 
        to="/profile" 
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 active:scale-90 duration-200 ${location.pathname === '/profile' ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[24px]">person</span>
        <span className="font-label-sm text-[11px] md:text-label-sm font-bold mt-1 truncate w-full text-center">Profile</span>
      </Link>
    </nav>
  );
}
