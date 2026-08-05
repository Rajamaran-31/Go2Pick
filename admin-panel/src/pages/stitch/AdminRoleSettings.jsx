import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminRoleSettings() {
  const navigate = useNavigate();
  const [role, setRole] = useState('OPERATIONS');
  const [status, setStatus] = useState('ACTIVE');
  const [permissions, setPermissions] = useState({
    fullAccess: false,
    revenueEdit: false,
    userDelete: false,
    categoriesView: true,
    merchantMgmt: true,
    logsRead: false,
    apiConfig: false,
  });

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved successfully!');
    navigate('/admin/settings');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body-md pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm flex items-center px-md h-14">
        <button className="active:scale-95 transition-transform text-primary p-2 mr-2" onClick={() => navigate('/admin/settings')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-title-lg text-title-lg font-bold">Role & Permissions</h1>
      </header>

      <main className="max-w-3xl mx-auto px-md pt-20">
        
        {/* Profile Card */}
        <section className="bg-surface border border-border-gray rounded-xl p-lg mb-lg shadow-sm flex items-center gap-lg">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container flex-shrink-0">
             <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMs7iP9W9jCgB-94oN7Kq2l_BfL26Kof_0BwY3o0Dq7pX0d-nB4w5H1N9sQf4_cO32Xq-3P-T9zH22r6nE2QvN2X_d453u3X9A21zO6R520P6gRk4b1R2v2e5pD4p1V782kX0o2M1YfV0D8V0T9G0T0S0o5aX2N0R7R2Q6a_1v2M1e6W1w6p0Q8L6V5Q2k4E1s8V" alt="Admin Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold mb-1">Sarah Jenkins</h2>
            <p className="text-on-surface-variant font-body-lg mb-2">s.jenkins@go2pick.com</p>
            <span className="inline-block bg-[#f97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase">
              {role}
            </span>
          </div>
        </section>

        {/* Role & Status Settings */}
        <section className="bg-surface border border-border-gray rounded-xl p-lg mb-lg shadow-sm space-y-md">
          <h3 className="font-title-lg font-bold border-b border-border-gray pb-2">Account Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pt-2">
            <div>
              <label className="block font-label-md text-on-surface-variant mb-2">Primary Role</label>
              <select 
                className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="SUPER ADMIN">Super Admin</option>
                <option value="OPERATIONS">Operations</option>
                <option value="DEVELOPER">Developer</option>
              </select>
              <p className="font-label-sm text-on-surface-variant opacity-70 mt-2">
                Changing the primary role will reset permissions to the role defaults.
              </p>
            </div>
            
            <div>
              <label className="block font-label-md text-on-surface-variant mb-2">Account Status</label>
              <select 
                className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary outline-none font-body-md font-bold ${status === 'ACTIVE' ? 'bg-success/10 text-success border-success/30' : 'bg-error/10 text-error border-error/30'}`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active (Can Login)</option>
                <option value="SUSPENDED">Suspended (Cannot Login)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Granular Permissions */}
        <section className="bg-surface border border-border-gray rounded-xl p-lg mb-lg shadow-sm">
          <div className="flex items-center justify-between border-b border-border-gray pb-2 mb-4">
            <h3 className="font-title-lg font-bold">Granular Permissions</h3>
            <button className="text-primary font-label-md hover:underline">Reset to Default</button>
          </div>
          
          <div className="space-y-sm">
            {Object.entries(permissions).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <label key={key} className="flex items-center justify-between p-3 hover:bg-surface-container-lowest rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border-gray">
                  <span className="font-body-lg text-on-surface">{label}</span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${value ? 'bg-primary' : 'bg-surface-slate'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={value} onChange={() => handleToggle(key)} />
                </label>
              );
            })}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-error/5 border border-error/20 rounded-xl p-lg mb-lg">
          <h3 className="font-title-lg font-bold text-error mb-2">Danger Zone</h3>
          <p className="font-body-md text-on-surface-variant mb-4">
            Revoking access will instantly log out the user and prevent them from accessing the admin dashboard permanently.
          </p>
          <button className="px-6 py-2 bg-error text-white font-title-sm rounded-lg shadow-md hover:bg-error/90 active:scale-95 transition-all">
            Revoke Access
          </button>
        </section>

      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-border-gray p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgb(0_0_0/0.05)] z-40">
        <button onClick={() => navigate('/admin/settings')} className="px-6 py-2 border-2 border-primary text-primary font-title-sm rounded-lg hover:bg-primary/5 active:scale-95 transition-all">
          Cancel
        </button>
        <button onClick={handleSave} className="px-6 py-2 bg-primary text-white font-title-sm rounded-lg shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">save</span> Save Changes
        </button>
      </div>

    </div>
  );
}
