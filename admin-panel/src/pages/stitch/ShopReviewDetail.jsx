import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function ShopReviewDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsShopApproved } = useAppContext();
  const shop = location.state?.shop;

  if (!shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-md" data-icon="error_outline">error_outline</span>
          <p className="font-title-md text-title-md text-on-surface mb-md">No application selected</p>
          <button onClick={() => navigate('/admin/approvals')} className="bg-primary text-on-primary px-lg py-sm rounded-xl font-title-md">
            Back to Approvals
          </button>
        </div>
      </div>
    );
  }

  const [status, setStatus] = useState(shop.status === 'Pending' ? 'Pending Review' : shop.status);
  const [showPopup, setShowPopup] = useState(false);

  const updateShopStatus = (newStatus) => {
    setStatus(newStatus);
    const localShops = JSON.parse(localStorage.getItem('pendingShops') || '[]');
    const updated = localShops.map(s => s.id === shop.id ? { ...s, status: newStatus } : s);
    localStorage.setItem('pendingShops', JSON.stringify(updated));
  };

  const handleApprove = () => {
    updateShopStatus('Approved');
    setIsShopApproved(true);
    setShowPopup(true);
  };

  const handleReject = () => {
    updateShopStatus('Rejected');
    navigate('/admin/approvals');
  };

  return (
    <>
      

<header className="w-full top-0 sticky bg-surface-container-low dark:bg-inverse-surface shadow-sm z-40">
<div className="flex items-center justify-between px-lg py-md w-full max-w-container-max mx-auto">
<div className="flex items-center gap-md">
<button onClick={() => navigate('/admin/approvals')} className="material-symbols-outlined text-trust-blue cursor-pointer active:scale-95 duration-200" data-icon="arrow_back">arrow_back</button>
<h1 className="font-headline-lg text-headline-lg text-trust-blue">Application Review</h1>
</div>
<div className="flex items-center gap-md">
<span className={`px-sm py-xs rounded-full font-label-sm text-label-sm border ${status === 'Approved' ? 'bg-success-green/10 text-success-green border-success-green/20' : status === 'Rejected' ? 'bg-error-red/10 text-error-red border-error-red/20' : 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'}`}>{status}</span>
<div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border-2 border-trust-blue/20">
<img alt="Admin Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsm3r7ck_aXfD4moHQtSOA89aoWacS18a0Jphz3OnvGfWFsic06W29MBb2TehTRcd9WwQwSErTauhGwO14NDdsLl-4Lsk-F-DWbvzuP3Doi2FsovzAiuFCDX-phtUMHvQM_XVQZwtCSYDitpa-lJDjc1Jt1o-Pnd6MBA8QQTCHpL9i1lUXMGgjMf1dX6Dv2g_XzBA3eIX99Qj3Cr9tlKAlaT_roRE_8Eyg9T-i_SfBJSgBLBqRzSHwwFWTODYx1tKGT00K3QJOhrlA"/>
</div>
</div>
</div>
</header>
<div className="flex max-w-container-max mx-auto min-h-[calc(100vh-80px)]">

<main className="flex-1 p-lg pb-32 overflow-y-auto">
<div className="max-w-4xl mx-auto space-y-lg">

<section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div className="md:col-span-2 space-y-lg">
<div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-border-gray relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full -mr-16 -mt-16"></div>
<div className="flex items-start gap-lg relative">
<div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center text-trust-blue shrink-0">
<span className="material-symbols-outlined text-[40px]" data-icon="storefront">storefront</span>
</div>
<div className="flex-1">
<div className="flex items-center justify-between">
<h2 className="font-headline-lg text-headline-lg text-on-surface">{shop.shop}</h2>
<span className="text-on-surface-variant font-label-sm text-label-sm bg-surface-container-high px-sm py-1 rounded-md">ID: {shop.id}</span>
</div>
<p className="font-title-md text-title-md text-trust-blue mt-1">{shop.category}</p>
<div className="flex items-center gap-md mt-md text-on-surface-variant">
<div className="flex items-center gap-xs">
<span className="material-symbols-outlined text-[18px]" data-icon="calendar_today">calendar_today</span>
<span className="font-body-md text-body-md">Submitted: Oct 24, 2023</span>
</div>
<div className="flex items-center gap-xs">
<span className="material-symbols-outlined text-[18px]" data-icon="location_on">location_on</span>
<span className="font-body-md text-body-md">{shop.address || '—'}</span>
</div>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-border-gray">
<h3 className="font-title-md text-title-md mb-lg flex items-center gap-sm">
<span className="material-symbols-outlined text-trust-blue" data-icon="person">person</span>
                                Applicant Information
                            </h3>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-xl">
<div>
<p className="text-[12px] uppercase tracking-wider text-outline mb-1">Full Name</p>
<p className="font-body-lg text-body-lg font-semibold">{shop.name}</p>
</div>
<div>
<p className="text-[12px] uppercase tracking-wider text-outline mb-1">Position</p>
<p className="font-body-lg text-body-lg">Owner / Managing Director</p>
</div>
<div>
<p className="text-[12px] uppercase tracking-wider text-outline mb-1">Email Address</p>
<p className="font-body-lg text-body-lg flex items-center gap-xs">
                                        {shop.email || '—'}
                                        <span className="material-symbols-outlined text-[16px] text-success-green" data-icon="verified" style={{fontVariationSettings: '\'FILL\' 1'}}>verified</span>
</p>
</div>
<div>
<p className="text-[12px] uppercase tracking-wider text-outline mb-1">Phone Number</p>
<p className="font-body-lg text-body-lg">{shop.phone || '—'}</p>
</div>
</div>
</div>
</div>

<div className="space-y-lg">
<div className="bg-trust-blue text-on-primary p-lg rounded-xl shadow-md">
<p className="font-label-sm text-label-sm opacity-80 uppercase mb-md">Application Score</p>
<div className="flex items-end gap-xs">
<span className="text-[48px] font-bold leading-none">{shop.score || '—'}</span>
<span className="text-xl mb-1 opacity-80">/100</span>
</div>
<div className="mt-lg h-2 bg-white/20 rounded-full overflow-hidden">
<div className="h-full bg-white rounded-full" style={{ width: `${shop.score || 0}%` }}></div>
</div>
<p className="mt-md text-[13px] leading-snug">High trust score based on verified business registration and clean credit history.</p>
</div>
<div className="bg-surface-container-lowest p-lg rounded-xl border border-border-gray">
<h4 className="font-label-sm text-label-sm text-outline mb-md uppercase">Review Timeline</h4>
<div className="space-y-md">
<div className="flex gap-md">
<div className="flex flex-col items-center">
<div className="w-2 h-2 rounded-full bg-success-green"></div>
<div className="w-px h-full bg-border-gray"></div>
</div>
<div className="pb-md">
<p className="font-label-sm text-label-sm">Submitted</p>
<p className="text-[12px] text-on-surface-variant">Oct 24, 09:15 AM</p>
</div>
</div>
<div className="flex gap-md">
<div className="flex flex-col items-center">
<div className="w-2 h-2 rounded-full bg-success-green"></div>
<div className="w-px h-full bg-border-gray"></div>
</div>
<div className="pb-md">
<p className="font-label-sm text-label-sm">Verification Complete</p>
<p className="text-[12px] text-on-surface-variant">Oct 24, 11:30 AM</p>
</div>
</div>
<div className="flex gap-md">
<div className="flex flex-col items-center">
<div className="w-3 h-3 rounded-full border-2 border-trust-blue bg-white"></div>
</div>
<div>
<p className="font-label-sm text-label-sm text-trust-blue font-bold">Admin Review</p>
<p className="text-[12px] text-on-surface-variant">In Progress</p>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-border-gray">
<h3 className="font-title-md text-title-md mb-lg flex items-center gap-sm">
<span className="material-symbols-outlined text-trust-blue" data-icon="description">description</span>
                        Business Documentation
                    </h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
<div className="space-y-md">
<p className="font-label-sm text-label-sm text-outline uppercase">Business Proof (Tax ID/License)</p>
<div className="group relative aspect-[4/3] rounded-xl bg-surface-container border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-trust-blue transition-colors">
<img className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40 group-hover:opacity-60 transition-opacity" data-alt="A professional-looking business license document with official seals and structured text layouts, presented as a scanned digital copy on a clean office background. The lighting is bright and corporate, emphasizing clarity and authenticity. The document features official watermarks and signature lines, symbolizing legal compliance and professional trust." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaIF2DxoFcbizWECClGldmEfbttO9ynZhVPb0D2M8e4-H46aPUF3rYx5yR11AxPCRyc-4t_c-AV-1LPAjtfY-nuEWCqVLifxTjPdaHtUQoBpfbar2PS1vhYQNMaSQxA7Rf7kBkLUDUuSx3IPqKSVWZ6dvP4fGtgbRs31v-_zb7xsHst3rIManz4JvlECKUKKHB1Pq1qfRChzp4sI2xuFOXNjyqeOtbTa6HB90RdaVu7bu9gBN6uB5sT2ShLgjWcZlOZgWmYnHUkCeA"/>
<div className="relative flex flex-col items-center p-xl text-center">
<span className="material-symbols-outlined text-[48px] text-trust-blue mb-sm" data-icon="picture_as_pdf">picture_as_pdf</span>
<p className="font-body-md text-body-md font-semibold">LLC_Tax_Certificate.pdf</p>
<p className="text-[12px] text-on-surface-variant">4.2 MB • Click to expand</p>
</div>
</div>
</div>
<div className="space-y-md">
<p className="font-label-sm text-label-sm text-outline uppercase">Shop Display Image</p>
<div className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
<img className="w-full h-full object-cover" data-alt="A vibrant and welcoming storefront of a modern organic grocery store called {shop.shop}. The shop features large glass windows displaying fresh colorful produce like peppers, tomatoes, and leafy greens. The exterior is made of light wood and matte black metal, creating a clean contemporary aesthetic. Soft afternoon sunlight casts gentle shadows, evoking a sense of community and high-quality artisanal shopping." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpjSicULjr_OW1k45go05TUCUKialEg-M4-N_kR4SFG-bpCLyv6QeYVZpBEgtBoYFH7RDNKlhmDRa1GLVQo7aG6WQHW5Caz3QxLiKbfnll_RI3HORwVx1hskIIP4dPCCbPxac8W6yuSSSNjYYnO8nU_IiQpjYD3ArEVOoYKXh_XMVfV6encKpSCrnIplVhxSqgUeLaHvTtl2pDHaMciAyqbshK-qVvD_GE0S8S8NNk6coUd6OoKpySW39BfL2IiBsILlTq0e8k1yBO"/>
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-lg opacity-0 group-hover:opacity-100 transition-opacity">
<p className="text-white font-label-sm text-label-sm">Primary Storefront Photo</p>
<p className="text-white/80 text-[12px]">High Resolution • 1920x1080</p>
</div>
</div>
</div>
</div>
</section>

<section className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-border-gray">
<h3 className="font-title-md text-title-md mb-lg flex items-center gap-sm">
<span className="material-symbols-outlined text-trust-blue" data-icon="info">info</span>
                        Shop Description
                    </h3>
<div className="p-lg bg-surface rounded-lg border border-border-gray">
<p className="font-body-lg text-body-lg text-on-surface-variant italic leading-relaxed">
                            "{shop.shop} is dedicated to bringing the freshest, locally-sourced organic produce to our neighborhood. We partner directly with over 15 local farms to ensure our customers receive the highest quality seasonal fruits and vegetables within 24 hours of harvest. Our mission is to promote sustainable living while supporting our local agricultural community through transparent and fair-trade practices."
                        </p>
</div>
<div className="mt-lg grid grid-cols-2 sm:grid-cols-4 gap-md">
<div className="p-md rounded-lg bg-tertiary-fixed/20 border border-tertiary-fixed flex flex-col items-center">
<span className="material-symbols-outlined text-tertiary" data-icon="eco">eco</span>
<span className="font-label-sm text-label-sm mt-xs">Organic</span>
</div>
<div className="p-md rounded-lg bg-surface-container flex flex-col items-center">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="local_shipping">local_shipping</span>
<span className="font-label-sm text-label-sm mt-xs">Delivery</span>
</div>
<div className="p-md rounded-lg bg-surface-container flex flex-col items-center">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="payments">payments</span>
<span className="font-label-sm text-label-sm mt-xs">Online Pay</span>
</div>
<div className="p-md rounded-lg bg-surface-container flex flex-col items-center">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="support_agent">support_agent</span>
<span className="font-label-sm text-label-sm mt-xs">Support</span>
</div>
</div>
</section>
</div>
</main>
</div>

<div className="fixed bottom-[72px] left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border-gray z-40 py-md px-lg">
<div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-md">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="visibility">visibility</span>
<p className="text-on-surface-variant font-body-md text-body-md">Reviewing as <span className="font-bold text-trust-blue">Admin #402</span></p>
</div>
<div className="flex items-center gap-sm w-full sm:w-auto">
<button onClick={() => navigate("/admin/approvals")} className="flex-1 py-sm border border-error text-error rounded-lg font-label-sm hover:bg-error/5 transition-colors">Reject</button>
<button onClick={() => window.alert('Action successful')} className="flex-1 sm:flex-none px-xl py-md rounded-xl bg-surface-container-high border border-trust-blue/30 font-label-sm text-label-sm text-trust-blue hover:bg-trust-blue/10 transition-all active:scale-95">
                    Request Info
                </button>
<button onClick={handleApprove} className="flex-1 sm:flex-none px-2xl py-md rounded-xl bg-trust-blue text-white font-label-sm text-label-sm shadow-lg shadow-trust-blue/20 hover:bg-primary transition-all active:scale-95 cursor-pointer">
                    Approve Shop
                </button>
</div>
</div>
</div>







<div className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-md transition-opacity duration-300 ${showPopup ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
    
    <div className={`bg-surface-container-lowest w-full max-w-[440px] rounded-[24px] shadow-2xl overflow-hidden transform transition-all duration-300 ${showPopup ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="p-xl flex flex-col items-center text-center">
            
            <div className="mb-lg relative">
                <div className="w-20 h-20 bg-success-green/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-success-green font-bold" style={{fontVariationSettings: '\'FILL\' 0, \'wght\' 600'}}>check_circle</span>
                </div>
                
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-green rounded-full opacity-20 animate-ping"></div>
            </div>
            
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs tracking-tight">Approval Confirmed</h3>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant px-sm leading-relaxed mb-xl">
                {shop.shop} has been notified. Their shop is now live and they can start managing products and orders.
            </p>
            
            <div className="w-full space-y-sm">
                
                <button className="w-full h-12 bg-primary text-on-primary font-title-md text-title-md rounded-xl hover:bg-primary-container active:scale-95 transition-all duration-150 flex items-center justify-center shadow-sm" onClick={() => { setShowPopup(false); navigate('/admin/approvals'); }}>
                    Back to Approvals
                </button>
                
                <button className="w-full h-12 bg-transparent text-primary font-title-md text-title-md rounded-xl border border-primary/20 hover:bg-surface-container transition-all duration-150 flex items-center justify-center" onClick={() => { setShowPopup(false); navigate('/admin/shops'); }}>
                    Go to Shop Dashboard
                </button>
            </div>
        </div>
        
        <div className="h-1.5 w-full bg-gradient-to-r from-success-green/40 via-success-green to-success-green/40"></div>
    </div>
</div>

    </>
  );
}
