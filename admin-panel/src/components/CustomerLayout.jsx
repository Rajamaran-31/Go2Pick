import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerHeader from './CustomerHeader';
import CustomerFooter from './CustomerFooter';

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Sticky top website navigation */}
      <CustomerHeader />
      
      {/* Main content wrapper */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      
      {/* Dynamic website footer */}
      <CustomerFooter />
    </div>
  );
}
