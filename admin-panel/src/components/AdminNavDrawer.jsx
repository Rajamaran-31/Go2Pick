import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminNavDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Drawer Panel */}
      <aside className="relative w-72 max-w-[85vw] bg-surface dark:bg-surface-dim h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-slide-in-left border-r border-border-gray/30">
        
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-gray/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              </div>
              <div>
                <h3 className="font-title-md font-bold text-on-surface leading-tight">Go2Pick Admin</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">Super Admin Console</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* User Info Capsule */}
          <div className="p-3 bg-surface-container-lowest rounded-xl border border-border-gray/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
              {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{user?.fullName || 'Super Admin'}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{user?.email || 'admin@go2pick.com'}</p>
              <span className="inline-block px-1.5 py-0.5 mt-1 bg-trust-blue/10 text-trust-blue text-[10px] font-bold rounded">
                Super Admin
              </span>
            </div>
          </div>

          {/* PORTALS & CROSS-PAGE NAVIGATION */}
          <div className="space-y-1">
            <p className="px-2 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Cross-Portal Switcher
            </p>
            <button 
              onClick={() => handleNav('/')}
              className="w-full text-left p-2.5 hover:bg-trust-blue/10 hover:text-trust-blue rounded-xl flex items-center justify-between text-sm font-semibold transition-all group border border-transparent hover:border-trust-blue/20"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-trust-blue group-hover:scale-110 transition-transform">
                  storefront
                </span>
                <span>Customer Storefront</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>

            <button 
              onClick={() => handleNav('/shopkeeper')}
              className="w-full text-left p-2.5 hover:bg-marketplace-orange/10 hover:text-marketplace-orange rounded-xl flex items-center justify-between text-sm font-semibold transition-all group border border-transparent hover:border-marketplace-orange/20"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-marketplace-orange group-hover:scale-110 transition-transform">
                  point_of_sale
                </span>
                <span>Shopkeeper Portal</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          {/* ADMIN GOVERNANCE MENU */}
          <div className="space-y-1 pt-2 border-t border-border-gray/40">
            <p className="px-2 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Platform Governance
            </p>

            <button 
              onClick={() => handleNav('/admin')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Overview Dashboard</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/approvals')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/approvals')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              <span>Shop Approvals</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/shops')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/shops')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">store</span>
              <span>Shop Management</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/users')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/users')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span>User Management</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/support')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/support')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
              <span>Support Desk</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/reviews')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/reviews')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">reviews</span>
              <span>Reviews Oversight</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/analytics')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/analytics')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>Analytics & Reports</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/settings')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/settings')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Platform Settings</span>
            </button>

            <button 
              onClick={() => handleNav('/admin/health')}
              className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
                isActive('/admin/health')
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
              <span>System Health</span>
            </button>
          </div>
        </div>

        {/* Footer with Exit / Logout */}
        <div className="pt-4 mt-4 border-t border-border-gray/40 space-y-2">
          <button 
            onClick={() => handleNav('/')}
            className="w-full py-2 px-3 rounded-xl border border-border-gray/50 hover:bg-surface-container-low flex items-center justify-center gap-2 text-xs font-bold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>Preview Storefront</span>
          </button>

          <button 
            onClick={async () => {
              onClose();
              await logout();
              navigate('/login');
            }}
            className="w-full py-2 px-3 rounded-xl text-error-red hover:bg-error-red/10 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </div>
  );
}
