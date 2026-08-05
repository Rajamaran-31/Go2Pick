import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export default function UserSupportDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ticketType, setTicketType] = useState('CUSTOMER');

  const [allTickets, setAllTickets] = useState([]);

  // Detail view states
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicketsList = () => {
    import('../../services/api').then(({ default: api }) => {
      api.get(`/api/admin/support-tickets`)
        .then(res => {
          const ticketsArray = res.data && Array.isArray(res.data.tickets) ? res.data.tickets : [];
          const mapped = ticketsArray.map(ticket => {
              // Map priority
              let priorityColor = 'bg-outline-variant';
              let priorityText = 'text-on-surface-variant';
              const prio = (ticket.priority || 'LOW').toUpperCase();
              if (prio === 'HIGH' || prio === 'CRITICAL') {
                priorityColor = 'bg-error-red';
                priorityText = 'text-error-red';
              } else if (prio === 'MEDIUM') {
                priorityColor = 'bg-warning-amber';
                priorityText = 'text-warning-amber';
              } else if (prio === 'LOW') {
                priorityColor = 'bg-success-green';
                priorityText = 'text-success-green';
              }

              // Map status
              let statusBg = 'bg-surface-container';
              let statusText = 'text-on-surface-variant';
              const stat = (ticket.status || 'OPEN').toUpperCase();
              if (stat === 'OPEN') {
                statusBg = 'bg-error-container';
                statusText = 'text-error-red';
              } else if (stat === 'IN_PROGRESS' || stat === 'IN PROGRESS') {
                statusBg = 'bg-[#fffbeb]';
                statusText = 'text-warning-amber';
              } else if (stat === 'RESOLVED' || stat === 'CLOSED') {
                statusBg = 'bg-success-green/10';
                statusText = 'text-success-green';
              }

              // Format date
              let created = ticket.createdAt || '';
              if (created) {
                try {
                  const d = new Date(created);
                  created = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                } catch (e) {
                  // Keep as string
                }
              }

              return {
                ...ticket,
                priorityColor,
                priorityText,
                statusBg,
                statusText,
                created
              };
            });
            setAllTickets(mapped);
        })
        .catch(err => console.error("Error fetching tickets:", err));
    });
  };

  React.useEffect(() => {
    fetchTicketsList();
  }, [ticketType]);

  const handleViewTicket = async (ticketId) => {
    const existingTicket = allTickets.find(t => t.id === ticketId);
    console.log("[CONSOLE LOG] clicked ticket object:", existingTicket);
    console.log("[CONSOLE LOG] passed ticketId:", ticketId);
    
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
    
    if (existingTicket) {
      setDetailTicket({
        ...existingTicket,
        ticketId: existingTicket.id,
        description: existingTicket.description || existingTicket.message || '',
        conversation: existingTicket.conversation || [
          {
            senderId: existingTicket.user?.email || 'user',
            senderName: existingTicket.user?.name || 'User',
            senderRole: existingTicket.role || 'customer',
            message: existingTicket.description || existingTicket.message || '',
            createdAt: existingTicket.createdAt || new Date().toISOString(),
            attachments: []
          }
        ],
        attachments: existingTicket.attachments || [],
        adminNotes: existingTicket.adminNotes || ''
      });
      setAdminNotes(existingTicket.adminNotes || '');
    } else {
      setDetailTicket(null);
    }
    
    fetchTicketDetails(ticketId);
  };

  const fetchTicketDetails = async (id) => {
    const apiUrl = `/api/support/tickets/${id}`;
    console.log("[CONSOLE LOG] detail API URL:", apiUrl);
    setFetchingDetail(true);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.get(apiUrl);
      console.log("[CONSOLE LOG] detail API response:", res.data);
      if (res.data) {
        setDetailTicket(res.data);
        setAdminNotes(res.data.adminNotes || '');
      }
    } catch (err) {
      console.error("[CONSOLE LOG] detail API error:", err);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.post(`/api/support/tickets/${selectedTicketId}/reply`, {
        message: replyText,
        attachments: replyAttachments
      });
      setReplyText('');
      setReplyAttachments([]);
      fetchTicketDetails(selectedTicketId);
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleReplyFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReplyAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.post('/api/uploads/support-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        setReplyAttachments(prev => [...prev, res.data.url]);
      }
    } catch (err) {
      console.error("Failed to upload reply attachment", err);
      alert("Failed to upload reply attachment");
    } finally {
      setUploadingReplyAttachment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.patch(`/api/support/tickets/${selectedTicketId}`, {
        status: newStatus
      });
      fetchTicketDetails(selectedTicketId);
      fetchTicketsList();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.patch(`/api/support/tickets/${selectedTicketId}`, {
        adminNotes: adminNotes
      });
      alert("Notes saved successfully");
    } catch (err) {
      console.error("Failed to save notes:", err);
      alert("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const displayedTickets = allTickets.filter(t => t.supportContext === (ticketType === 'SHOPKEEPER' ? 'shopkeeper' : 'customer'));

  const openCount = displayedTickets.filter(t => t.status === 'OPEN').length;
  const progressCount = displayedTickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN PROGRESS').length;
  const resolvedCount = displayedTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const highPriorityCount = displayedTickets.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;

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
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/audit">
            <span className="material-symbols-outlined">policy</span>
            <span className="font-body-md text-body-md">Audit Trail</span>
          </Link>
          <Link className="flex items-center gap-md text-on-surface-variant hover:bg-surface-container-low mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/reviews">
            <span className="material-symbols-outlined">reviews</span>
            <span className="font-body-md text-body-md">Review Management</span>
          </Link>
          <Link className="flex items-center gap-md bg-[#1B2A4A] text-white mx-2 my-1 rounded-lg px-md py-sm transition-all duration-200" to="/admin/support">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-body-md text-body-md">Support</span>
          </Link>
        </nav>
        <div className="p-md pb-28 border-t border-border-gray">
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container">
              <img alt="Admin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkeKDg-eHxh36MuOGwuQr6CB41XPa2-LM8LzMyEKciRrpTEDGq_EWfhLatI-0RFhKMQk-fcf6kz9qDW371KWTBCzVFjlF0KQ37IC0PsPMb3FSnhISRqXM34uZCFRxSTOy8l1ryPQuHSKbbn5E5q-NTuUAwEws_jc0r8pS10Ba4EP03k9_BToiRmflytm6KwaSkEYDqTu0BWzBMBGGR-zzAjhJNaWBZejyY-xHibXiEjAI1QluW7D2iLLP47NND-ICHMu_xi8h5_UHO"/>
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
        <header className="fixed top-0 lg:left-72 right-0 z-50 flex justify-between items-center px-lg h-14 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border-b border-border-gray">
          <div className="flex items-center gap-md">
            <button className="p-xs text-primary cursor-pointer hover:bg-surface-container-high rounded-full transition-colors" onClick={() => navigate('/admin')}>
              <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
            </button>
            <button className="lg:hidden p-xs text-primary cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
              <span className="material-symbols-outlined" data-icon="menu">menu</span>
            </button>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-inverse-primary">Support Dashboard</h2>
          </div>
          <div className="flex items-center gap-md">
            <div className="hidden md:flex items-center bg-surface-container px-md py-1.5 rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-outline text-[20px]" data-icon="search">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-64 placeholder:text-outline" placeholder="Search tickets..." type="text"/>
            </div>
            <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 relative" onClick={() => navigate('/admin/notifications')}>
              <span className="material-symbols-outlined text-primary" data-icon="notifications">notifications</span>
              {unreadCount > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-error-red rounded-full"></span>}
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
              <img alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyXmHATQefaoDVeXAzIjLof3Plq5sG0MWpaFQdvE3SJL4mZHv4Lh9rW9wYTdYgms53Wiqjue_tAh9bogHRoXtVo7lEvcM3eWHRE_4sNdTWCqiisvJysQbuAba2P1DMaqE8fjO6U5_vp2nUfbh2S1cCCJvSkvbG-ZD6WuW9pp0R2NIaBZWfnMSHPn-aK0gdaTqAUCp9o6HOfoMvxhzi6qe2-4oSYyKnJ-wcz6XP3nw_3oSlFSbEnm1EPdwHNt7ZMKVZRndHb2xlfzh3"/>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-20 px-lg pb-xl max-w-7xl mx-auto w-full">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
            <div className="glass-card p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border-t-4 border-trust-blue bg-white border border-border-gray">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Open Tickets</p>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{openCount.toString().padStart(2, '0')}</h3>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary-container p-2 rounded-lg" data-icon="pending_actions">pending_actions</span>
              </div>
              <p className="mt-4 text-[12px] text-success-green flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span>
                <span>Live Open Tickets</span>
              </p>
            </div>
            
            <div className="glass-card p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border-t-4 border-warning-amber bg-white border border-border-gray">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">In Progress</p>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{progressCount.toString().padStart(2, '0')}</h3>
                </div>
                <span className="material-symbols-outlined text-warning-amber bg-surface-container-high p-2 rounded-lg" data-icon="progress_activity">progress_activity</span>
              </div>
              <p className="mt-4 text-[12px] text-on-surface-variant">Active investigation</p>
            </div>
            
            <div className="glass-card p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border-t-4 border-success-green bg-white border border-border-gray">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Resolved Today</p>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{resolvedCount.toString().padStart(2, '0')}</h3>
                </div>
                <span className="material-symbols-outlined text-success-green bg-tertiary-fixed p-2 rounded-lg" data-icon="check_circle">check_circle</span>
              </div>
              <p className="mt-4 text-[12px] text-success-green font-bold">Successfully Closed</p>
            </div>
            
            <div className="glass-card p-lg rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border-t-4 border-error-red bg-white border border-border-gray">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">High Priority</p>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">{highPriorityCount.toString().padStart(2, '0')}</h3>
                </div>
                <span className="material-symbols-outlined text-error-red bg-error-container p-2 rounded-lg" data-icon="priority_high">priority_high</span>
              </div>
              <p className="mt-4 text-[12px] text-error-red font-semibold">Immediate Action Required</p>
            </div>
          </div>

          {/* Ticket Type Toggle */}
          <div className="flex bg-surface-container-low p-1 rounded-lg w-fit mb-6 border border-border-gray">
            <button 
              onClick={() => setTicketType('CUSTOMER')}
              className={`px-6 py-2 rounded-md font-label-md text-label-md transition-all duration-200 ${ticketType === 'CUSTOMER' ? 'bg-white shadow-sm text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Customer Tickets
            </button>
            <button 
              onClick={() => setTicketType('SHOPKEEPER')}
              className={`px-6 py-2 rounded-md font-label-md text-label-md transition-all duration-200 ${ticketType === 'SHOPKEEPER' ? 'bg-white shadow-sm text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Shopkeeper Tickets
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
            <div className="flex flex-wrap gap-xs">
              <button className="px-md py-2 bg-primary text-on-primary rounded-full font-label-sm text-label-sm transition-transform active:scale-95 shadow-md shadow-primary/20">All Tickets</button>
              <button className="px-md py-2 bg-white text-on-surface-variant border border-border-gray rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors">Open</button>
              <button className="px-md py-2 bg-white text-on-surface-variant border border-border-gray rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors">In Progress</button>
              <button className="px-md py-2 bg-white text-on-surface-variant border border-border-gray rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors">Resolved</button>
              <div className="w-px h-8 bg-border-gray mx-1 hidden sm:block"></div>
              <button className="px-md py-2 bg-white text-on-surface-variant border border-border-gray rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]" data-icon="filter_list">filter_list</span>
                More Filters
              </button>
            </div>
            <div className="flex items-center gap-sm">
              <p className="text-label-sm text-on-surface-variant">Showing {displayedTickets.length} of {allTickets.length}</p>
              <div className="flex bg-white border border-border-gray rounded-lg overflow-hidden">
                <button className="p-2 hover:bg-surface-container border-r border-border-gray"><span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span></button>
                <button className="p-2 hover:bg-surface-container"><span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span></button>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-2xl shadow-md border border-border-gray overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-gray">
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">TICKET ID</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">USER</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">CATEGORY</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">PRIORITY</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">STATUS</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">CREATED</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {displayedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-lg py-xl text-center text-on-surface-variant">
                        No support tickets found.
                      </td>
                    </tr>
                  ) : (
                    displayedTickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-surface-slate transition-colors group">
                        <td className="px-lg py-lg">
                          <span className="font-body-md font-bold text-primary">{ticket.id}</span>
                        </td>
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-sm">
                            {ticket.user.avatarType === 'image' ? (
                              <img src={ticket.user.avatarUrl} alt="User" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className={`w-9 h-9 rounded-full ${ticket.user.bgColor} flex items-center justify-center font-bold ${ticket.user.textColor}`}>
                                {ticket.user.initials}
                              </div>
                            )}
                            <div>
                              <p className="font-body-md text-on-surface font-semibold">{ticket.user.name}</p>
                              <p className="text-[12px] text-on-surface-variant">{ticket.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-lg">
                          <span className="px-3 py-1 bg-surface-container rounded-full text-primary font-label-sm text-[11px] uppercase">{ticket.category}</span>
                        </td>
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ticket.priorityColor}`}></span>
                            <span className={`font-label-sm text-label-sm ${ticket.priorityText}`}>{ticket.priority}</span>
                          </div>
                        </td>
                        <td className="px-lg py-lg">
                          <span className={`px-3 py-1 ${ticket.statusBg} ${ticket.statusText} rounded-full font-label-sm text-[11px] uppercase`}>{ticket.status}</span>
                        </td>
                        <td className="px-lg py-lg text-on-surface-variant font-body-md">{ticket.created}</td>
                        <td className="px-lg py-lg">
                          <button onClick={() => handleViewTicket(ticket.id)} className="p-2 rounded-lg hover:bg-primary-container/10 text-primary transition-all cursor-pointer">
                            <span className="material-symbols-outlined" data-icon="open_in_new">open_in_new</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-lg py-md bg-surface-container-low border-t border-border-gray flex justify-between items-center">
              <button className="text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[18px]" data-icon="download">download</span>
                Export List
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-border-gray rounded-lg font-label-sm text-label-sm hover:bg-surface-container disabled:opacity-50" disabled>Previous</button>
                <button className="px-4 py-2 bg-white border border-border-gray rounded-lg font-label-sm text-label-sm hover:bg-surface-container">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-64 bg-surface dark:bg-surface-dim h-full shadow-lg flex flex-col p-4 animate-slide-in-left">
            <button className="self-end material-symbols-outlined mb-4" onClick={() => setIsDrawerOpen(false)}>close</button>
            <h2 className="text-title-md font-bold mb-4">Navigation Menu</h2>
            <div className="flex flex-col gap-2">
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/settings'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">settings</span> Settings</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/logs'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">history</span> Logs</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/health'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">health_and_safety</span> Health</button>
               <button onClick={() => { setIsDrawerOpen(false); navigate('/admin/audit'); }} className="text-left p-2 hover:bg-surface-container-low rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">policy</span> Audit</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details modal for Super Admin */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm" id="admin-detail-ticket-modal">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-lg bg-[#1B2A4A] text-white flex items-center justify-between">
              <div>
                <h4 className="font-title-md text-title-md font-bold text-white">Ticket Details: {detailTicket?.ticketNumber || 'Loading...'}</h4>
                <p className="text-label-sm opacity-80 text-white">Investigation & Support View</p>
              </div>
              <button className="material-symbols-outlined text-white hover:opacity-80" onClick={() => { setIsDetailModalOpen(false); setDetailTicket(null); }}>close</button>
            </div>

            {fetchingDetail ? (
              <div className="p-xl text-center text-on-surface-variant font-body-md">Loading ticket details...</div>
            ) : detailTicket ? (
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border-gray">
                {/* Left/Middle: Ticket Info & Chat Timeline */}
                <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto p-lg space-y-md">
                  {/* Subject and Description */}
                  <div className="bg-surface-container-low p-md rounded-xl space-y-xs font-body-md text-on-surface">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-headline-sm-mobile">{detailTicket.subject}</h5>
                      <span className="px-3 py-1 bg-surface-container-high rounded-full font-label-sm text-[11px] uppercase">{detailTicket.category}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{detailTicket.description}</p>
                    
                    {/* Attachments */}
                    {detailTicket.attachments && detailTicket.attachments.length > 0 && (
                      <div className="pt-sm border-t border-border-gray/30 mt-sm">
                        <p className="text-label-sm font-bold text-on-surface-variant mb-xs">Attachments:</p>
                        <div className="flex flex-wrap gap-sm">
                          {detailTicket.attachments.map((url, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-xs">
                              <img src={url} alt="Attachment" className="w-20 h-20 object-cover border border-border-gray rounded-lg" />
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-trust-blue hover:underline font-bold flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[12px]">download</span> View / Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation Timeline */}
                  <div className="flex-1 flex flex-col min-h-[250px]">
                    <h6 className="font-title-sm font-bold text-on-surface-variant border-b border-border-gray pb-xs mb-sm">Conversation Timeline</h6>
                    <div className="flex-1 overflow-y-auto p-sm space-y-sm bg-surface-container-lowest rounded-xl border border-border-gray max-h-[350px]">
                      {detailTicket.conversation && detailTicket.conversation.map((msg, index) => {
                        const isSystem = msg.senderRole === 'system';
                        const isAgent = msg.senderRole === 'admin' || msg.senderRole === 'super_admin';

                        if (isSystem) {
                          return (
                            <div key={index} className="text-center my-xs">
                              <span className="bg-surface-container px-3 py-1 rounded-full text-[11px] text-on-surface-variant italic">
                                {msg.senderName} {msg.message} at {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={index} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-md py-sm ${
                              isAgent 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-surface-container-high text-on-surface rounded-tl-none border border-border-gray'
                            }`}>
                              <p className="text-[10px] opacity-75 font-bold mb-xs">
                                {msg.senderName} ({msg.senderRole})
                              </p>
                              <p className="font-body-md text-sm">{msg.message}</p>
                              
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-xs flex flex-wrap gap-xs">
                                  {msg.attachments.map((url, fileIdx) => (
                                    <a key={fileIdx} href={url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 border border-white/20 rounded overflow-hidden hover:opacity-90">
                                      <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className="text-[9px] opacity-65 text-right mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {detailTicket.status !== 'closed' && detailTicket.status !== 'resolved' ? (
                    <form onSubmit={handleSendReply} className="border-t border-border-gray pt-md space-y-sm">
                      <div className="flex gap-sm items-end">
                        <div className="flex-1">
                          <textarea 
                            className="w-full p-sm border border-border-gray rounded-xl focus:ring-1 focus:ring-primary outline-none h-16 font-body-md text-sm" 
                            value={replyText} 
                            onChange={e => setReplyText(e.target.value)} 
                            placeholder="Reply to user..."
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={sendingReply || !replyText.trim()}
                          className="bg-primary text-white h-12 px-md rounded-xl font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer active:scale-95 transition-transform flex items-center justify-center text-white"
                        >
                          <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                      </div>

                      {/* Reply attachments */}
                      <div className="flex items-center gap-md">
                        <label className="flex items-center gap-xs text-[12px] font-bold text-trust-blue cursor-pointer hover:underline">
                          <span className="material-symbols-outlined text-[16px]">attach_file</span>
                          Add image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleReplyFileUpload} 
                            disabled={uploadingReplyAttachment}
                          />
                        </label>
                        {uploadingReplyAttachment && <span className="text-[11px] text-on-surface-variant">Uploading...</span>}
                        {replyAttachments.length > 0 && (
                          <div className="flex gap-xs">
                            {replyAttachments.map((url, idx) => (
                              <div key={idx} className="relative w-8 h-8 border border-border-gray rounded overflow-hidden">
                                <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                <button 
                                  type="button" 
                                  onClick={() => setReplyAttachments(replyAttachments.filter((_, i) => i !== idx))}
                                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-xs"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-sm text-on-surface-variant italic font-body-md bg-surface-container-low rounded-lg">This ticket is closed/resolved. Re-open status to reply.</div>
                  )}
                </div>

                {/* Right: Ticket details, User Information & Admin Actions */}
                <div className="p-lg space-y-lg overflow-y-auto">
                  {/* Status & Priority Info */}
                  <div className="space-y-sm">
                    <h6 className="font-title-sm font-bold text-on-surface border-b border-border-gray pb-xs">Status & Details</h6>
                    <div className="grid grid-cols-2 gap-sm text-sm">
                      <div>
                        <p className="text-xs text-on-surface-variant">Status</p>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          detailTicket.status === 'open' ? 'bg-error-container text-error-red' :
                          detailTicket.status === 'in_progress' ? 'bg-[#fffbeb] text-warning-amber' :
                          'bg-success-green/10 text-success-green'
                        }`}>
                          {detailTicket.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant">Priority</p>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          detailTicket.priority === 'high' ? 'bg-error-red text-white' :
                          detailTicket.priority === 'medium' ? 'bg-warning-amber text-on-warning' :
                          'bg-success-green text-white'
                        }`}>
                          {detailTicket.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant">Created</p>
                        <p className="font-bold text-xs">{new Date(detailTicket.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant">Last Updated</p>
                        <p className="font-bold text-xs">{new Date(detailTicket.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="space-y-sm">
                    <h6 className="font-title-sm font-bold text-on-surface border-b border-border-gray pb-xs">User Information</h6>
                    <div className="space-y-xs text-xs text-on-surface">
                      <p><strong>Name:</strong> {detailTicket.user?.name || detailTicket.userName}</p>
                      <p><strong>Email:</strong> {detailTicket.user?.email}</p>
                      <p className="capitalize"><strong>Role:</strong> {detailTicket.user?.role || detailTicket.role}</p>
                      {detailTicket.shopName && (
                        <p><strong>Shop Name:</strong> {detailTicket.shopName}</p>
                      )}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-sm pt-md border-t border-border-gray">
                    <h6 className="font-title-sm font-bold text-on-surface">Admin Actions</h6>
                    
                    {/* Status Dropdown */}
                    <div className="space-y-xs">
                      <label className="block text-xs font-bold text-on-surface-variant">Update Status</label>
                      <select 
                        className="w-full p-sm border border-border-gray rounded bg-white outline-none text-xs"
                        value={detailTicket.status.toUpperCase()}
                        onChange={e => handleStatusChange(e.target.value)}
                        disabled={updatingStatus}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-xs pt-xs">
                      <label className="block text-xs font-bold text-on-surface-variant">Internal Notes (Hidden from User)</label>
                      <textarea
                        className="w-full p-sm border border-border-gray rounded bg-white outline-none text-xs h-20"
                        placeholder="Save investigation notes, logs or internal checklist..."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="w-full py-1.5 bg-secondary-container text-on-secondary-container rounded font-bold text-xs hover:opacity-90 transition-opacity active:scale-95 transition-transform"
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-xl text-center text-error-red font-body-md">Failed to load ticket.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
