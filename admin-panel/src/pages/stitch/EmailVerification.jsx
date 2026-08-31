import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  // Retrieve email to verify
  const [email, setEmail] = useState(() => {
    if (location.state?.email) return location.state.email;
    const temp = localStorage.getItem('temp_signup_email');
    if (temp) return temp;
    const savedUser = JSON.parse(localStorage.getItem('go2pick_user') || '{}');
    return savedUser.email || '';
  });

  const [inputEmail, setInputEmail] = useState(email);

  useEffect(() => {
    if (!email) {
      setError("No email specified. Please enter your email address below or sign in.");
    } else {
      setError("");
    }
  }, [email]);

  // Countdown timer logic
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerify = async () => {
    setError('');
    setSuccessMsg('');
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      const res = await api.post('/api/auth/verify-email', {
        email,
        otp: fullOtp
      });
      if (res.data.success) {
        // Save verified token and user info
        localStorage.setItem('go2pick_token', res.data.access_token);
        localStorage.setItem('go2pick_user', JSON.stringify(res.data.user));
        
        // Also save as admin token/user for compatibility
        localStorage.setItem('admin_token', res.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(res.data.user));
        
        localStorage.removeItem('temp_signup_email');
        setSuccessMsg('Email verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(res.data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Please check the code and try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/api/auth/resend-otp', {
        email,
        type: 'signup'
      });
      if (res.data.success) {
        setSuccessMsg('A new verification code has been sent to your email.');
        setTimer(59);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      } else {
        setError(res.data.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-surface/80 flex justify-between items-center px-md h-14 border-b border-surface-variant/30">
        <div className="flex items-center gap-xs">
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">Go2Pick</span>
        </div>
        <button onClick={() => navigate("/login")} className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center px-md pt-20 pb-xl z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md mb-2">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          </div>
          <span className="text-2xl font-bold text-primary tracking-tight">Go2Pick</span>
        </div>
        
        <div className="max-w-[480px] w-full bg-surface-container-lowest rounded-xl shadow-lg p-xl md:p-2xl text-center flex flex-col items-center">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-xs">Verify Your Email</h1>
          <p className="text-on-surface-variant mb-xl max-w-[320px]">
            We've sent a 6-digit verification code to <span className="text-on-surface font-semibold">{email || 'your email'}</span>.
          </p>

          {!email && (
            <div className="w-full mb-md text-left">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Enter Registered Email</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={inputEmail} 
                  onChange={(e) => setInputEmail(e.target.value)} 
                  placeholder="your.email@example.com" 
                  className="flex-1 px-3 py-2 border border-border-gray rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={() => {
                    if (inputEmail.trim()) {
                      setEmail(inputEmail.trim());
                      localStorage.setItem('temp_signup_email', inputEmail.trim());
                      setError('');
                    }
                  }} 
                  className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Set Email
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full bg-error-container/40 border border-error/15 text-on-error-container px-md py-sm rounded-xl flex items-start gap-xs font-body-md text-body-md mb-md text-left" id="verify-error-banner">
              <span className="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-[2px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-green-500/10 border border-green-500/20 text-green-700 px-md py-sm rounded-xl flex items-start gap-xs font-body-md text-body-md mb-md text-left" id="verify-success-banner">
              <span className="material-symbols-outlined text-[20px] text-green-600 flex-shrink-0 mt-[2px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 mb-xl justify-center" id="otp-container">
            {otp.map((digit, index) => (
              <input 
                key={index} 
                id={`otp-input-${index}`}
                value={digit} 
                onChange={(e) => handleChange(index, e.target.value)} 
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoComplete="one-time-code" 
                className="otp-input w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border-2 border-border-gray rounded-lg focus:border-primary focus:outline-none bg-surface transition-all" 
                maxLength="1" 
                pattern="\d*" 
                type="text"
              />
            ))}
          </div>

          <button onClick={handleVerify} className="w-full bg-primary text-on-primary py-md rounded-lg font-title-md text-title-md hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all mb-lg">
            Verify
          </button>

          <div className="flex flex-col items-center gap-base">
            {!canResend ? (
              <p className="text-on-surface-variant" id="countdown-text">
                Resend code in <span className="font-semibold text-on-surface" id="timer">00:{timer < 10 ? `0${timer}` : timer}</span>
              </p>
            ) : (
              <button 
                className="text-primary font-semibold hover:underline transition-opacity" 
                onClick={handleResend} 
                id="resend-btn"
              >
                Resend Code
              </button>
            )}
          </div>

          <div className="mt-xl pt-lg border-t border-surface-variant/30 flex items-center justify-center gap-xs text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-label-sm font-label-sm uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>
      </main>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-marketplace-orange/5 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}
