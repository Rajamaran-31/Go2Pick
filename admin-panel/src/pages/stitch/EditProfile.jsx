import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        if (res.data) {
          setFormData({
            name: res.data.fullName || res.data.name || '',
            email: res.data.email || '',
            phone: res.data.phone || ''
          });
        }
      })
      .catch(err => console.error("Error loading profile details:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put('/api/auth/profile', {
        name: formData.name,
        phone: formData.phone
      });
      window.alert('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error("Failed to update profile:", err);
      window.alert(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-safe">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center px-md h-14">
        <button onClick={() => navigate('/profile')} className="active:scale-95 transition-transform text-primary p-2 -ml-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold ml-sm">Edit Profile</h1>
      </header>

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-lg">
        <div className="flex flex-col items-center mb-lg">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-sm border-4 border-surface shadow-sm relative">
            <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZG6KrovJxIHiZxn6FYi-NfLd92btdlcT_SjW3u-uWhD0duAmbzP1cFu05cnYpo5wi36l6mdjCFFvswhoDyez2YvP65n-ZpsVHqqDBdgr0N5BsOzM90bT4PTGam_rSTXFnCoBsMAvGf2sXYDKi1HTx5TMBHRh5QGP5TOkTAcc3hNQQlrXFNFb8SIJpNRL5AhkqEnve_A4Eoc3aWRZkdzEEbLEvbiBWc0we4WkkeKi-sITtbnuvyDgPbij3uMw-_dqyZqOpdxyGh7x9" />
            <button className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
          </div>
          <p className="font-label-md text-primary cursor-pointer hover:underline">Change Photo</p>
        </div>

        <div className="space-y-md">
          <div>
            <label className="block font-label-md text-on-surface-variant mb-xs">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-border-gray bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block font-label-md text-on-surface-variant mb-xs">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-border-gray bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none opacity-70 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block font-label-md text-on-surface-variant mb-xs">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-border-gray bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-md bg-primary text-on-primary rounded-full font-label-lg mt-xl active:scale-95 transition-transform shadow-sm">
          Save Changes
        </button>
      </main>
    </div>
  );
}
