import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ShopSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('profile-section');
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [shop, setShop] = useState(null);
  const { user } = useAuth();
  
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const logoInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  useEffect(() => {
    if (user) {
        console.log("DEBUG [Frontend] currentUser.id:", user.id || user._id);
    }
    
    api.get('/api/shopkeeper/my-shop')
      .then(res => {
        console.log("DEBUG [Frontend] my-shop API response:", res.data);
        const fetchedShop = res.data?.shop || res.data;
        console.log("DEBUG [ShopSettings] saved shop imageUrl:", fetchedShop?.imageUrl);
        console.log("DEBUG [ShopSettings] saved coverImageUrl:", fetchedShop?.coverImageUrl);
        console.log("DEBUG [Frontend] form initial values:", {
           shopName: fetchedShop?.name || fetchedShop?.shopName,
           category: fetchedShop?.category
        });
        if (!fetchedShop?.businessHours) {
          fetchedShop.businessHours = {
            Monday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Tuesday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Wednesday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Thursday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Friday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Saturday: { open: "09:00 AM", close: "06:00 PM", isOpen: true },
            Sunday: { open: "09:00 AM", close: "06:00 PM", isOpen: false }
          };
        }
        setShop(fetchedShop);
      })
      .catch(err => console.error(err));
  }, [user]);

  useEffect(() => {
    if (location.state?.section) {
      const section = location.state.section;
      setActiveSection(section);
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location]);

  const handleInputChange = (field, val) => {
    setShop(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'name') {
        updated.shopName = val;
      } else if (field === 'shopName') {
        updated.name = val;
      } else if (field === 'phone') {
        updated.businessPhone = val;
      } else if (field === 'businessPhone') {
        updated.phone = val;
      } else if (field === 'email') {
        updated.businessEmail = val;
      } else if (field === 'businessEmail') {
        updated.email = val;
      }
      return updated;
    });
  };

  const handleHoursChange = (day, field, val) => {
    setShop(prev => {
      const updatedHours = {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: val
        }
      };
      return {
        ...prev,
        businessHours: updatedHours
      };
    });
  };

  const convert12to24 = (timeStr) => {
    if (!timeStr) return "09:00";
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
    if (!match) return "09:00";
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = match[3].toUpperCase();
    if (hours === 12) {
      hours = 0;
    }
    if (modifier === 'PM') {
      hours += 12;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const convert24to12 = (timeStr) => {
    if (!timeStr) return "09:00 AM";
    if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(timeStr)) {
      return timeStr.toUpperCase();
    }
    const match = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (!match) return "09:00 AM";
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
  };

  const applyWeekdaysHours = () => {
    setShop(prev => {
      const updatedHours = { ...prev.businessHours };
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      weekdays.forEach(day => {
        updatedHours[day] = {
          open: "09:00 AM",
          close: "06:00 PM",
          isOpen: true
        };
      });
      return {
        ...prev,
        businessHours: updatedHours
      };
    });
  };

  const handleSave = async () => {
    setUploadError('');
    try {
      let logoUrl = shop?.imageUrl || shop?.shopImageUrl || shop?.image || '';
      let coverUrl = shop?.coverImageUrl || shop?.coverImage || '';

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        try {
          const res = await api.post('/api/uploads/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data && res.data.imageUrl) {
            logoUrl = res.data.imageUrl;
          }
        } catch (uploadErr) {
          console.error("Logo upload failed:", uploadErr);
          setUploadError("Failed to upload logo image. " + (uploadErr.response?.data?.detail || uploadErr.message));
          return;
        }
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        try {
          const res = await api.post('/api/uploads/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data && res.data.imageUrl) {
            coverUrl = res.data.imageUrl;
          }
        } catch (uploadErr) {
          console.error("Cover banner upload failed:", uploadErr);
          setUploadError("Failed to upload cover banner image. " + (uploadErr.response?.data?.detail || uploadErr.message));
          return;
        }
      }

      const payload = {
        shopName: shop?.name || shop?.shopName || '',
        name: shop?.name || shop?.shopName || '',
        category: shop?.category || '',
        description: shop?.description || '',
        address: shop?.address || '',
        city: shop?.city || '',
        pincode: shop?.pincode || '',
        phone: shop?.phone || shop?.businessPhone || '',
        businessPhone: shop?.businessPhone || shop?.phone || '',
        email: shop?.email || shop?.businessEmail || '',
        businessEmail: shop?.businessEmail || shop?.email || '',
        isActive: shop?.isActive ?? true,
        whatsapp: shop?.whatsapp || '',
        businessHours: shop?.businessHours || null
      };

      if (logoUrl) {
        payload.imageUrl = logoUrl;
        payload.image = logoUrl;
      }
      if (coverUrl) {
        payload.coverImageUrl = coverUrl;
      }
      
      console.log("DEBUG [ShopSettings] uploaded shop logo URL:", logoUrl);
      console.log("DEBUG [ShopSettings] uploaded cover URL:", coverUrl);
      console.log("Saving shop settings with payload:", payload);
      const res = await api.put('/api/shopkeeper/settings', payload);
      if (res.data?.success) {
        alert("Shop settings saved successfully!");
        setLogoFile(null);
        setCoverFile(null);
        setShop(prev => ({
          ...prev,
          imageUrl: logoUrl,
          image: logoUrl,
          coverImageUrl: coverUrl
        }));
      } else {
        setUploadError("Failed to save settings: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setUploadError("Error saving shop settings: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
      
{/* TopAppBar */}
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm flex items-center justify-between px-md h-14">
<div className="flex items-center gap-sm">
<button className="active:scale-95 transition-transform text-primary" onClick={() => navigate('/shopkeeper')}>
<span className="material-symbols-outlined">arrow_back</span>
</button>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<button onClick={() => navigate('/')} className="hidden md:block font-label-sm text-label-sm text-on-surface-variant hover:underline">Switch to Customer Mode</button>
<div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-primary/10">
<img alt="Profile" data-alt="A professional close-up headshot of a friendly shop owner in a brightly lit, modern retail environment. The lighting is soft and natural, emphasizing a high-trust, dependable atmosphere. The background shows blurred shelves of a clean, minimalist boutique with a color palette of soft blues and crisp whites." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVexWq6eGfcCUyzqm_oCXCw-BQO_yJHIseZuhw_Jfvm6mOyQrIykMU_QwAR-wRC6ros3sKGY8grLQXKmlHavhl0xkdmpXPvClGWL3taOgL1WtxM9XKVKjaOsozzdVWy1pfFovxROXOp0Luh3L_tSrYW4E92Hy17K2Y0Pi4t-gHrFxsZvk2AGrlwMkbp9fbxHKkz1YBe_2r6McNFuaat-2xiLO7AGoTkRUOqzbgIekBwPtVM9lU7QPyfEvMBIcFjsqZ796vps0SEfw8"/>
</div>
</div>
</header>
<main className="pt-20 pb-24 px-gutter max-w-container-max mx-auto">
{/* Page Header */}
<div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Shop Settings</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Manage your marketplace presence and operational details.</p>
</div>
<button className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-sm text-label-sm shadow-md active:scale-95 transition-all flex items-center gap-xs" onClick={handleSave}>
<span className="material-symbols-outlined text-[18px]">save</span>
                Save All Changes
            </button>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
{/* Sidebar Navigation (Drawer Desktop Style) */}
<aside className="hidden lg:block lg:col-span-3">
<nav className="bg-surface border border-border-gray rounded-xl overflow-hidden sticky top-24">
<div className="p-md border-b border-border-gray flex items-center gap-sm">
<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
<span className="material-symbols-outlined text-primary">storefront</span>
</div>
<div>
<p className="font-title-md text-body-md font-bold">{shop?.name || shop?.shopName || 'Shop name not set'}</p>
<p className="text-[12px] text-on-surface-variant">Verified Shop</p>
</div>
</div>
<div className="py-sm">
<button onClick={() => navigate('/shopkeeper/profile')} className={`w-full flex items-center gap-md px-lg py-sm mx-2 rounded-lg font-label-sm transition-all ${activeSection === 'profile-section' ? 'bg-[#f97316] text-white' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
<span className="material-symbols-outlined">settings</span> Shop Profile
</button>
<button onClick={() => { setActiveSection('hours-section'); const el = document.getElementById('hours-section'); if(el) el.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full flex items-center gap-md px-lg py-sm mx-2 rounded-lg font-label-sm transition-all ${activeSection === 'hours-section' ? 'bg-[#f97316] text-white' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
<span className="material-symbols-outlined">schedule</span> Business Hours
</button>
<button onClick={() => { setActiveSection('location-section'); const el = document.getElementById('location-section'); if(el) el.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full flex items-center gap-md px-lg py-sm mx-2 rounded-lg font-label-sm transition-all ${activeSection === 'location-section' ? 'bg-[#f97316] text-white' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
<span className="material-symbols-outlined">location_on</span> Location
</button>
<button onClick={() => { setActiveSection('contact-section'); const el = document.getElementById('contact-section'); if(el) el.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full flex items-center gap-md px-lg py-sm mx-2 rounded-lg font-label-sm transition-all ${activeSection === 'contact-section' ? 'bg-[#f97316] text-white' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
<span className="material-symbols-outlined">contact_page</span> Contact Info
</button>
</div>
</nav>
</aside>
{/* Main Settings Content */}
<div className="lg:col-span-9 space-y-lg">
{/* Shop Profile Section */}
<section id="profile-section" className="settings-card bg-surface border border-border-gray rounded-xl overflow-hidden scroll-mt-24">
{uploadError && (
  <div className="bg-red-50 text-red-600 border border-red-200 p-4 m-4 rounded-lg text-sm flex items-center gap-2">
    <span className="material-symbols-outlined text-[20px]">error</span>
    <span>{uploadError}</span>
  </div>
)}
<div className="relative h-48 md:h-64 bg-surface-container">
<input 
  type="file" 
  ref={coverInputRef} 
  accept="image/*" 
  className="hidden" 
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  }} 
/>
<input 
  type="file" 
  ref={logoInputRef} 
  accept="image/*" 
  className="hidden" 
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  }} 
/>
<img className="w-full h-full object-cover" data-alt="A wide, cinematic shot of a beautifully curated lifestyle boutique storefront." src={coverPreview || getImageUrl(shop?.coverImageUrl || shop?.coverImage, "https://lh3.googleusercontent.com/aida-public/AB6AXuBU3IS4uAo8mH7cTFW7jVk4gq3dhYn4LGM4HH-J2OmmDV4eJoi2peyxPswN1OKzKYvHMLd9T792nufl8YMbU4bwhjNYCAXS4miT_T-bkbEI50Nnain5kfQTXKqJWTnkZclS5DTMVI3gIlfUmNNwHk_cbR_aZ4gf68XEBgcn80QPc7IFYsrR5NDadhzHnSFKKZWqIfw5vJDl8hTxx5EQilELoPcoC7UAnVva6AkGpltE6xC3U-w8tuyDiB-ME0Z8twSCJlzZKAcnkBFU")}/>
<div className="absolute bottom-4 right-4">
  <button onClick={() => setShowCoverMenu(!showCoverMenu)} className="bg-surface/90 backdrop-blur-sm p-2 rounded-full shadow-md text-primary hover:bg-white transition-colors z-10 relative">
    <span className="material-symbols-outlined">edit_square</span>
  </button>
  {showCoverMenu && (
    <div className="absolute bottom-full right-0 mb-2 bg-surface rounded-xl shadow-lg border border-border-gray py-2 w-48 z-20 animate-fade-in">
      <button className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-3 text-body-md" onClick={() => { alert('Opening camera...'); setShowCoverMenu(false); }}>
        <span className="material-symbols-outlined text-[20px]">camera_alt</span> Use Camera
      </button>
      <button className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-3 text-body-md" onClick={() => { coverInputRef.current?.click(); setShowCoverMenu(false); }}>
        <span className="material-symbols-outlined text-[20px]">upload_file</span> Upload File
      </button>
    </div>
  )}
</div>
</div>
<div className="px-lg pb-lg -mt-12 relative flex flex-col md:flex-row md:items-end gap-md">
<div className="relative group">
<div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
{logoPreview || shop?.imageUrl || shop?.shopImageUrl || shop?.image ? (
  <img alt="Logo" className="w-full h-full object-contain" src={logoPreview || getImageUrl(shop?.imageUrl || shop?.shopImageUrl || shop?.image)}/>
) : (
  <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant">
    <span className="material-symbols-outlined text-[48px]">storefront</span>
  </div>
)}
</div>
<button onClick={() => setShowLogoMenu(!showLogoMenu)} className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-full shadow-lg scale-90 z-10 hover:bg-trust-blue transition-colors">
<span className="material-symbols-outlined text-[16px]">photo_camera</span>
</button>
{showLogoMenu && (
  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface rounded-xl shadow-lg border border-border-gray py-2 w-48 z-20 animate-fade-in">
    <button className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-3 text-body-md" onClick={() => { alert('Opening camera...'); setShowLogoMenu(false); }}>
      <span className="material-symbols-outlined text-[20px]">camera_alt</span> Use Camera
    </button>
    <button className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-3 text-body-md" onClick={() => { logoInputRef.current?.click(); setShowLogoMenu(false); }}>
      <span className="material-symbols-outlined text-[20px]">upload_file</span> Upload File
    </button>
  </div>
)}
</div>
<div className="flex-1">
<h3 className="font-title-md text-title-md mb-xs">Shop Branding</h3>
<p className="font-body-md text-body-md text-on-surface-variant">This information will be visible to your customers.</p>
</div>
</div>
<div className="px-lg pb-lg grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Shop Name</label>
<input className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" type="text" value={shop?.name || shop?.shopName || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Shop name not set" />
</div>
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Category</label>
<select className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary outline-none" value={shop?.category || ''} onChange={(e) => handleInputChange('category', e.target.value)}>
<option value="" disabled>Category not set</option>
<option value="Home Decor & Lifestyle">Home Decor &amp; Lifestyle</option>
<option value="Groceries">Groceries</option>
<option value="grocery">grocery</option>
<option value="Electronics">Electronics</option>
</select>
</div>
<div className="md:col-span-2 space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Shop Description</label>
<textarea className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" rows="3" value={shop?.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Description not set"></textarea>
</div>
</div>
</section>
{/* Business Hours Section */}
<section id="hours-section" className="settings-card bg-surface border border-border-gray rounded-xl p-lg scroll-mt-24">
<div className="flex items-center justify-between mb-lg">
<div className="flex items-center gap-sm">
<div className="w-10 h-10 rounded-full bg-warning-amber/10 flex items-center justify-center text-warning-amber">
<span className="material-symbols-outlined">schedule</span>
</div>
<h3 className="font-title-md text-title-md">Business Hours</h3>
</div>
<span className="bg-success-green/10 text-success-green px-sm py-1 rounded-full text-[12px] font-bold">Currently Open</span>
</div>
<div className="space-y-sm">
{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
  const dayInfo = shop?.businessHours?.[day] || { open: "09:00 AM", close: "06:00 PM", isOpen: false };
  return (
    <div key={day} className="flex flex-col md:flex-row md:items-center justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors gap-sm">
      <span className="font-label-sm text-body-md w-24">{day}</span>
      <div className="flex items-center gap-md">
        <div className={`flex items-center gap-xs ${!dayInfo.isOpen ? 'opacity-40 grayscale' : ''}`}>
          <input 
            className="border-border-gray rounded-lg px-2 py-1 font-body-md text-sm outline-none focus:border-primary" 
            type="time" 
            value={convert12to24(dayInfo.open)} 
            disabled={!dayInfo.isOpen}
            onChange={(e) => handleHoursChange(day, 'open', convert24to12(e.target.value))}
          />
          <span className="text-on-surface-variant">to</span>
          <input 
            className="border-border-gray rounded-lg px-2 py-1 font-body-md text-sm outline-none focus:border-primary" 
            type="time" 
            value={convert12to24(dayInfo.close)} 
            disabled={!dayInfo.isOpen}
            onChange={(e) => handleHoursChange(day, 'close', convert24to12(e.target.value))}
          />
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            className="sr-only peer" 
            type="checkbox" 
            checked={!!dayInfo.isOpen}
            onChange={(e) => handleHoursChange(day, 'isOpen', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  );
})}
<div className="pt-sm text-center">
<button type="button" onClick={applyWeekdaysHours} className="text-primary font-label-sm hover:underline">Apply 09:00 AM - 06:00 PM to all weekdays</button>
</div>
</div>
</section>
{/* Address and Contact Info Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
{/* Address Section */}
<section id="location-section" className="settings-card bg-surface border border-border-gray rounded-xl p-lg scroll-mt-24">
<div className="flex items-center gap-sm mb-lg">
<div className="w-10 h-10 rounded-full bg-marketplace-orange/10 flex items-center justify-center text-marketplace-orange">
<span className="material-symbols-outlined">location_on</span>
</div>
<h3 className="font-title-md text-title-md">Shop Address</h3>
</div>
<div className="space-y-md">
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Street Address</label>
<input className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary outline-none" type="text" value={shop?.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Address not set"/>
</div>
<div className="grid grid-cols-2 gap-sm">
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">City</label>
<input className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary outline-none" type="text" value={shop?.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="City not set"/>
</div>
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Postal Code</label>
<input className="w-full bg-surface border-border-gray rounded-lg px-md py-sm font-body-md focus:border-primary outline-none" type="text" value={shop?.pincode || ''} onChange={(e) => handleInputChange('pincode', e.target.value)} placeholder="Pincode not set"/>
</div>
</div>
<div className="h-32 w-full rounded-lg bg-surface-container overflow-hidden border border-border-gray group cursor-pointer relative">
<img className="w-full h-full object-cover" data-alt="A clean, minimalist digital map interface showing a specific city block with a blue location pin. The map uses a soft, light-themed aesthetic with desaturated colors, emphasizing clarity and ease of use. A subtle drop shadow creates a sense of depth on the flat surface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF6VxJLXccnRreJxFDMRsD794BfUS5DptL_nVXxUlLSgmfqoBgXJqn6Jh8ZrFRW2aPALNbPVE1eF_ZmKsVtfwDU0hRhNq-cr5mwtC6T4Zqt710n-yCQ4xzjNy4JwH5PCxTWl7GHzSK_LAySDEYPDDjP_W6C4Fol_MYNlEbF4k6gD5F1-F7J06MAfeXeQ-5fJVc9NpUNobMD_pBtwp0aDjFzYUNP7lRoQpLgXElviVzVKXf5OO76DEpE7rrX0ZO0frAmjDiQ7mqAkAe"/>
<div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
<span className="bg-white px-md py-1 rounded-full font-label-sm shadow-md text-primary">Update Location on Map</span>
</div>
</div>
</div>
</section>
{/* Contact Details Section */}
<section id="contact-section" className="settings-card bg-surface border border-border-gray rounded-xl p-lg scroll-mt-24">
<div className="flex items-center gap-sm mb-lg">
<div className="w-10 h-10 rounded-full bg-trust-blue/10 flex items-center justify-center text-trust-blue">
<span className="material-symbols-outlined">contact_page</span>
</div>
<h3 className="font-title-md text-title-md">Contact Details</h3>
</div>
<div className="space-y-md">
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">phone</span>
<input className="w-full bg-surface border-border-gray rounded-lg pl-10 pr-md py-sm font-body-md focus:border-primary outline-none" type="tel" value={shop?.businessPhone || shop?.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Phone not set"/>
</div>
</div>
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
<input className="w-full bg-surface border-border-gray rounded-lg pl-10 pr-md py-sm font-body-md focus:border-primary outline-none" type="email" value={shop?.businessEmail || shop?.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="Email not set"/>
</div>
</div>
<div className="space-y-xs">
<label className="font-label-sm text-label-sm text-on-surface-variant">WhatsApp Number (Optional)</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">chat</span>
<input className="w-full bg-surface border-border-gray rounded-lg pl-10 pr-md py-sm font-body-md focus:border-primary outline-none" type="tel" value={shop?.whatsapp || ''} onChange={(e) => handleInputChange('whatsapp', e.target.value)} placeholder="WhatsApp number not set"/>
</div>
</div>
</div>
<div className="mt-lg p-md bg-surface-container-low rounded-lg border border-primary/5">
<p className="font-label-sm text-[12px] text-primary">Notifications for new orders will be sent to this email address.</p>
</div>
</section>
</div>
{/* Danger Zone */}
<section className="settings-card bg-error-container/20 border border-error/10 rounded-xl p-lg">
<div className="flex items-center gap-sm mb-md">
<span className="material-symbols-outlined text-error">warning</span>
<h3 className="font-title-md text-title-md text-error">Danger Zone</h3>
</div>
<div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
<div className="max-w-md">
<p className="font-title-md text-body-md font-bold text-error">Deactivate Shop</p>
<p className="font-body-md text-body-md text-on-surface-variant">Temporarily hide your shop and products from the marketplace. You can reactivate at any time.</p>
</div>
<button className="border border-error text-error px-lg py-sm rounded-xl font-label-sm hover:bg-error/5 transition-colors active:scale-95">Deactivate Shop</button>
</div>
</section>
</div>
</div>
</main>
{/* BottomNavBar (Mobile) */}

{/* Removed FAB per user request */}


    </>
  );
}
