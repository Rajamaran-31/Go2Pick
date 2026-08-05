import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

export default function ShopkeeperTicketConversation() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { notifications, refreshNotifications, unreadCount } = useAppContext();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await api.get(`/api/support/tickets/${ticketId}`);
      if (res.data) {
        setTicket(res.data);
        
        // Mark matching notifications as read
        const matchingNotifs = notifications.filter(
          n => n.type === "SUPPORT_REPLY" && !n.isRead && n.message.includes(ticketId)
        );
        
        if (matchingNotifs.length > 0) {
          await Promise.all(
            matchingNotifs.map(async (n) => {
              try {
                await api.post(`/api/notifications/${n.id}/read`);
              } catch (e) {
                console.error("Failed to mark notification read:", e);
              }
            })
          );
          refreshNotifications();
        }
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    
    // Auto-poll conversation details every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchTicketDetails();
    }, 5000);
    return () => clearInterval(interval);
  }, [ticketId, notifications]);

  const handleReplyFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReplyAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/api/support/tickets/${ticketId}/reply`, {
        message: replyText,
        senderRole: "shopkeeper",
        attachments: replyAttachments
      });
      setReplyText('');
      setReplyAttachments([]);
      fetchTicketDetails();
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 text-center text-on-surface-variant font-body-md">Loading ticket conversation...</div>
    );
  }

  if (!ticket) {
    return (
      <div className="pt-24 text-center text-error-red font-body-md">
        <p className="font-bold">Ticket not found or access denied.</p>
        <button onClick={() => navigate('/shopkeeper/support/tickets')} className="mt-md text-marketplace-orange underline font-bold">Back to tickets</button>
      </div>
    );
  }

  return (
    <>
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md h-16 w-full">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-marketplace-orange text-2xl mr-2 cursor-pointer" onClick={() => navigate('/shopkeeper/support/tickets')}>arrow_back</button>
          <span className="material-symbols-outlined text-marketplace-orange text-2xl" data-icon="support_agent">support_agent</span>
          <h1 className="font-title-md text-title-md text-marketplace-orange font-bold">Support Conversation</h1>
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

      {/* Main Container */}
      <main className="pt-24 px-md max-w-container-max mx-auto mb-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          
          {/* Left Column: Ticket Info */}
          <div className="lg:col-span-4 space-y-md">
            <div className="bg-white p-lg rounded-xl border border-border-gray shadow-sm space-y-md">
              <div>
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-marketplace-orange font-bold block mb-1">Ticket Number</span>
                <p className="font-title-lg font-bold text-on-surface text-xl">{ticket.ticketNumber || `#TKT-${ticket.id.slice(-6).toUpperCase()}`}</p>
              </div>
              <div className="border-t border-border-gray pt-md">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-bold block mb-1">Subject</span>
                <p className="font-body-lg text-on-surface font-medium">{ticket.subject}</p>
              </div>
              <div className="border-t border-border-gray pt-md">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-bold block mb-1">Description</span>
                <p className="font-body-md text-on-surface-variant text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
              <div className="border-t border-border-gray pt-md grid grid-cols-2 gap-sm">
                <div>
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-bold block mb-1">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    ticket.status === 'open' ? 'bg-primary-container text-primary' : 
                    ticket.status === 'in_progress' ? 'bg-warning-amber/15 text-warning-amber' : 
                    'bg-tertiary-fixed text-success-green'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-bold block mb-1">Priority</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    ticket.priority === 'high' ? 'bg-error-container text-error-red' :
                    ticket.priority === 'medium' ? 'bg-warning-amber/15 text-warning-amber' :
                    'bg-outline-variant/30 text-on-surface-variant'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <div className="border-t border-border-gray pt-md text-xs text-on-surface-variant">
                <span className="font-bold block mb-1">Created Date</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="border-t border-border-gray pt-md">
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-bold block mb-1">Initial Attachments</span>
                  <div className="flex flex-wrap gap-xs">
                    {ticket.attachments.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="border border-border-gray rounded overflow-hidden w-12 h-12 inline-block hover:opacity-90">
                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat timeline */}
          <div className="lg:col-span-8 flex flex-col bg-white p-lg rounded-xl border border-border-gray shadow-sm h-[60vh] md:h-[70vh]">
            <h3 className="font-title-md font-bold text-on-surface border-b border-border-gray pb-sm mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-marketplace-orange">forum</span>
              Conversation Timeline
            </h3>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-md p-xs bg-surface-slate rounded-xl border border-border-gray mb-md flex flex-col no-scrollbar">
              {ticket.conversation && ticket.conversation.map((msg, index) => {
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
                  <div key={index} className={`flex ${!isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-md py-sm ${
                      !isAgent 
                        ? 'bg-marketplace-orange text-white rounded-tr-none' 
                        : 'bg-surface-container-high text-on-surface rounded-tl-none border border-border-gray'
                    }`}>
                      <p className="text-[10px] opacity-75 font-bold mb-xs">
                        {isAgent ? 'Support Team' : msg.senderName} ({msg.senderRole === 'super_admin' ? 'Support' : msg.senderRole})
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
                      <p className="text-[9px] opacity-60 text-right mt-1">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Reply */}
            {ticket.status !== 'closed' && ticket.status !== 'resolved' ? (
              <form onSubmit={handleSendReply} className="space-y-sm shrink-0 border-t border-border-gray pt-md">
                <div className="flex gap-sm items-end">
                  <div className="flex-1">
                    <textarea 
                      className="w-full p-sm border border-border-gray rounded-xl focus:ring-1 focus:ring-marketplace-orange outline-none h-16 font-body-md text-sm" 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                      placeholder="Type your reply to support..."
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-marketplace-orange text-white h-12 px-md rounded-xl font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
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
              <div className="text-center py-sm text-on-surface-variant italic font-body-md">This ticket is resolved or closed. You can no longer reply.</div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
