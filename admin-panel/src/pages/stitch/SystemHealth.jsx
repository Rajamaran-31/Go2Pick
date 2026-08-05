import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SystemHealth() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [healthData, setHealthData] = useState({
    uptime: null,
    latency: null,
    dbLoad: null,
    incidents: []
  });

  React.useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/api/admin/system-health')
        .then(res => {
          if (res.data) {
            setHealthData({ ...res.data, incidents: res.data.incidents || [] });
          }
        })
        .catch(err => console.error("Error fetching health data:", err));
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
          <Link className="flex items-center gap-md bg-[#1B2A4A] text-white mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/health">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span className="font-body-md text-body-md">System Health</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/audit">
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
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">System Health</h2>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-20 px-lg pb-xl max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-display-sm font-bold text-on-surface">Platform Health Dashboard</h1>
            <p className="text-body-lg text-on-surface-variant">Monitor live system performance and infrastructure status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-success-green/10 text-success-green flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <h3 className="font-title-lg text-on-surface">All Systems Operational</h3>
              <p className="text-on-surface-variant text-body-md mt-2">Uptime: {healthData.uptime ?? '—'}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-md text-on-surface">API Latency</h3>
                <span className="text-success-green font-bold text-title-md">{healthData.latency ?? '—'}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div className="bg-success-green h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
              <p className="text-[12px] text-outline mt-2">Normal operating range</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-md text-on-surface">Database Load</h3>
                <span className="text-warning-amber font-bold text-title-md">{healthData.dbLoad ?? '—'}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div className="bg-warning-amber h-2 rounded-full" style={{width: healthData.dbLoad || '0%'}}></div>
              </div>
              <p className="text-[12px] text-outline mt-2">Nearing capacity threshold</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border-gray overflow-hidden">
            <div className="p-6 border-b border-border-gray">
              <h3 className="font-title-lg text-on-surface">Active Incidents</h3>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center py-12">
              {healthData.incidents && healthData.incidents.length > 0 ? (
                 <div className="w-full text-left">
                   {healthData.incidents.map((incident, idx) => (
                     <div key={idx} className="mb-2 p-2 border border-error rounded">
                       <p className="font-bold text-error">{incident.title}</p>
                       <p className="text-sm">{incident.description}</p>
                     </div>
                   ))}
                 </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[48px] text-success-green/50 mb-4">task_alt</span>
                  <h4 className="font-title-md text-on-surface">No ongoing incidents</h4>
                  <p className="text-body-md text-on-surface-variant">The system is running smoothly without any active alerts.</p>
                </>
              )}
            </div>
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
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/health'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2 bg-primary/10 text-primary"><span className="material-symbols-outlined text-[20px]">health_and_safety</span> Health</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/audit'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">policy</span> Audit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
