import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ReviewManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0.0);
  const [flaggedReviews, setFlaggedReviews] = useState(0);
  const [removedReviews, setRemovedReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = () => {
    setIsLoading(true);
    api.get('/api/admin/reviews')
      .then(res => {
        const data = res.data;
        const list = data.reviews || [];
        setReviews(list);
        setTotalReviews(data.totalReviews || 0);
        setAverageRating(data.averageRating || 0.0);
        setFlaggedReviews(data.flaggedReviews || 0);
        setRemovedReviews(data.removedReviews || 0);
      })
      .catch(err => console.error("Error fetching reviews:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = (id, newStatus) => {
    api.put(`/api/admin/reviews/${id}/status`, { status: newStatus })
      .then(() => {
        fetchReviews();
      })
      .catch(err => console.error("Error updating status:", err));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-[#22C55E]/10 text-[#22C55E] px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">APPROVED</span>;
      case 'FLAGGED': return <span className="bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">FLAGGED</span>;
      case 'REMOVED': return <span className="bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">REMOVED</span>;
      default: return null;
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.shop.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase());
    const matchesRating = ratingFilter === 'All Ratings' ? true : r.rating === parseInt(ratingFilter[0]);
    const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter.toUpperCase();
    return matchesSearch && matchesRating && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-surface-container-lowest font-body-md">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-md h-14 w-full bg-surface/80 backdrop-blur-md border-b border-border-gray shadow-sm">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-trust-blue active:scale-95 duration-150 p-xs rounded-full hover:bg-surface-container-low transition-colors" onClick={() => navigate('/admin')}>arrow_back</button>
          <button className="material-symbols-outlined text-trust-blue active:scale-95 duration-150 p-xs rounded-full hover:bg-surface-container-low transition-colors">menu</button>
          <span className="text-headline-lg-mobile font-headline-lg-mobile text-trust-blue font-black tracking-tight">Go2Pick</span>
        </div>
        <div className="flex items-center gap-md">
          <div className="hidden md:flex items-center gap-sm px-md border-r border-border-gray">
            <span className="text-on-surface-variant font-label-sm text-label-sm">Mode: <span className="text-trust-blue font-bold">Global Admin</span></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-label-sm font-bold active:scale-95 transition-transform cursor-pointer">
              AU
          </div>
        </div>
      </header>

      {/* NavigationDrawer (Sidebar) */}
      <aside className="fixed inset-y-0 left-0 z-[60] flex flex-col py-lg h-full w-80 rounded-r-xl bg-surface shadow-xl hidden md:flex pt-20">
        <div className="px-lg pb-lg mb-lg border-b border-border-gray">
          <div className="flex items-center gap-md">
            <img alt="Super Admin" className="w-12 h-12 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAu4vPn2okerhhhYhpBLC-cz8lcRVBG5lImsbnYEpc_VX2cmNYCoxQVofz7Tf2hb8VK2cLcIjZwh_2PD-G1PNTka1jzltb5dphjBFGeUttxdDuKo0E-woRlDMqA9Jiy9kdh-Z9YEumirgWi5nqRVRglF8OdccOs12MnWEt8_fofSg1BqonKe8iHuzEtEW-ZgBHXe_fagqEMIqWTHv3yxCYTVKlR-SN52lbzt8lN-3kYU5O4BgIEssFcWNXkCa3PIAxNj0avZ07oV_ij"/>
            <div>
              <p className="font-title-md text-title-md text-trust-blue leading-tight">Super Admin</p>
              <p className="font-body-md text-body-md text-on-surface-variant">Platform Controller</p>
              <p className="text-[10px] uppercase tracking-widest text-outline mt-1">v2.4.0</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-sm space-y-1 overflow-y-auto custom-scrollbar">
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/settings' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/settings">
            <span className="material-symbols-outlined">settings_input_component</span>
            <span className="font-body-md">Global Config</span>
          </Link>
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/logs' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/logs">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-body-md">Merchant Logs</span>
          </Link>
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/health' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/health">
            <span className="material-symbols-outlined">health_and_safety</span>
            <span className="font-body-md">System Health</span>
          </Link>
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/audit' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/audit">
            <span className="material-symbols-outlined">policy</span>
            <span className="font-body-md">Audit Trail</span>
          </Link>
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/reviews' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/reviews">
            <span className="material-symbols-outlined">reviews</span>
            <span className="font-body-md">Review Management</span>
          </Link>
          <Link className={`flex items-center gap-md mx-2 my-1 px-md py-sm rounded-lg transition-all duration-200 ${location.pathname === '/admin/support' ? 'bg-[#1B2A4A] text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`} to="/admin/support">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-body-md">Support</span>
          </Link>
        </nav>
        
        <div className="mt-auto px-lg pt-lg border-t border-border-gray">
          <button className="flex items-center gap-md text-error w-full px-md py-sm rounded-lg hover:bg-error-container/10 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-sm text-label-sm">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:pl-80 pt-14 pb-32 min-h-screen">
        <div className="max-w-7xl mx-auto p-md md:p-xl">
          
          {/* Header Section */}
          <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Review Management</h2>
              <p className="text-on-surface-variant font-body-md">Monitor and moderate customer reviews across all shops</p>
            </div>
            <button className="flex items-center justify-center gap-2 px-md py-sm border border-outline rounded-lg text-on-surface font-label-md hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
            <div className="bg-surface p-md rounded-xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-1">Total Reviews</p>
              <h3 className="font-display-sm text-on-surface">{totalReviews}</h3>
            </div>
            <div className="bg-surface p-md rounded-xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-1">Average Rating</p>
              <h3 className="font-display-sm text-on-surface">{averageRating.toFixed(1)} <span className="text-[#F59E0B] text-2xl">★</span></h3>
            </div>
            <div className="bg-surface p-md rounded-xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-1">Flagged Reviews</p>
              <h3 className="font-display-sm text-[#F59E0B]">{flaggedReviews}</h3>
            </div>
            <div className="bg-surface p-md rounded-xl shadow-sm border border-border-gray">
              <p className="text-on-surface-variant font-label-sm mb-1">Removed Reviews</p>
              <h3 className="font-display-sm text-[#EF4444]">{removedReviews}</h3>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-sm mb-lg">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                type="text" 
                placeholder="Search by shop, customer, or keyword..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-10 border border-border-gray rounded-lg bg-surface font-body-sm focus:outline-none focus:border-trust-blue"
              />
            </div>
            <select className="h-10 px-3 border border-border-gray rounded-lg bg-surface font-body-sm focus:outline-none" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
              <option value="All Ratings">All Ratings</option>
              <option value="5 Stars">5★</option>
              <option value="4 Stars">4★</option>
              <option value="3 Stars">3★</option>
              <option value="2 Stars">2★</option>
              <option value="1 Stars">1★</option>
            </select>
            <select className="h-10 px-3 border border-border-gray rounded-lg bg-surface font-body-sm focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Approved">Approved</option>
              <option value="Flagged">Flagged</option>
              <option value="Removed">Removed</option>
            </select>
            <select className="h-10 px-3 border border-border-gray rounded-lg bg-surface font-body-sm focus:outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>

          {/* Reviews Table */}
          <div className="bg-surface border border-border-gray rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-border-gray">
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Shop</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Rating</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider max-w-xs">Review</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="p-md font-label-sm text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-lg text-center text-on-surface-variant font-medium">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map(review => (
                    <tr key={review.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-md">
                        <div className="flex items-center gap-3">
                          <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-title-sm text-on-surface">{review.name}</span>
                        </div>
                      </td>
                      <td className="p-md font-body-sm text-on-surface">{review.shop}</td>
                      <td className="p-md">
                        <div className="flex text-[#F59E0B] text-sm">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-md font-body-sm text-on-surface-variant truncate max-w-xs" title={review.content}>
                        {review.content}
                      </td>
                      <td className="p-md font-body-sm text-on-surface-variant">
                        {review.date ? new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </td>
                      <td className="p-md">
                        {getStatusBadge(review.status)}
                      </td>
                      <td className="p-md">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateStatus(review.id, 'APPROVED')} className="text-[#22C55E] hover:bg-[#22C55E]/10 p-1.5 rounded-md transition-colors" title="Approve">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                          <button onClick={() => updateStatus(review.id, 'FLAGGED')} className="text-[#F59E0B] hover:bg-[#F59E0B]/10 p-1.5 rounded-md transition-colors" title="Flag">
                            <span className="material-symbols-outlined text-[18px]">flag</span>
                          </button>
                          <button onClick={() => updateStatus(review.id, 'REMOVED')} className="text-[#EF4444] hover:bg-[#EF4444]/10 p-1.5 rounded-md transition-colors" title="Remove">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination info */}
            {filteredReviews.length > 0 && (
              <div className="p-md border-t border-border-gray text-body-sm text-on-surface-variant flex items-center justify-between">
                <span>Showing {filteredReviews.length} of {totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
