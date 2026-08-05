import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    twoFactorAuth: false,
    darkMode: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    window.alert('Settings saved successfully!');
    navigate('/profile');
  };

  return (
    <div className="bg-surface min-h-screen pb-safe">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center justify-between px-md h-14">
        <div className="flex items-center">
          <button onClick={() => navigate('/profile')} className="active:scale-95 transition-transform text-primary p-2 -ml-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold ml-sm">Settings</h1>
        </div>
        <button onClick={handleSave} className="text-primary font-label-md font-bold hover:underline">Save</button>
      </header>

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-lg">
        
        {/* Notifications Section */}
        <section>
          <h2 className="font-title-md text-title-md text-on-surface-variant mb-md px-2">Notifications</h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden divide-y divide-border-gray">
            <div className="flex items-center justify-between p-md">
              <div>
                <p className="font-title-md text-on-surface">Push Notifications</p>
                <p className="font-body-sm text-on-surface-variant">Receive updates about your orders</p>
              </div>
              <button 
                onClick={() => toggleSetting('pushNotifications')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.pushNotifications ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.pushNotifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-md">
              <div>
                <p className="font-title-md text-on-surface">Email Notifications</p>
                <p className="font-body-sm text-on-surface-variant">Receive promotional emails</p>
              </div>
              <button 
                onClick={() => toggleSetting('emailNotifications')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.emailNotifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section>
          <h2 className="font-title-md text-title-md text-on-surface-variant mb-md px-2">Security</h2>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden divide-y divide-border-gray">
            <div className="flex items-center justify-between p-md">
              <div>
                <p className="font-title-md text-on-surface">Two-Factor Authentication</p>
                <p className="font-body-sm text-on-surface-variant">Add an extra layer of security</p>
              </div>
              <button 
                onClick={() => toggleSetting('twoFactorAuth')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.twoFactorAuth ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.twoFactorAuth ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <button onClick={() => window.alert('Change Password Dialog')} className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors text-left">
              <span className="font-title-md text-on-surface">Change Password</span>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Account Actions */}
        <section className="pt-sm space-y-md">
          <button onClick={() => window.alert('Logging out...')} className="w-full py-md bg-surface-container-low text-on-surface rounded-xl font-label-lg active:scale-95 transition-transform shadow-sm border border-border-gray">
            Log Out
          </button>
          <button onClick={() => window.confirm('Are you sure you want to delete your account? This action is irreversible.')} className="w-full py-md text-error-red bg-error-red/10 rounded-xl font-label-lg active:scale-95 transition-transform">
            Delete Account
          </button>
        </section>

      </main>
    </div>
  );
}
