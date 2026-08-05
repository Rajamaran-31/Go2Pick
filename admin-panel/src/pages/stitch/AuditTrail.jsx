import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AuditTrail() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [events, setEvents] = useState([]);

  React.useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/admin/audit-logs')
        .then(res => {
          if (Array.isArray(res.data)) {
            setEvents(res.data);
          }
        })
        .catch(err => console.error("Error fetching audit trail:", err));
    });
  }, []);

  return (
    <>
      {/* NavigationDrawer */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 overflow-y-auto bg-surface-container-low dark:bg-inverse-surface h-full w-72 border-r border-border-gray dark:border-outline z-40">
        <div className="px-lg py-xl">
          <h1 className="font-headline-lg text-headline-lg font-black text-primary dark:text-inverse-primary">Go2Pick Admin</h1>
        </div>
        <nav className="flex-1 px-sm space-y-1 overflow-y-auto custom-scrollbar">
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/settings">
            <span className="material-symbols-outlined">settings_input_component</span>
            <span className="font-body-md text-body-md">Global Config</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/logs">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-body-md text-body-md">Merchant Logs</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/health">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span className="font-body-md text-body-md">System Health</span>
          </Link>
          <Link className="flex items-center gap-md bg-[#1B2A4A] text-white mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/audit">
            <span className="material-symbols-outlined">policy</span>
            <span className="font-body-md text-body-md">Audit Trail</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/reviews">
            <span className="material-symbols-outlined">reviews</span>
            <span className="font-body-md text-body-md">Review Management</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/support">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-body-md text-body-md">Support</span>
          </Link>
        </nav>
        <div className="p-md pb-28 border-t border-border-gray">
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex justify-center items-center font-bold text-on-primary-container">
              SA
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface font-bold">Super Admin</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Controller</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen pb-24">
        {/* TopAppBar */}
        <header className="fixed top-0 lg:left-72 right-0 z-50 flex justify-between items-center px-lg h-14 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-md">
            <button className="p-xs text-primary cursor-pointer hover:bg-surface-container-high rounded-full transition-colors" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
            </button>
            <button className="lg:hidden p-xs text-primary cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
              <span className="material-symbols-outlined" data-icon="menu">menu</span>
            </button>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">Audit Trail</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-surface-container rounded-lg text-label-sm font-bold text-primary hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </header>

        {/* Content Canvas */}
        <div className="pt-20 px-lg pb-xl max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-display-sm font-bold text-on-surface">Administrative Audit Log</h1>
            <p className="text-body-lg text-on-surface-variant">An immutable record of all critical system actions taken by platform administrators.</p>
          </div>

          <div className="relative border-l border-border-gray ml-4 space-y-8 pb-8">
            {events.map((event) => (
              <div key={event.id} className="relative pl-8">
                <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center border-4 border-surface shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-border-gray inline-block min-w-[300px] w-full max-w-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-sm font-bold text-[10px] text-trust-blue uppercase tracking-wider bg-trust-blue/10 px-2 py-0.5 rounded">{event.type}</span>
                    <span className="text-outline text-[12px] font-body-md">{event.timestamp}</span>
                  </div>
                  <h4 className="font-title-md text-on-surface mb-1">{event.action}</h4>
                  <div className="flex items-center gap-4 text-on-surface-variant text-[13px]">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span className="font-medium">{event.user}</span> <span className="opacity-70">({event.role})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">lan</span>
                      <span className="font-mono">{event.ip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-64 bg-surface h-full shadow-lg flex flex-col p-4 animate-slide-in-left">
            <button className="self-end material-symbols-outlined mb-4" onClick={() => setIsDrawerOpen(false)}>close</button>
            <h2 className="text-title-md font-bold mb-4">Navigation Menu</h2>
            <div className="flex flex-col gap-2">
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/settings'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">settings</span> Settings</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/logs'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">history</span> Logs</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/health'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">health_and_safety</span> Health</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/audit'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2 bg-primary/10 text-primary"><span className="material-symbols-outlined text-[20px]">policy</span> Audit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
