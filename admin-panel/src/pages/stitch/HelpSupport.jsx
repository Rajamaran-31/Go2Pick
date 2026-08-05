import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';

export default function HelpSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Ticket Form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('low');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // User tickets list state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Detail Modal state
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get('/api/support/tickets?context=customer');
      if (res.data && res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    setFetchingDetail(true);
    try {
      const res = await api.get(`/api/support/tickets/${id}`);
      if (res.data) {
        setDetailTicket(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleRowClick = (id) => {
    setSelectedTicketId(id);
    setDetailModalOpen(true);
    fetchTicketDetails(id);
  };

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/support/tickets', {
        subject,
        message,
        category,
        priority,
        attachments,
        role: 'customer',
        supportContext: 'customer',
      });
      if (res.data && res.data.success) {
        setIsTicketModalOpen(false);
        setSubject('');
        setMessage('');
        setCategory('general');
        setPriority('low');
        setAttachments([]);
        fetchTickets(); // Refresh list
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      
{/* Top Navigation Bar */}
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm flex items-center justify-between px-md h-14 w-full">
<div className="flex items-center gap-sm">
<button onClick={() => navigate('/profile')} className="material-symbols-outlined text-primary dark:text-inverse-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform" data-icon="menu">menu</button>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-inverse-primary font-bold">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant hover:opacity-80 cursor-pointer" data-icon="search">search</span>
<div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" data-alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbkLb4Izkh-i60Og8GWsLQpUPqdnTrLBRknuCJbIC2NPcpJeSTgQNJ7uaOo0YwkZL0gDTjXgCdKDRXMKkb11ffLb39gqezx5m4iPkPi5nrH-gyzXB9PN_t6eHgpuYjgRiThIxaYnKuAsl_xz7bWYdMzUMYZXU7sJkx0nkj6I4duJBRgf-DRbJjyPfGL5wFjI8SUTtOhXB6BdJHe6EhxXNe2H88v3f62U-ZcRoiSpNoRpwsA2FJtakMBL-c77K8rQ66H3xzzmQpjgOb"/>
</div>
</div>
</header>
<main className="pt-20 pb-24 px-gutter max-w-container-max mx-auto">
{/* Hero Section */}
<section className="text-center mb-xl">
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">How can we help?</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-2xl mx-auto">Find answers to your questions about orders, payments, and account management or talk to our team.</p>
{/* Search Bar */}
<div className="relative max-w-xl mx-auto">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
<input className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border border-border-gray rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md shadow-sm" placeholder="Search for FAQs, topics, or keywords..." type="text"/>
</div>
</section>
{/* Category Bento Grid */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-md mb-2xl">
{/* Orders */}
<div className={`p-lg rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${activeCategory === 'orders' ? 'bg-primary/10 border-2 border-primary' : 'bg-surface-container-low'}`} onClick={() => setActiveCategory(activeCategory === 'orders' ? null : 'orders')}>
<div className="w-12 h-12 bg-primary-container text-on-primary rounded-lg flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="package">package</span>
</div>
<h3 className="font-title-md text-title-md text-on-surface mb-xs">Orders</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Tracking, cancellations, returns, and delivery status updates.</p>
</div>
{/* Payment */}
<div className={`p-lg rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group border-t-4 border-marketplace-orange ${activeCategory === 'payment' ? 'bg-primary/10 border-2 border-primary' : 'bg-surface-container-low'}`} onClick={() => setActiveCategory(activeCategory === 'payment' ? null : 'payment')}>
<div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="payments">payments</span>
</div>
<h3 className="font-title-md text-title-md text-on-surface mb-xs">Payment</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Refunds, transaction history, and managing payment methods.</p>
</div>
{/* Account */}
<div className={`p-lg rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group ${activeCategory === 'account' ? 'bg-primary/10 border-2 border-primary' : 'bg-surface-container-low'}`} onClick={() => setActiveCategory(activeCategory === 'account' ? null : 'account')}>
<div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-lg flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="person">person</span>
</div>
<h3 className="font-title-md text-title-md text-on-surface mb-xs">Account</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Security, profile settings, and shopkeeper verification.</p>
</div>
</section>
{/* FAQ List Section */}
<section className="mb-2xl">
<h3 className="font-title-md text-title-md text-on-surface mb-lg">Frequently Asked Questions</h3>
<div className="space-y-sm">
<div className="bg-white rounded-lg border border-border-gray overflow-hidden">
<button className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors text-left" onClick={() => toggleFaq(1)}>
<span className="font-body-lg text-body-lg text-on-surface font-semibold">How do I track my order in real-time?</span>
<span className={`material-symbols-outlined transition-transform duration-300 ${openFaq === 1 ? 'rotate-180' : ''}`} data-icon="expand_more">expand_more</span>
</button>
<div className={`faq-content overflow-hidden transition-all duration-300 ease-in-out ${openFaq === 1 ? 'max-h-96' : 'max-h-0'}`}>
<p className="p-md pt-0 text-on-surface-variant font-body-md">You can track your order by navigating to 'My Orders' and selecting the active shipment. Our real-time GPS tracking provides updates every 30 seconds once the driver has picked up your items.</p>
</div>
</div>
<div className="bg-white rounded-lg border border-border-gray overflow-hidden">
<button className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors text-left" onClick={() => toggleFaq(2)}>
<span className="font-body-lg text-body-lg text-on-surface font-semibold">What is the refund policy for cancelled pickups?</span>
<span className={`material-symbols-outlined transition-transform duration-300 ${openFaq === 2 ? 'rotate-180' : ''}`} data-icon="expand_more">expand_more</span>
</button>
<div className={`faq-content overflow-hidden transition-all duration-300 ease-in-out ${openFaq === 2 ? 'max-h-96' : 'max-h-0'}`}>
<p className="p-md pt-0 text-on-surface-variant font-body-md">Full refunds are processed if the cancellation occurs within 5 minutes of booking or before the shopkeeper accepts. Otherwise, a small convenience fee may apply to compensate the courier.</p>
</div>
</div>
<div className="bg-white rounded-lg border border-border-gray overflow-hidden">
<button className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors text-left" onClick={() => toggleFaq(3)}>
<span className="font-body-lg text-body-lg text-on-surface font-semibold">How do I switch to Shopkeeper mode?</span>
<span className={`material-symbols-outlined transition-transform duration-300 ${openFaq === 3 ? 'rotate-180' : ''}`} data-icon="expand_more">expand_more</span>
</button>
<div className={`faq-content overflow-hidden transition-all duration-300 ease-in-out ${openFaq === 3 ? 'max-h-96' : 'max-h-0'}`}>
<p className="p-md pt-0 text-on-surface-variant font-body-md">Use the 'Switch' button in the bottom navigation bar. If you haven't registered your shop yet, you'll be prompted to complete a brief verification process including identity and address proof.</p>
</div>
</div>
</div>
</section>

{/* User's Support Tickets List */}
<section className="mb-2xl bg-white p-lg rounded-xl border border-border-gray shadow-sm">
  <h3 className="font-title-md text-title-md text-on-surface mb-md">Your Support Tickets</h3>
  {loadingTickets ? (
    <div className="text-center py-md text-on-surface-variant">Loading tickets...</div>
  ) : tickets.length === 0 ? (
    <div className="text-center py-md text-on-surface-variant font-body-md">You haven't submitted any support tickets yet.</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse font-body-md">
        <thead>
          <tr className="border-b border-border-gray text-on-surface-variant">
            <th className="py-sm">TICKET #</th>
            <th className="py-sm">SUBJECT</th>
            <th className="py-sm">CATEGORY</th>
            <th className="py-sm">PRIORITY</th>
            <th className="py-sm">STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-gray text-on-surface">
          {tickets.map(ticket => (
            <tr key={ticket.id} className="hover:bg-surface-slate cursor-pointer" onClick={() => handleRowClick(ticket.id)}>
              <td className="py-md font-bold">{ticket.ticketNumber}</td>
              <td className="py-md">{ticket.subject}</td>
              <td className="py-md capitalize">{ticket.category}</td>
              <td className="py-md">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  ticket.priority === 'high' ? 'bg-error-container text-error-red' :
                  ticket.priority === 'medium' ? 'bg-warning-amber/20 text-warning-amber' :
                  'bg-outline-variant/30 text-on-surface-variant'
                }`}>
                  {ticket.priority}
                </span>
              </td>
              <td className="py-md">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  ticket.status === 'open' ? 'bg-primary-container text-primary' : 'bg-tertiary-fixed text-success-green'
                }`}>
                  {ticket.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

{/* Contact Support CTA */}
<section className="bg-inverse-surface rounded-2xl p-xl text-center text-on-primary relative overflow-hidden">
<div className="relative z-10">
<h3 className="font-headline-lg text-headline-lg mb-xs">Still need help?</h3>
<p className="font-body-lg text-body-lg text-inverse-on-surface/80 mb-lg">Our support team is available 24/7 to assist you with any inquiries.</p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-md">
<button className="w-full sm:w-auto px-xl h-12 bg-primary text-on-primary rounded-full font-title-md flex items-center justify-center gap-xs hover:opacity-90 active:scale-95 transition-all" onClick={() => setIsModalOpen(true)}>
<span className="material-symbols-outlined" data-icon="chat">chat</span>
                        Start Live Chat
                    </button>
<button className="w-full sm:w-auto px-xl h-12 border-2 border-on-primary text-on-primary rounded-full font-title-md flex items-center justify-center gap-xs hover:bg-on-primary/10 active:scale-95 transition-all" onClick={() => setIsTicketModalOpen(true)}>
<span className="material-symbols-outlined" data-icon="mail">mail</span>
                        Submit Ticket
                    </button>
</div>
</div>
{/* Decorative background elements */}
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl -mr-32 -mt-32"></div>
<div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 blur-2xl -ml-24 -mb-24"></div>
</section>
</main>

{/* Support Modal (Chat) */}
{isModalOpen && (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm" id="support-modal">
<div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
<div className="p-lg bg-primary text-on-primary flex items-center justify-between">
<div>
<h4 className="font-title-md text-title-md">Live Support</h4>
<p className="text-label-sm opacity-80">Online &amp; Ready to help</p>
</div>
<button className="material-symbols-outlined" onClick={() => setIsModalOpen(false)}>close</button>
</div>
<div className="p-lg h-64 bg-surface-slate flex flex-col items-center justify-center text-center">
<div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-md animate-bounce">
<span className="material-symbols-outlined text-primary text-4xl" data-icon="headset_mic">headset_mic</span>
</div>
<p className="font-body-md text-on-surface-variant">Connecting you with the next available agent...</p>
</div>
<div className="p-md border-t border-border-gray">
<div className="relative">
<input className="w-full h-12 pl-4 pr-12 bg-white border border-border-gray rounded-full focus:ring-1 focus:ring-primary outline-none" placeholder="Type your message..." type="text"/>
<button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-sm" data-icon="send">send</span>
</button>
</div>
</div>
</div>
</div>
)}

{/* Submit Ticket Modal */}
{isTicketModalOpen && (
<div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm" id="ticket-modal">
<div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
<div className="p-lg bg-primary text-on-primary flex items-center justify-between">
<div>
<h4 className="font-title-md text-title-md">Submit Support Ticket</h4>
<p className="text-label-sm opacity-80">Tell us what you need help with</p>
</div>
<button className="material-symbols-outlined" onClick={() => setIsTicketModalOpen(false)}>close</button>
</div>
<form onSubmit={handleCreateTicket} className="p-lg space-y-md font-body-md">
  {error && <div className="text-error-red bg-error-container p-sm rounded">{error}</div>}
  <div>
    <label className="block text-label-sm font-bold mb-xs">Subject</label>
    <input 
      className="w-full p-sm border border-border-gray rounded focus:ring-1 focus:ring-primary outline-none" 
      value={subject} 
      onChange={e => setSubject(e.target.value)} 
      placeholder="e.g. Refund query, order issues"
      required
    />
  </div>
  <div>
    <label className="block text-label-sm font-bold mb-xs">Message</label>
    <textarea 
      className="w-full p-sm border border-border-gray rounded focus:ring-1 focus:ring-primary outline-none h-24" 
      value={message} 
      onChange={e => setMessage(e.target.value)} 
      placeholder="Please describe your problem in detail (min 10 chars)..."
      required
    />
  </div>
  <div className="grid grid-cols-2 gap-sm">
    <div>
      <label className="block text-label-sm font-bold mb-xs">Category</label>
      <select 
        className="w-full p-sm border border-border-gray rounded bg-white outline-none"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="general">General</option>
        <option value="orders">Orders</option>
        <option value="payment">Payment</option>
        <option value="account">Account</option>
      </select>
    </div>
    <div>
      <label className="block text-label-sm font-bold mb-xs">Priority</label>
      <select 
        className="w-full p-sm border border-border-gray rounded bg-white outline-none"
        value={priority}
        onChange={e => setPriority(e.target.value)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
  </div>
  <div>
    <label className="block text-label-sm font-bold mb-xs">Attachments</label>
    <input 
      type="file" 
      accept="image/*" 
      className="w-full text-xs border border-border-gray p-xs rounded bg-white outline-none cursor-pointer" 
      onChange={handleFileUpload} 
      disabled={uploadingAttachment}
    />
    {uploadingAttachment && <p className="text-xs text-trust-blue mt-1">Uploading...</p>}
    {attachments.length > 0 && (
      <div className="flex flex-wrap gap-xs mt-xs">
        {attachments.map((url, idx) => (
          <div key={idx} className="relative group w-12 h-12 border border-border-gray rounded overflow-hidden">
            <img src={url} alt="attachment" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
              className="absolute top-0 right-0 bg-error-red text-white w-4 h-4 text-[10px] rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 font-bold"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  <button 
    type="submit" 
    disabled={submitting}
    className="w-full h-12 bg-primary text-on-primary rounded-full font-title-md flex items-center justify-center gap-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
  >
    {submitting ? "Submitting..." : "Submit Ticket"}
  </button>
</form>
</div>
</div>
)}

{/* User Ticket Details Modal */}
{detailModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm" id="detail-ticket-modal">
    <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
      <div className="p-lg bg-primary text-on-primary flex items-center justify-between">
        <div>
          <h4 className="font-title-md text-title-md font-bold text-white">Ticket details: {detailTicket?.ticketNumber || 'Loading...'}</h4>
          <p className="text-label-sm opacity-80 capitalize text-white">Category: {detailTicket?.category} | Priority: {detailTicket?.priority}</p>
        </div>
        <button className="material-symbols-outlined hover:opacity-80 text-white" onClick={() => { setDetailModalOpen(false); setDetailTicket(null); }}>close</button>
      </div>

      {fetchingDetail ? (
        <div className="p-xl text-center text-on-surface-variant font-body-md">Loading ticket details...</div>
      ) : detailTicket ? (
        <div className="flex-1 overflow-y-auto p-lg space-y-lg flex flex-col">
          {/* Ticket Information summary */}
          <div className="bg-surface-container-low p-md rounded-xl space-y-xs font-body-md text-on-surface">
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
            <div className="pt-xs border-t border-border-gray/50 flex flex-wrap justify-between text-[11px] text-on-surface-variant">
              <span>Status: <strong className="uppercase">{detailTicket.status}</strong></span>
              <span>Created: {new Date(detailTicket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Conversation History */}
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
                      <p className="text-[9px] opacity-60 text-right mt-1">
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
                    placeholder="Type your reply to support..."
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-primary text-on-primary h-12 px-md rounded-xl font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer active:scale-95 transition-transform flex items-center justify-center text-white"
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
            <div className="text-center py-sm text-on-surface-variant italic font-body-md">This ticket is closed. You can no longer reply.</div>
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
