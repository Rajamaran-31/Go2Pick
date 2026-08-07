import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomerFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-28 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Info */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <img 
              alt="Go2Pick Logo" 
              className="h-8 w-8 object-contain brightness-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW8TssMjhMMMtqytgYLeGnQZF3hkA7ep4u2Fh0r89LNnVyZUftxu3EoaXuDIsB3owVwzSjrxtdKaU4VyUoER7MUOrIDei0okcpI4iyjt3DEQOREwYqKBwhN91-We4I7I_3czYXRDHmpC4t0fMyFsivK0YLVNkXGTt1p5kLz73lzoGHOZL_ONJYpU5FrZYJ6WT7LxwAFveXsN9_fLJVT3hs3LLx-9sI5GT7bVkzbG4ZLPrBpMpjSzaCTG_dVHhjxj-H2W5Y3-pkAVmO"
            />
            <span className="text-xl font-bold tracking-tight text-white">Go2Pick</span>
          </div>
          <p className="text-sm text-slate-400">
            A premium pickup-only local shop pre-order platform. Pre-order in advance and collect from local stores using a unique pickup code.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Quick Links</h4>
          <Link className="hover:text-white transition-colors text-sm" to="/">Home</Link>
          <Link className="hover:text-white transition-colors text-sm" to="/explore">Explore</Link>
          <Link className="hover:text-white transition-colors text-sm" to="/register-shop">Register Shop</Link>
          <Link className="hover:text-white transition-colors text-sm" to="/support">Help & Support</Link>
        </div>

        {/* Customer Service */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">For Shopkeepers</h4>
          <Link className="hover:text-white transition-colors text-sm" to="/login">Partner Login</Link>
          <Link className="hover:text-white transition-colors text-sm" to="/register-shop">Open a Store</Link>
          <span className="text-sm text-slate-500">Enable new revenue streams by listing your shop for pre-orders.</span>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Contact</h4>
          <span className="text-sm">Email: support@go2pick.com</span>
          <span className="text-sm">Location: Tamil Nadu, India</span>
          <div className="flex space-x-3 pt-2 text-slate-500 text-lg">
            <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">public</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">chat</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <span>© {new Date().getFullYear()} Go2Pick. All rights reserved.</span>
        <div className="flex space-x-6">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
