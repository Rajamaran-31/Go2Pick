import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ShopkeeperSupport() {
  const navigate = useNavigate();
  const { notifications, refreshNotifications, unreadCount } = useAppContext();
  const { user } = useAuth();
  
  // Navigation drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Shop details for ticket submission
  const [shop, setShop] = useState(null);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  // Create ticket state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Ticket details modal state
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);

  // Fetch shopkeeper's shop details
  useEffect(() => {
    api.get('/api/shopkeeper/my-shop')
      .then(res => {
        const d = res.data?.shop || res.data;
        setShop(d);
      })
      .catch(err => console.error("Error fetching shop details:", err));
  }, []);

  // Fetch shopkeeper's support tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get('/api/support/tickets?context=shopkeeper');
      if (res.data && res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch ticket details & mark matching notifications as read
  const fetchTicketDetails = async (ticketId) => {
    setFetchingDetail(true);
    try {
      const res = await api.get(`/api/support/tickets/${ticketId}`);
      if (res.data) {
        setDetailTicket(res.data);
        
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
          // Refresh notification counts
          refreshNotifications();
        }
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleRowClick = (ticketId) => {
    setSelectedTicketId(ticketId);
    setDetailModalOpen(true);
    fetchTicketDetails(ticketId);
  };

  // Submit support ticket
  const handleSubmitSupportTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 5) {
      alert("Subject must be at least 5 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      alert("Description must be at least 10 characters.");
      return;
    }

    setSubmittingTicket(true);
    try {
      const payload = {
        userId: user?.id || user?._id || null,
        role: "shopkeeper",
        supportContext: "shopkeeper",
        shopId: shop?.id || shop?.shopId || null,
        shopName: shop?.name || shop?.shopName || null,
        subject: subject.trim(),
        category: category,
        description: description.trim(),
        priority: "low",
        status: "open",
        attachments: attachments,
        createdAt: new Date().toISOString()
      };
      
      console.log("DEBUG [ShopkeeperSupport] ticket submit payload:", payload);

      const res = await api.post('/api/support/tickets', payload);
      if (res.data?.success) {
        alert("Support ticket submitted successfully! Ticket ID: " + (res.data.ticketNumber || res.data.ticketId));
        setSubject('');
        setCategory('general');
        setDescription('');
        setAttachments([]);
        setIsSubmitModalOpen(false);
        fetchTickets();
      } else {
        alert("Failed to submit ticket: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting ticket: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Upload attachment for ticket creation
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads/support-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        setAttachments(prev => [...prev, res.data.url]);
      }
    } catch (err) {
      console.error("Failed to upload attachment", err);
      alert("Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Upload attachment for reply
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

  // Send reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
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

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md h-16 w-full">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-marketplace-orange text-2xl mr-2 cursor-pointer" onClick={() => navigate('/shopkeeper')}>arrow_back</button>
          <span className="material-symbols-outlined text-marketplace-orange text-2xl" data-icon="support_agent">support_agent</span>
          <h1 className="font-title-md text-title-md text-marketplace-orange font-bold">Shop Support</h1>
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
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface font-bold">My Support Tickets</h2>
            <p className="text-on-surface-variant font-body-md">View and manage support inquiries for your store</p>
          </div>
          <button 
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center justify-center gap-xs bg-marketplace-orange text-white px-lg py-md rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Submit New Ticket
          </button>
        </section>

        {/* Tickets Listing Table */}
        <div className="bg-white p-lg rounded-xl border border-border-gray shadow-sm overflow-hidden">
          {loadingTickets ? (
            <div className="text-center py-xl text-on-surface-variant">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-2xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-slate flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-outline text-3xl">mail</span>
              </div>
              <p className="font-body-lg text-on-surface-variant">No support tickets found.</p>
              <p className="font-body-md text-on-surface-variant/70 mt-xs">Submit a ticket if you need help with your store settings or orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-md">
                <thead>
                  <tr className="border-b border-border-gray text-on-surface-variant font-bold">
                    <th className="py-md">TICKET ID</th>
                    <th className="py-md">SUBJECT</th>
                    <th className="py-md">STATUS</th>
                    <th className="py-md">LAST UPDATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray text-on-surface">
                  {tickets.map(ticket => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-surface-slate cursor-pointer transition-colors" 
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <td className="py-md font-bold text-marketplace-orange">{ticket.ticketNumber || `#TKT-${ticket.id.slice(-6).toUpperCase()}`}</td>
                      <td className="py-md max-w-xs truncate">{ticket.subject}</td>
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
                        {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : new Date(ticket.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New Support Ticket Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-md bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#f97316] text-white px-lg py-md flex items-center justify-between">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-white">support_agent</span>
                <h3 className="font-title-md text-title-md font-bold text-white font-bold">Contact Support</h3>
              </div>
              <button className="material-symbols-outlined hover:opacity-80 active:scale-95 transition-transform text-white cursor-pointer" onClick={() => setIsSubmitModalOpen(false)}>close</button>
            </div>
            <form onSubmit={handleSubmitSupportTicket} className="p-lg space-y-md">
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Subject</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange focus:ring-1 focus:ring-marketplace-orange outline-none transition-all" 
                  placeholder="What issue are you experiencing?" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  required 
                  minLength={5}
                  maxLength={200}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Category</label>
                <select 
                  className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange outline-none"
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="general">General Inquiry</option>
                  <option value="account">Account & Store Profile</option>
                  <option value="products">Product Catalog</option>
                  <option value="orders">Orders & Fulfillment</option>
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Description</label>
                <textarea 
                  className="w-full bg-surface border border-border-gray rounded-lg px-md py-sm font-body-md focus:border-marketplace-orange focus:ring-1 focus:ring-marketplace-orange outline-none transition-all" 
                  rows="4" 
                  placeholder="Please describe your issue in detail. Must be at least 10 characters." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  minLength={10}
                ></textarea>
              </div>

              {/* Attachments Section */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block text-left">Attachments</label>
                <div className="flex items-center gap-md">
                  <label className="flex items-center gap-xs text-[12px] font-bold text-trust-blue cursor-pointer hover:underline">
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    Upload screenshot
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      disabled={uploadingAttachment}
                    />
                  </label>
                  {uploadingAttachment && <span className="text-[11px] text-on-surface-variant">Uploading...</span>}
                  {attachments.length > 0 && (
                    <div className="flex gap-xs">
                      {attachments.map((url, idx) => (
                        <div key={idx} className="relative w-10 h-10 border border-border-gray rounded overflow-hidden">
                          <img src={url} alt="attachment" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-md pt-md">
                <button 
                  type="button" 
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-md rounded-xl font-semibold transition-colors cursor-pointer" 
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={submittingTicket}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#f97316] text-white py-md rounded-xl font-semibold flex items-center justify-center gap-md hover:bg-opacity-95 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                  disabled={submittingTicket}
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm" id="detail-ticket-modal">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col w-full max-w-lg max-h-[85vh] animate-in fade-in zoom-in duration-300">
            <div className="p-lg bg-[#f97316] text-white flex items-center justify-between">
              <div>
                <h4 className="font-title-md text-title-md font-bold text-white">Ticket Details: {detailTicket?.ticketNumber || 'Loading...'}</h4>
                <p className="text-label-sm opacity-80 capitalize text-white">Category: {detailTicket?.category} | Status: {detailTicket?.status}</p>
              </div>
              <button className="material-symbols-outlined hover:opacity-80 text-white cursor-pointer" onClick={() => { setDetailModalOpen(false); setDetailTicket(null); }}>close</button>
            </div>

            {fetchingDetail ? (
              <div className="p-xl text-center text-on-surface-variant font-body-md">Loading details...</div>
            ) : detailTicket ? (
              <div className="flex-1 overflow-y-auto p-lg space-y-lg flex flex-col">
                
                {/* Subject & Description Card */}
                <div className="bg-surface-slate p-md rounded-xl space-y-xs font-body-md text-on-surface border border-border-gray">
                  <h5 className="font-bold text-headline-sm-mobile">{detailTicket.subject}</h5>
                  <p className="text-on-surface-variant">{detailTicket.description}</p>
                  {detailTicket.attachments && detailTicket.attachments.length > 0 && (
                    <div className="pt-sm">
                      <p className="text-label-sm font-bold text-on-surface-variant mb-xs">Attachments:</p>
                      <div className="flex flex-wrap gap-xs">
                        {detailTicket.attachments.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="border border-border-gray rounded overflow-hidden w-16 h-16 inline-block hover:opacity-90">
                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-xs border-t border-border-gray/50 flex justify-between text-[11px] text-on-surface-variant">
                    <span>Status: <strong className="uppercase text-marketplace-orange">{detailTicket.status}</strong></span>
                    <span>Created: {new Date(detailTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Conversation History Timeline */}
                <div className="space-y-sm flex-1">
                  <h6 className="font-title-sm font-bold text-on-surface-variant border-b border-border-gray pb-xs">Timeline & Replies</h6>
                  <div className="space-y-sm max-h-60 overflow-y-auto p-xs bg-surface-container-lowest rounded-xl border border-border-gray">
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
                </div>

                {/* Reply Form */}
                {detailTicket.status !== 'closed' && detailTicket.status !== 'resolved' ? (
                  <form onSubmit={handleSendReply} className="border-t border-border-gray pt-md space-y-sm">
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
            ) : (
              <div className="p-xl text-center text-error-red font-body-md">Failed to load ticket details.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
