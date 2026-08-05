import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ConnectedExperienceHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-gutter font-body-md text-on-surface">
      <div className="w-full max-w-lg bg-surface rounded-3xl shadow-xl p-2xl border border-border-gray text-center space-y-xl animate-[modalIn_0.4s_ease-out]">
        
        {/* Header Section */}
        <div className="space-y-sm">
          <div className="w-20 h-20 bg-trust-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-lg shadow-sm">
            <span className="material-symbols-outlined text-trust-blue text-[40px]">hub</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-trust-blue">Experience Hub</h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-left mt-4 p-4 bg-surface-container-lowest border border-border-gray rounded-xl">
            This hub provides two separate access links. Customer App is for customers and shopkeepers. Shopkeeper Mode is only unlocked inside the Customer App after Super Admin approves the shop registration. Super Admin Portal is a separate panel for admin only.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col gap-md pt-md">
          
          <button 
            onClick={() => navigate('/login-signup')}
            className="w-full group relative overflow-hidden bg-surface-container-high hover:bg-trust-blue border border-border-gray hover:border-trust-blue rounded-xl p-lg flex items-center gap-md transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-trust-blue">shopping_bag</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-white transition-colors">Customer App</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-white/80 transition-colors">Browse, search, and purchase</p>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-white group-hover:translate-x-1 transition-all">arrow_forward</span>
          </button>

          <button 
            onClick={() => navigate('/admin')}
            className="w-full group relative overflow-hidden bg-surface-container-high hover:bg-success-green border border-border-gray hover:border-success-green rounded-xl p-lg flex items-center gap-md transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-success-green">admin_panel_settings</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-white transition-colors">Super Admin</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-white/80 transition-colors">Platform oversight & approvals</p>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-white group-hover:translate-x-1 transition-all">arrow_forward</span>
          </button>

        </div>
      </div>
    </div>
  );
}
