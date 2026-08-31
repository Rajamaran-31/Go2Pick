import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ShopRegistration() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('go2pick_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to register a shop. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    shopName: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('go2pick_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to submit an application.');
        navigate('/login');
        return;
      }
      const payload = {
        shopName: formData.shopName,
        ownerName: formData.shopName,
        category: formData.category === 'other' ? customCategory : (formData.category || 'Uncategorized'),
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city || 'N/A',
        pincode: formData.pincode || '000000',
        description: formData.description,
        businessProof: null,
      };
      console.log("DEBUG [ShopRegistration] submit payload:", payload);
      const response = await api.post('/api/shopkeeper/apply', payload);
      console.log("DEBUG [ShopRegistration] apply response:", response.data);
      setShowPopup(true);
    } catch (error) {
      if (error.response?.status === 422) {
         alert('Validation Error: Please check all fields — phone must be 7–15 digits, email must be valid, and address must be at least 5 characters.');
      } else if (error.response?.status === 400) {
         alert(error.response.data?.detail || 'You already have a pending or approved application.');
      } else {
         alert(error.response?.data?.detail || 'Failed to submit application. The server might be offline, please try again.');
      }
    }
  };

  return (
    <>
      

<header className="fixed top-0 w-full z-50 bg-surface/80 glass-header border-b border-border-gray shadow-sm">
<div className="flex items-center px-4 h-14 w-full max-w-container-max mx-auto">
<button onClick={() => navigate('/profile')} aria-label="Go back" className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 text-primary">
<span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 className="ml-2 font-title-md text-title-md text-primary">Shop Registration</h1>
</div>
</header>
<main className="pt-20 pb-48 px-4 max-w-2xl mx-auto">
<div className="mb-8">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-2">Partner with Go2Pick</h2>
<p className="text-on-surface-variant font-body-md">Fill out the details below to start your digital storefront journey. Our team will review your application within 24-48 hours.</p>
</div>
<form className="space-y-8" id="registrationForm" onSubmit={handleSubmit}>

<section className="bg-surface p-6 rounded-xl shadow-sm border border-border-gray">
<div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-trust-blue">
<span className="material-symbols-outlined" data-icon="storefront">storefront</span>
</div>
<h3 className="font-title-md text-title-md">Basic Information</h3>
</div>
<div className="space-y-5">
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="shopName">Shop Name</label>
<input value={formData.shopName} onChange={handleChange} className="w-full h-12 px-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="shopName" name="shopName" placeholder="e.g. Sunny Morning Bakery" required="" type="text"/>
</div>
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="category">Category</label>
<div className="relative">
<select value={formData.category} onChange={handleChange} className="w-full h-12 px-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="category" name="category" required="">
<option disabled="" value="">Select a category</option>
<option value="grocery">Grocery &amp; Essentials</option>
<option value="electronics">Electronics</option>
<option value="fashion">Fashion &amp; Apparel</option>
<option value="health">Health &amp; Beauty</option>
<option value="home">Home &amp; Kitchen</option>
<option value="other">Other</option>
</select>
</div>
{formData.category === 'other' && (
  <input 
    type="text" 
    placeholder="Type your category here" 
    className="w-full h-12 px-4 mt-3 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md"
    value={customCategory}
    onChange={(e) => setCustomCategory(e.target.value)}
    required
  />
)}
</div>
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="description">Description</label>
<textarea value={formData.description} onChange={handleChange} className="w-full p-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md resize-none" id="description" name="description" placeholder="Briefly describe what your shop offers..." rows="4"></textarea>
</div>
</div>
</section>

<section className="bg-surface p-6 rounded-xl shadow-sm border border-border-gray">
<div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-trust-blue">
<span className="material-symbols-outlined" data-icon="contact_mail">contact_mail</span>
</div>
<h3 className="font-title-md text-title-md">Contact Details</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="phone">Business Phone</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="call">call</span>
<input value={formData.phone} onChange={handleChange} className="w-full h-12 pl-12 pr-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="phone" name="phone" placeholder="+1 (555) 000-0000" required="" type="tel"/>
</div>
</div>
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="email">Business Email</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="mail">mail</span>
<input value={formData.email} onChange={handleChange} className="w-full h-12 pl-12 pr-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="email" name="email" placeholder="contact@shop.com" required="" type="email"/>
</div>
</div>
</div>
</section>

<section className="bg-surface p-6 rounded-xl shadow-sm border border-border-gray">
<div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-trust-blue">
<span className="material-symbols-outlined" data-icon="location_on">location_on</span>
</div>
<h3 className="font-title-md text-title-md">Location</h3>
</div>
<div className="space-y-5">
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="address">Detailed Address</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-4 top-4 text-outline" data-icon="pin_drop">pin_drop</span>
<textarea value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md resize-none" id="address" name="address" placeholder="Street, Building, Suite..." required="" rows="3"></textarea>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="city">City</label>
<input value={formData.city} onChange={handleChange} className="w-full h-12 px-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="city" name="city" placeholder="e.g. New Delhi" required="" type="text"/>
</div>
<div className="group">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase" htmlFor="pincode">Pincode</label>
<input value={formData.pincode} onChange={handleChange} className="w-full h-12 px-4 bg-surface-slate border border-border-gray rounded-lg outline-none transition-all focus:border-trust-blue focus:ring-1 focus:ring-trust-blue font-body-md" id="pincode" name="pincode" placeholder="e.g. 110001" required="" type="text"/>
</div>
</div>
</div>
</section>

<section className="bg-surface p-6 rounded-xl shadow-sm border border-border-gray">
<div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-trust-blue">
<span className="material-symbols-outlined" data-icon="cloud_upload">cloud_upload</span>
</div>
<h3 className="font-title-md text-title-md">Documents &amp; Media</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="space-y-2">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase">Shop Profile Image</label>
<div className="relative group cursor-pointer">
<div className="aspect-video w-full rounded-xl border-2 border-dashed border-border-gray bg-surface-slate flex flex-col items-center justify-center gap-2 group-hover:border-trust-blue transition-colors overflow-hidden">
<img className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" data-alt="A brightly lit, modern retail storefront with a glass facade and minimalist interior design. The scene is shot in high-key daylight, emphasizing a clean and professional corporate aesthetic with soft blue and white tones. The atmosphere is inviting and symbolizes a high-trust shopping environment." id="profilePreview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOHhwj6NB8nBHF1xG8tacLj3jV4LzEzL1-s7BCtAbcavD1-_hmyCzw8v2VEz6NMjIpJNxpHsmP_Tu5hMhIpGWDKTRg8--fr4-TBaoMrLXkeN8gOCdCY3fzTvXFh_fmIrGWxsa6rfTe1SEWZS2iG2J872cxmT97d_X6bPeQFCJLv1WF3MkqiU2h3H4p6sh2kuhSIWthg6T1FIK5-dcYm6REa2BOd8VY3NCKiUyW-cTT2Vm6JJuxVrZYSnoE5Z7gDwyY-giTWgalHgfI"/>
<span className="material-symbols-outlined text-outline group-hover:text-trust-blue transition-colors" data-icon="add_a_photo">add_a_photo</span>
<span className="text-body-md text-on-surface-variant font-medium">Upload Shop Logo</span>
<span className="text-label-sm text-outline">JPG or PNG (Max 5MB)</span>
</div>
<input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file"/>
</div>
</div>

<div className="space-y-2">
<label className="block text-label-sm font-label-sm text-trust-blue mb-1.5 uppercase">Business Proof Document</label>
<div className="relative group cursor-pointer">
<div className="aspect-video w-full rounded-xl border-2 border-dashed border-border-gray bg-surface-slate flex flex-col items-center justify-center gap-2 group-hover:border-trust-blue transition-colors">
<span className="material-symbols-outlined text-outline group-hover:text-trust-blue transition-colors" data-icon="description">description</span>
<span className="text-body-md text-on-surface-variant font-medium">Upload License/Permit</span>
<span className="text-label-sm text-outline">PDF or Image (Max 10MB)</span>
</div>
<input accept=".pdf,image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file"/>
</div>
</div>
</div>
</section>
</form>
</main>

<div className="fixed bottom-[72px] left-0 w-full bg-surface border-t border-border-gray px-4 py-4 z-40 shadow-md">
<div className="max-w-2xl mx-auto">
<button className="w-full h-14 bg-trust-blue text-on-primary rounded-xl font-title-md text-title-md flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform hover:bg-primary" form="registrationForm" type="submit">
<span>Submit Application</span>
<span className="material-symbols-outlined" data-icon="send">send</span>
</button>
<p className="text-center text-label-sm text-on-surface-variant mt-3">By submitting, you agree to our <button type="button" onClick={() => setShowTerms(true)} className="text-trust-blue font-bold hover:underline">Terms of Service</button></p>
</div>
</div>

<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
<div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container/5 blur-3xl"></div>
<div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-secondary-container/5 blur-3xl"></div>
</div>

{showPopup && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-gutter">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
    <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl p-xl shadow-2xl text-center space-y-lg animate-[modalIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto text-primary">
        <span className="material-symbols-outlined text-5xl">task_alt</span>
      </div>
      <div className="space-y-sm">
        <h3 className="font-headline-lg-mobile text-on-surface">Application Submitted</h3>
        <p className="text-body-md text-on-surface-variant">Application submitted successfully. Waiting for admin approval.</p>
      </div>
      <button 
        className="w-full h-12 bg-primary text-on-primary rounded-xl font-title-md shadow-md active:scale-95 transition-all"
        onClick={() => navigate('/')}
      >
        OK
      </button>
    </div>
  </div>
)}

{showTerms && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-border-gray">
        <h3 className="font-title-lg text-title-lg">Terms of Service</h3>
        <button type="button" onClick={() => setShowTerms(false)} className="text-on-surface-variant hover:text-error transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-body-md text-on-surface-variant">
        <p>Welcome to Go2Pick! By registering as a shopkeeper, you agree to abide by our platform guidelines.</p>
        <p>1. <strong>Product Quality:</strong> All listed items must be accurate and meet our quality standards.</p>
        <p>2. <strong>Order Fulfillment:</strong> Shopkeepers must process orders in a timely manner as promised on their profile.</p>
        <p>3. <strong>Platform Fees:</strong> Standard commission rates apply to all successful transactions made through the platform.</p>
        <p>4. <strong>Account Suspension:</strong> We reserve the right to suspend or terminate accounts that violate these terms or receive excessive negative feedback.</p>
      </div>
      <div className="p-6 border-t border-border-gray bg-surface-container-lowest flex justify-end">
        <button type="button" onClick={() => setShowTerms(false)} className="px-6 py-2 bg-trust-blue text-white rounded-lg font-label-md hover:bg-primary transition-colors">I Understand</button>
      </div>
    </div>
  </div>
)}


    </>
  );
}
