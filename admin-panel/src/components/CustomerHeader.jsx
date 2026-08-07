import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import api, { API_BASE } from '../services/api';

export default function CustomerHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, refreshUser, logout } = useAuth();
  const { unreadCount } = useAppContext();
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeMode = user?.activeMode || user?.currentMode || localStorage.getItem('go2pick_mode') || 'customer';

  const handleSwitchMode = async () => {
    try {
      setIsSwitching(true);
      const freshUser = await refreshUser();
      if (freshUser?.shopkeeperDashboardEnabled !== true) {
        try {
          await api.post('/api/shopkeeper/enable-dashboard');
        } catch (dashboardErr) {
          console.warn("Enable dashboard error", dashboardErr);
        }
      }
      await api.post('/api/auth/switch-mode', { activeMode: "shopkeeper" });
      localStorage.setItem('go2pick_mode', 'shopkeeper');
      if (user) {
        setUser({ ...user, activeMode: "shopkeeper", currentMode: "shopkeeper" });
      }
      await refreshUser();
      navigate('/shopkeeper');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      alert("Failed to switch mode: " + msg);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <img 
            alt="Go2Pick Logo" 
            className="h-9 w-9 object-contain" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW8TssMjhMMMtqytgYLeGnQZF3hkA7ep4u2Fh0r89LNnVyZUftxu3EoaXuDIsB3owVwzSjrxtdKaU4VyUoER7MUOrIDei0okcpI4iyjt3DEQOREwYqKBwhN91-We4I7I_3czYXRDHmpC4t0fMyFsivK0YLVNkXGTt1p5kLz73lzoGHOZL_ONJYpU5FrZYJ6WT7LxwAFveXsN9_fLJVT3hs3LLx-9sI5GT7bVkzbG4ZLPrBpMpjSzaCTG_dVHhjxj-H2W5Y3-pkAVmO"
          />
          <span className="text-2xl font-bold tracking-tight text-trust-blue">Go2Pick</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            className={`text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
              isLinkActive('/') 
                ? 'text-primary bg-slate-50' 
                : 'text-slate-600 hover:text-primary hover:bg-slate-50'
            }`} 
            to="/"
          >
            Home
          </Link>
          <Link 
            className={`text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
              isLinkActive('/explore') 
                ? 'text-primary bg-slate-50' 
                : 'text-slate-600 hover:text-primary hover:bg-slate-50'
            }`} 
            to="/explore"
          >
            Explore
          </Link>
          <Link 
            className={`text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
              isLinkActive('/cart') 
                ? 'text-primary bg-slate-50' 
                : 'text-slate-600 hover:text-primary hover:bg-slate-50'
            }`} 
            to="/cart"
          >
            Cart
          </Link>
          {user && (
            <Link 
              className={`text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
                isLinkActive('/orders') 
                  ? 'text-primary bg-slate-50' 
                  : 'text-slate-600 hover:text-primary hover:bg-slate-50'
              }`} 
              to="/orders"
            >
              Orders
            </Link>
          )}
        </nav>

        {/* User Right Section */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Shopkeeper Mode Switch */}
          {user && (user.isShopkeeper === true || user.shopkeeperStatus === 'approved' || user.activeShopId || user.role === 'shopkeeper') && (
            <button 
              disabled={isSwitching}
              onClick={handleSwitchMode}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-marketplace-orange text-white shadow-sm hover:opacity-90 active:scale-95 ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSwitching ? "Switching..." : "Switch to Shopkeeper"}
            </button>
          )}

          {/* Notifications Bell */}
          {user && (
            <div 
              className="active:scale-95 transition-transform cursor-pointer relative p-1.5 hover:bg-slate-50 rounded-full text-trust-blue" 
              onClick={() => navigate('/notifications')}
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-error-red text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )}

          {/* User Account Button/Dropdown */}
          {user ? (
            <div className="flex items-center gap-3 border-l pl-3 border-slate-100">
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => navigate('/profile')}
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Customer Avatar"
                    src={user.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`) : "https://lh3.googleusercontent.com/aida-public/AB6AXuB0a2cxlAd3XgffYKhoD4B6BnLlbMGkRW71EqZAARhJAGaqadZ_Zs-JSxW_71_1DxL0eYYXySawpinxIb7Cz4Qn6IDq02YDlSD6PlUVfZhKnEjY8Xhp3vTjkn0tIrG7Zb8B_gmTvS3n6NjOiS7jJaSMjzveJrpuoG6DyMKHItpE53YW1KEm4L7rvk05Q8cpkCw5dxkqduJdE5DgVqFG9pepsN7GJsEzSOfvKnlj5PTi2H01RzPXKXeIXqO2KQAEfWMN_gQEQNCFT06-"}
                  />
                </div>
                <span className="font-semibold text-sm text-slate-700">{user.fullName?.split(' ')[0] || 'User'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-500 hover:text-error-red hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary-container text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-3">
          {user && (
            <div 
              className="relative p-1.5 text-trust-blue" 
              onClick={() => navigate('/notifications')}
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-error-red text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-primary focus:outline-none"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md py-4 px-6 flex flex-col space-y-4 animate-fade-in shadow-inner">
          <Link 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
              isLinkActive('/') ? 'text-primary bg-slate-50' : 'text-slate-600'
            }`} 
            to="/"
          >
            Home
          </Link>
          <Link 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
              isLinkActive('/explore') ? 'text-primary bg-slate-50' : 'text-slate-600'
            }`} 
            to="/explore"
          >
            Explore
          </Link>
          <Link 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
              isLinkActive('/cart') ? 'text-primary bg-slate-50' : 'text-slate-600'
            }`} 
            to="/cart"
          >
            Cart
          </Link>
          {user && (
            <Link 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
                isLinkActive('/orders') ? 'text-primary bg-slate-50' : 'text-slate-600'
              }`} 
              to="/orders"
            >
              Orders
            </Link>
          )}
          {user && (
            <Link 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold py-2 px-3 rounded-lg transition-all ${
                isLinkActive('/profile') ? 'text-primary bg-slate-50' : 'text-slate-600'
              }`} 
              to="/profile"
            >
              Profile
            </Link>
          )}

          {user && (user.isShopkeeper === true || user.shopkeeperStatus === 'approved' || user.activeShopId || user.role === 'shopkeeper') && (
            <button 
              disabled={isSwitching}
              onClick={() => {
                setMobileMenuOpen(false);
                handleSwitchMode();
              }}
              className="w-full py-2 bg-marketplace-orange text-white rounded-xl text-center text-sm font-bold shadow-sm"
            >
              {isSwitching ? "Switching..." : "Switch to Shopkeeper"}
            </button>
          )}

          {user ? (
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2 border border-slate-200 text-error-red hover:bg-slate-50 rounded-xl text-center text-sm font-semibold"
            >
              Logout
            </button>
          ) : (
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full py-2 bg-primary text-white rounded-xl text-center text-sm font-bold shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
