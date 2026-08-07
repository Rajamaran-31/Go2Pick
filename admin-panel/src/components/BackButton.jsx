import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Global floating back button that appears on all sub-pages.
 * Automatically hides on home/dashboard/root pages and auth screens.
 */
export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Pages where we should NOT show the back button
  const hideOnPaths = [
    '/',                 // Customer home
    '/login',            // Login
    '/signup',           // Signup
    '/admin/login',      // Admin login
    '/welcome',          // Welcome splash
    '/admin',            // Admin dashboard (exact)
    '/shopkeeper',       // Shopkeeper dashboard (exact)
  ];

  const shouldHide = hideOnPaths.includes(path);
  if (shouldHide) return null;

  // Determine color theme based on current route section
  let colorClass = 'text-trust-blue bg-white hover:bg-blue-50'; // customer default
  if (path.startsWith('/admin')) {
    colorClass = 'text-primary bg-white hover:bg-blue-50';
  } else if (path.startsWith('/shopkeeper')) {
    colorClass = 'text-marketplace-orange bg-white hover:bg-orange-50';
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback based on section
      if (path.startsWith('/admin')) navigate('/admin');
      else if (path.startsWith('/shopkeeper')) navigate('/shopkeeper');
      else navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`fixed top-20 left-4 z-40 p-2 rounded-full shadow-lg border border-slate-200/60 transition-all duration-200 active:scale-90 cursor-pointer backdrop-blur-sm ${colorClass}`}
      aria-label="Go back"
      title="Go back"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
    >
      <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
    </button>
  );
}
