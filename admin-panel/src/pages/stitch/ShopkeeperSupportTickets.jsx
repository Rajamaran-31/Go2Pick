import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

export default function ShopkeeperSupportTickets() {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/support/my-tickets?context=shopkeeper');
      if (res.data && res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load shopkeeper support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <>
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md h-16 w-full">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-marketplace-orange text-2xl mr-2 cursor-pointer" onClick={() => navigate('/shopkeeper/profile')}>arrow_back</button>
          <span className="material-symbols-outlined text-marketplace-orange text-2xl" data-icon="support_agent">support_agent</span>
          <h1 className="font-title-md text-title-md text-marketplace-orange font-bold">My Support Tickets</h1>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/shopkeeper/notifications')}>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="cursor-pointer w-10 h-10 rounded-full overflow-hidden border-2 border-marketplace-orange/20" onClick={() => navigate('/shopkeeper/profile')}>
            <div className="w-full h-full bg-marketplace-orange/20 flex items-center justify-center text-marketplace-orange font-bold">SK</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-md max-w-container-max mx-auto mb-2xl">
        <section className="mb-lg">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface font-bold">My Support Tickets</h2>
          <p className="text-on-surface-variant font-body-md">Track the status of your reported issues</p>
        </section>

        {/* Tickets Container */}
        <div className="bg-white p-lg rounded-xl border border-border-gray shadow-sm">
          {loading ? (
            <div className="text-center py-xl text-on-surface-variant">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-2xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-slate flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-outline text-3xl">mail</span>
              </div>
              <h3 className="font-title-lg text-on-surface font-bold mb-xs">No support tickets yet.</h3>
              <p className="font-body-md text-on-surface-variant max-w-sm">If you need assistance, please submit a ticket from your profile page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-md">
                <thead>
                  <tr className="border-b border-border-gray text-on-surface-variant font-bold">
                    <th className="py-md">Ticket ID</th>
                    <th className="py-md">Subject</th>
                    <th className="py-md">Category</th>
                    <th className="py-md">Priority</th>
                    <th className="py-md">Status</th>
                    <th className="py-md">Last Updated</th>
                    <th className="py-md text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray text-on-surface">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-surface-slate transition-colors">
                      <td className="py-md font-bold text-marketplace-orange">
                        {ticket.ticketNumber || `#TKT-${ticket.id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-md max-w-xs truncate">{ticket.subject}</td>
                      <td className="py-md capitalize">{ticket.category}</td>
                      <td className="py-md">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          ticket.priority === 'high' ? 'bg-error-container text-error-red' :
                          ticket.priority === 'medium' ? 'bg-warning-amber/15 text-warning-amber' :
                          'bg-outline-variant/30 text-on-surface-variant'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-md">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          ticket.status === 'open' ? 'bg-primary-container text-primary' : 
                          ticket.status === 'in_progress' ? 'bg-warning-amber/15 text-warning-amber' : 
                          'bg-tertiary-fixed text-success-green'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-md text-on-surface-variant">
                        {new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}
                      </td>
                      <td className="py-md text-right">
                        <button 
                          onClick={() => navigate(`/shopkeeper/support/tickets/${ticket.id}`)}
                          className="px-md py-xs bg-marketplace-orange/10 hover:bg-marketplace-orange text-marketplace-orange hover:text-white rounded-lg font-bold text-xs active:scale-95 transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
