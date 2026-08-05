import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ShippingAddress() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    api.get('/api/customer/addresses').then(res => {
      if (res.data?.addresses) setAddresses(res.data.addresses);
    }).catch(err => console.error("API Error:", err));
  }, []);


  return (
    <div className="bg-surface min-h-screen pb-safe">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center px-md h-14">
        <button onClick={() => navigate('/profile')} className="active:scale-95 transition-transform text-primary p-2 -ml-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold ml-sm">Shipping Address</h1>
      </header>

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-md">
        {addresses.map((addr) => (
          <div key={addr.id} className="glass-card p-md rounded-xl shadow-sm border border-border-gray flex items-start gap-md">
            <span className="material-symbols-outlined text-trust-blue mt-1">
              {addr.type === 'Home' ? 'home' : 'work'}
            </span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-xs">
                <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                  {addr.type}
                  {addr.isDefault && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Default</span>}
                </h3>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
              <p className="font-body-md text-on-surface-variant">{addr.address}</p>
              <p className="font-body-md text-on-surface-variant">{addr.city}</p>
            </div>
          </div>
        ))}

        <button onClick={() => window.alert('Add address form would open here.')} className="w-full py-md mt-lg border-2 border-dashed border-primary text-primary rounded-xl font-label-lg flex items-center justify-center gap-xs hover:bg-primary/5 active:scale-95 transition-all">
          <span className="material-symbols-outlined">add</span>
          Add New Address
        </button>
      </main>
    </div>
  );
}
