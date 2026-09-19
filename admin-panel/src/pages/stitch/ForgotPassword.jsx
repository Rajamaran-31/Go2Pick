import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step 1: Email Input
  // Step 2: Verification Code Input
  // Step 3: New Password Input
  // Step 4: Success State
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle STEP 1: Send Verification Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', {
        email: email.trim()
      });

      if (res.data?.success !== false) {
        setStep(2);
        setSuccessMsg('Verification code sent to your email.');
        setTimer(59);
        setCanResend(false);
      } else {
        setError(res.data?.message || 'Failed to send verification code.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error sending code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      const lastInput = document.getElementById(`forgot-otp-input-5`);
      if (lastInput) lastInput.focus();
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (!canResend || loading) return;
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', {
        email: email.trim()
      });
      if (res.data?.success !== false) {
        setSuccessMsg('A new 6-digit code has been sent to your email.');
        setTimer(59);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(res.data?.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle STEP 2: Verify OTP Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/auth/verify-forgot-otp', {
        email: email.trim(),
        otp: fullOtp
      });

      if (res.data?.success !== false) {
        setStep(3);
        setSuccessMsg('Code verified successfully! Please enter your new password.');
      } else {
        setError(res.data?.message || 'Invalid verification code.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Invalid or expired verification code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle STEP 3: Change Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const fullOtp = otp.join('');

    try {
      setLoading(true);
      const res = await api.post('/api/auth/reset-password', {
        email: email.trim(),
        otp: fullOtp,
        newPassword
      });

      if (res.data?.success !== false) {
        setStep(4);
        setSuccessMsg('Password updated successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.data?.message || 'Password update failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-surface-container/30 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Content Canvas */}
      <main className="w-full max-w-[440px] px-lg py-2xl z-10 flex flex-col items-center justify-center">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-xl">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-md shadow-lg shadow-primary/20 transition-transform hover:scale-105 duration-300">
            <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary tracking-tight font-bold">Go2Pick</h1>
        </div>

        {/* Card Container */}
        <div className="glass-panel border border-white/40 shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col gap-5 w-full bg-white">
          
          {/* Header Section */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              {step === 1 && 'Forgot Password?'}
              {step === 2 && 'Verify Code'}
              {step === 3 && 'Set New Password'}
              {step === 4 && 'Password Reset Complete'}
            </h2>
            <p className="text-xs text-slate-500 max-w-[320px] mx-auto">
              {step === 1 && "Enter your registered email address and we'll send a 6-digit verification code."}
              {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
              {step === 3 && 'Enter and confirm your new password below.'}
              {step === 4 && 'Your password has been changed. You can now log in.'}
            </p>
          </div>

          {/* Step Progress Indicators */}
          {step <= 3 && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`}></div>
              <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`}></div>
              <div className={`h-2 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`}></div>
            </div>
          )}

          {/* Feedback Banners */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-red-500 shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-green-600 shrink-0 mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email Form */}
          {step === 1 && (
            <form className="flex flex-col gap-4 w-full" onSubmit={handleSendCode}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-slate-800 placeholder:text-slate-400" 
                    id="email" 
                    placeholder="name@example.com" 
                    required 
                    type="email"
                  />
                </div>
              </div>

              <button 
                disabled={loading} 
                className={`h-11 bg-primary hover:bg-primary-container text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          )}

          {/* STEP 2: Verify Code Form */}
          {step === 2 && (
            <form className="flex flex-col gap-4 w-full" onSubmit={handleVerifyCode}>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2 text-center">6-Digit Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`forgot-otp-input-${index}`}
                      type="text"
                      maxLength="1"
                      pattern="\d*"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-primary focus:outline-none bg-slate-50 transition-all"
                    />
                  ))}
                </div>
                
                {/* Resend Timer */}
                <div className="text-center mt-3">
                  {!canResend ? (
                    <span className="text-[11px] text-slate-400">
                      Resend code in <strong className="text-slate-600">00:{timer < 10 ? `0${timer}` : timer}</strong>
                    </span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-[12px] font-semibold text-primary hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </div>

              <button 
                disabled={loading} 
                className={`h-11 bg-primary hover:bg-primary-container text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                <span>{loading ? "Verifying Code..." : "Verify Code"}</span>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccessMsg(''); }}
                className="text-xs text-slate-500 hover:text-slate-700 text-center font-medium"
              >
                Change Email
              </button>
            </form>
          )}

          {/* STEP 3: Change Password Form */}
          {step === 3 && (
            <form className="flex flex-col gap-4 w-full" onSubmit={handleResetPassword}>
              
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase & 1 number"
                    className="w-full h-11 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-slate-800 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 ml-1">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>

              <button 
                disabled={loading} 
                className={`h-11 bg-primary hover:bg-primary-container text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} 
                type="submit"
              >
                <span>{loading ? "Updating Password..." : "Update Password"}</span>
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              </button>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center gap-3 py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Password Changed Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">You can now sign in with your new password.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-11 bg-primary text-white font-semibold text-sm rounded-xl mt-2"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative h-[1px] bg-slate-100 my-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline py-1 px-3 rounded-lg" to="/login">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Login
            </Link>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 px-4">
          By proceeding, you agree to Go2Pick's Privacy Policy and Terms of Service.
        </p>
      </main>
    </div>
  );
}
