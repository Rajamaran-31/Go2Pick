import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/verify-email');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-surface-container/30 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Main Content Canvas */}
      <main className="w-full max-w-[440px] px-lg py-2xl z-10 flex flex-col items-center justify-center">
        {/* Logo / Branding Anchor */}
        <div className="flex flex-col items-center mb-xl">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-md shadow-lg shadow-primary/20 transition-transform hover:scale-105 duration-300">
            <span className="material-symbols-outlined text-white text-3xl" data-icon="lock_reset">lock_reset</span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight">Go2Pick</h1>
        </div>
        
        {/* Card Container */}
        <div className="glass-panel border border-white/40 shadow-xl rounded-2xl p-xl flex flex-col gap-lg w-full bg-surface-container-lowest">
          {/* Header Section */}
          <div className="text-center space-y-xs">
            <h2 className="font-title-md text-title-md text-on-surface">Reset Password</h2>
            <p className="font-body-md text-on-surface-variant max-w-[300px] mx-auto">
              Enter the email address associated with your account and we'll send a link to reset your password.
            </p>
          </div>
          {/* Form Section */}
          {!success ? (
            <form className="flex flex-col gap-md w-full" onSubmit={handleSubmit}>
              <div className="space-y-base">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                    <span className="material-symbols-outlined text-[20px]" data-icon="mail">mail</span>
                  </div>
                  <input value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 pl-[48px] pr-md bg-surface-container-lowest border border-border-gray rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-on-surface placeholder:text-outline-variant/60" id="email" placeholder="name@company.com" required="" type="email"/>
                </div>
              </div>
              {/* Primary Action */}
              <button className="h-12 bg-primary hover:bg-primary-container text-on-primary font-title-md text-body-lg rounded-xl flex items-center justify-center gap-xs transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10" id="submitButton" type="submit">
                <span>Send Reset Link</span>
                <span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </form>
          ) : (
            <div className="flex-col items-center text-center gap-md py-md animate-in fade-in zoom-in duration-300 flex" id="successState">
              {/* Success State */}
              <div className="w-12 h-12 bg-success-green/10 text-success-green rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" data-icon="check_circle" style={{'fontVariationSettings': "'FILL' 1"}}>check_circle</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Link Sent!</h3>
                <p className="font-body-md text-on-surface-variant mt-xs">Check your inbox for instructions to reset your password.</p>
              </div>
            </div>
          )}
          {/* Divider */}
          <div className="relative h-[1px] bg-border-gray">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border-gray to-transparent"></div>
          </div>
          {/* Back to Login Anchor */}
          <div className="text-center">
            <Link className="inline-flex items-center gap-xs font-label-sm text-label-sm text-primary hover:text-primary-container transition-colors py-xs px-md rounded-lg hover:bg-primary/5" to="/login">
              <span className="material-symbols-outlined text-[16px]" data-icon="arrow_back">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
        {/* Footer / Branding */}
        <p className="mt-xl text-center font-label-sm text-label-sm text-on-surface-variant/60 px-lg">
          By proceeding, you agree to Go2Pick's Privacy Policy and Terms of Service.
        </p>
      </main>
      {/* Visual Polish Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <img className="hidden" data-alt="A sophisticated abstract background with soft, flowing gradients of deep professional blue and clean white. The lighting is diffused and high-key, creating a high-trust corporate atmosphere. Subtle textures like frosted glass or silk create a sense of refined depth and modern elegance, consistent with a secure financial or tech login interface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4ubpYwhEfASibrTvG_EMyfI1ggczifZCpi4EhmIkFrkzAGfOIrL4_klJbFtK2CzShNgydPUNkonad6MXnv_E0WMF2-4_BmwfcNMOOIADPvStAxpHnXld7BKXoYYhhw7jRShH0X_3yxXbSBIezefOHHfSnav6J7SbIHA5r7wB4CqwMBDg1TAI3KSr6oXPH3JMbiuLpxja6aCyWb7Zz8ojKT0gIDl6t_p9buWTD_8rMjn-5EzZoArIs7Mbz00m3sVbMyIkgcwe0qv4e"/>
      </div>
    </div>
  );
}
