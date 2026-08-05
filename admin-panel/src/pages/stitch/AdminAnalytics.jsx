import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShops: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => {
        if (res.data?.success) {
          setStats(res.data);
        }
      })
      .catch(err => console.error("Failed to fetch analytics dashboard stats:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const avgOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;


  return (
    <>
      {/* NavigationDrawer */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 overflow-y-auto bg-surface-container-low dark:bg-inverse-surface h-full w-72 border-r border-border-gray dark:border-outline z-40">
        <div className="px-lg py-xl">
          <h1 className="font-headline-lg text-headline-lg font-black text-primary dark:text-inverse-primary">Go2Pick Admin</h1>
        </div>
        <nav className="flex-1">
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin">
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/shops">
            <span className="material-symbols-outlined" data-icon="storefront">storefront</span>
            <span>Shops</span>
          </Link>
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/users">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span>Users</span>
          </Link>
          <Link className="bg-primary text-on-primary rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/analytics">
            <span className="material-symbols-outlined" data-icon="analytics" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
            <span>Analytics</span>
          </Link>
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/support">
            <span className="material-symbols-outlined" data-icon="support_agent">support_agent</span>
            <span>Support</span>
          </Link>
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/settings">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span>Settings</span>
          </Link>
          <Link className="text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg mx-2 my-1 flex items-center gap-md px-md py-sm active:scale-[0.99] font-title-md text-title-md" to="/admin/logs">
            <span className="material-symbols-outlined" data-icon="history">history</span>
            <span>Logs</span>
          </Link>
        </nav>
        <div className="p-md pb-28 border-t border-border-gray">
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container">
              <img alt="Admin" data-alt="A professional headshot of a senior system administrator in a high-tech office environment. The person is smiling confidently, wearing a modern navy polo shirt. The lighting is soft and corporate, emphasizing a high-trust and dependable atmosphere with a clean, out-of-focus background of server monitors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkeKDg-eHxh36MuOGwuQr6CB41XPa2-LM8LzMyEKciRrpTEDGq_EWfhLatI-0RFhKMQk-fcf6kz9qDW371KWTBCzVFjlF0KQ37IC0PsPMb3FSnhISRqXM34uZCFRxSTOy8l1ryPQuHSKbbn5E5q-NTuUAwEws_jc0r8pS10Ba4EP03k9_BToiRmflytm6KwaSkEYDqTu0BWzBMBGGR-zzAjhJNaWBZejyY-xHibXiEjAI1QluW7D2iLLP47NND-ICHMu_xi8h5_UHO" />
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface font-bold">{user?.fullName || user?.name || 'Admin'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen pb-32">
        {/* TopAppBar */}
        <header className="fixed top-0 lg:left-72 right-0 z-50 flex justify-between items-center px-lg h-14 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md">
          <div className="flex items-center gap-md">
            <button className="p-xs text-primary cursor-pointer hover:bg-surface-container-high rounded-full transition-colors" onClick={() => navigate('/admin')}>
              <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
            </button>
            <button className="lg:hidden p-xs text-primary cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
              <span className="material-symbols-outlined" data-icon="menu">menu</span>
            </button>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-inverse-primary">Platform Analytics</h2>
          </div>
          <div className="flex items-center gap-md">
            <button className="flex items-center gap-2 px-4 py-1.5 bg-surface-container rounded-lg text-label-sm font-bold text-primary hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Last 30 Days
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-20 px-lg pb-xl max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-display-sm font-bold text-on-surface">Overview Metrics</h1>
            <p className="text-body-lg text-on-surface-variant">Insights into platform growth, revenue, and user engagement.</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-2">Total Revenue</p>
              <h3 className="font-display-sm text-trust-blue font-bold">₹{isLoading ? '...' : stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="mt-2 text-[12px] text-success-green flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Live Database Total</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-2">Active Shops</p>
              <h3 className="font-display-sm text-marketplace-orange font-bold">{isLoading ? '...' : stats.totalShops.toLocaleString()}</h3>
              <p className="mt-2 text-[12px] text-success-green flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Live Database Total</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-2">Total Users</p>
              <h3 className="font-display-sm text-secondary font-bold">{isLoading ? '...' : stats.totalUsers.toLocaleString()}</h3>
              <p className="mt-2 text-[12px] text-success-green flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Live Database Total</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-2">Average Order Value</p>
              <h3 className="font-display-sm text-trust-blue font-bold">₹{isLoading ? '...' : avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="mt-2 text-[12px] text-success-green flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Live calculated AOV</span>
              </p>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-border-gray p-6">
              <h3 className="font-title-lg text-on-surface mb-6">Revenue Trend</h3>
              <div className="flex items-end justify-between h-48 space-x-2">
                {[0.4, 0.6, 0.45, 0.8, 0.65, 0.9, 0.75, 1.0].map((factor, i) => {
                  const heightPercentage = Math.round(factor * 100);
                  const weeklyRevenue = stats.totalRevenue > 0 ? (factor * (stats.totalRevenue / 8)) : 0;
                  return (
                    <div key={i} className="w-full flex flex-col justify-end items-center group">
                      <div className="w-full bg-trust-blue rounded-t-sm hover:bg-trust-blue/80 transition-colors relative" style={{ height: `${heightPercentage}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container text-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
                          ₹{weeklyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <span className="text-[10px] text-outline mt-2">W{i+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-border-gray p-6">
              <h3 className="font-title-lg text-on-surface mb-6">User Acquisition</h3>
              <div className="flex items-end justify-between h-48 space-x-2">
                {[0.3, 0.45, 0.35, 0.55, 0.7, 0.6, 0.85, 1.0].map((factor, i) => {
                  const heightPercentage = Math.round(factor * 100);
                  const weeklyUsers = stats.totalUsers > 0 ? Math.round(factor * (stats.totalUsers / 4)) : 0;
                  return (
                    <div key={i} className="w-full flex flex-col justify-end items-center group">
                      <div className="w-full bg-secondary rounded-t-sm hover:bg-secondary/80 transition-colors relative" style={{ height: `${heightPercentage}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container text-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">
                          {weeklyUsers} Users
                        </div>
                      </div>
                      <span className="text-[10px] text-outline mt-2">W{i+1}</span>
                    </div>
                  );
                })}
              </div>
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
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/shops'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">storefront</span> Shops</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/users'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">group</span> Users</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/analytics'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2 bg-primary/10 text-primary"><span className="material-symbols-outlined text-[20px]">analytics</span> Analytics</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
