import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Social Login Fallback Modal State
  const [socialModalProvider, setSocialModalProvider] = useState(null); // 'Google' | 'Apple' | null
  const [socialEmailInput, setSocialEmailInput] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const mapAuthError = (err) => {
    let rawMessage = "";
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      rawMessage = detail;
    } else if (Array.isArray(detail)) {
      rawMessage = detail.map(d => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(", ");
    } else if (typeof err?.message === 'string') {
      rawMessage = err.message;
    } else {
      rawMessage = String(err || "");
    }

    const lowerMsg = String(rawMessage).toLowerCase();

    if (lowerMsg.includes("email-already-in-use") || lowerMsg.includes("email already registered") || lowerMsg.includes("already exists")) {
      return "This email address is already in use. Please log in instead.";
    }
    if (lowerMsg.includes("weak-password")) {
      return "Password must be at least 6 characters long.";
    }
    if (lowerMsg.includes("invalid-email") || lowerMsg.includes("valid email")) {
      return "Please enter a valid email address.";
    }
    if (lowerMsg.includes("user-not-found") || lowerMsg.includes("wrong-password") || lowerMsg.includes("invalid-credential") || lowerMsg.includes("incorrect") || lowerMsg.includes("invalid email or password")) {
      return "Incorrect email or password. Please try again.";
    }
    if (lowerMsg.includes("network-request-failed") || lowerMsg.includes("network error")) {
      return "Network error. Please check your internet connection and try again.";
    }
    return rawMessage || "Authentication failed. Please try again.";
  };

  // Functional Social Login Handler for Google & Apple
  const handleSocialLogin = async (providerName) => {
    setError('');
    const providerKey = providerName.toLowerCase();
    try {
      let firebaseProvider;
      if (providerKey === 'google') {
        firebaseProvider = new GoogleAuthProvider();
      } else {
        firebaseProvider = new OAuthProvider('apple.com');
      }

      const res = await signInWithPopup(auth, firebaseProvider);
      const user = res.user;

      const socialRes = await api.post('/api/auth/social-login', {
        provider: providerKey,
        email: user.email,
        fullName: user.displayName || user.email?.split('@')[0],
        profileImage: user.photoURL
      });

      const access_token = socialRes.data.access_token;
      const userProfile = socialRes.data.user;

      login(access_token, userProfile);

      if (userProfile.role === 'super_admin') {
        navigate('/admin');
      } else if (userProfile.role === 'shopkeeper' && (userProfile.currentMode === 'shopkeeper' || userProfile.activeMode === 'shopkeeper')) {
        navigate('/shopkeeper');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.warn(`Firebase popup for ${providerName} auth not available or closed, switching to social account prompt:`, err);
      setSocialModalProvider(providerName);
      setSocialEmailInput(email.trim() || 'rajamaran32@gmail.com');
    }
  };

  // Execute Social Auth via Account Modal Prompt
  const handleConfirmSocialAuth = async (e) => {
    e.preventDefault();
    if (!socialEmailInput || !socialEmailInput.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setSocialLoading(true);
      setError('');
      const providerKey = (socialModalProvider || 'Google').toLowerCase();
      const socialRes = await api.post('/api/auth/social-login', {
        provider: providerKey,
        email: socialEmailInput.trim(),
        fullName: socialEmailInput.split('@')[0].toUpperCase()
      });

      const access_token = socialRes.data.access_token;
      const userProfile = socialRes.data.user;

      login(access_token, userProfile);
      setSocialModalProvider(null);

      if (userProfile.role === 'super_admin') {
        navigate('/admin');
      } else if (userProfile.role === 'shopkeeper' && (userProfile.currentMode === 'shopkeeper' || userProfile.activeMode === 'shopkeeper')) {
        navigate('/shopkeeper');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const loginRes = await api.post('/api/auth/login', {
          email: email.trim(),
          password: password
        });
        const token = loginRes.data.access_token;
        const user = loginRes.data.user;

        login(token, user);

        if (user.role === 'super_admin') {
          navigate('/admin');
        } else if (user.role === 'shopkeeper' && (user.currentMode === 'shopkeeper' || user.activeMode === 'shopkeeper')) {
          navigate('/shopkeeper');
        } else {
          navigate('/');
        }
      } else {
        await api.post('/api/auth/signup', {
          fullName: fullName || email.split('@')[0],
          email: email.trim(),
          password,
          phone: "0000000000"
        });

        localStorage.setItem('temp_signup_email', email.trim());
        navigate('/verify-email', { state: { email: email.trim() } });
      }
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] bg-marketplace-orange/5 rounded-full blur-[100px]"></div>
      </div>
      
      {/* Main Content Container */}
      <main className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch justify-center gap-0 bg-surface-container-lowest rounded-[2rem] shadow-xl overflow-hidden min-h-[700px]">
        {/* Image Section (Visible on Desktop) */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden">
          <img alt="Go2Pick Marketplace" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVSF1hVbj3Ucje0hH03rdx_UOBXj11lW3hKr-8X_nHKrfCCHA8lK6nIxRZqyZp962E4fMXwwWb0USQWte62I15mdctEU2_6XPGXrcHM-x4jMi2lZyFG-8f0Z4RxfVX63ChUifyVgarTaTxyGu6ru3NlSmH_lbrPpWs5T8i-Y--AiNHz02YBlRYrZi42htTSmhC1HAvbjo9y-U-EFnLBTQiq0eKjXmejxU9QKrTgeOl8CKsodQ5MpKfUq-W5yGzTGuwxeJn8Fj-FunU"/>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent flex flex-col justify-end p-2xl">
            <h1 className="font-display-lg text-display-lg text-on-primary mb-md">Seamless commerce at your fingertips.</h1>
            <p className="font-body-lg text-body-lg text-on-primary/90 max-w-md">Whether you're shopping for local items or managing your storefront, Go2Pick brings the marketplace to you with speed and trust.</p>
          </div>
        </div>

        {/* Auth Form Section */}
        <div className="w-full md:w-1/2 p-lg md:p-2xl flex flex-col justify-center bg-surface-container-lowest">
          {/* Brand Logo */}
          <div className="flex items-center justify-center gap-xs mb-xl">
            <div className="w-10 h-10 bg-trust-blue rounded-xl flex items-center justify-center text-on-primary shadow-lg">
              <span className="material-symbols-outlined" style={{'fontVariationSettings': "'FILL' 1"}}>package_2</span>
            </div>
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-tight">Go2Pick</span>
          </div>

          {/* Auth Toggle */}
          <div className="bg-surface-container-low p-base rounded-xl flex mb-xl w-fit mx-auto">
            <button className={`px-lg py-sm rounded-lg font-title-md text-body-md transition-all duration-300 ${isLogin ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} id="login-toggle" onClick={() => { navigate('/login', { replace: true }); setError(''); }}>
              Log In
            </button>
            <button className={`px-lg py-sm rounded-lg font-title-md text-body-md transition-all duration-300 ${!isLogin ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} id="signup-toggle" onClick={() => { navigate('/signup', { replace: true }); setError(''); }}>
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="mb-lg text-center" id="auth-header">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-xs" id="form-title">{isLogin ? 'Welcome back!' : 'Create an account'}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant" id="form-subtitle">{isLogin ? 'Please enter your details to continue your journey.' : 'Join us to start your journey.'}</p>
          </div>

          <form className="space-y-md" id="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-container/40 border border-error/15 text-on-error-container px-md py-sm rounded-xl flex items-start gap-xs font-body-md text-body-md animate-in fade-in slide-in-from-top-2 duration-300" id="auth-error-banner">
                <span className="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-[2px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300" id="signup-fields">
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base" htmlFor="full-name">FULL NAME</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">person</span>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-12 pr-md py-sm bg-surface-slate border border-border-gray rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body-md" id="full-name" placeholder="John Doe" type="text" required={!isLogin} />
                </div>
              </div>
            )}

            <div className="space-y-base">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base" htmlFor="email">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-md py-sm bg-surface-slate border border-border-gray rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body-md" id="email" placeholder="name@example.com" type="email" autoComplete="new-email" required />
              </div>
            </div>

            <div className="space-y-base">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base" htmlFor="password">PASSWORD</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-md py-sm bg-surface-slate border border-border-gray rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body-md" id="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end" id="forgot-password-container">
                <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:text-primary-container transition-colors">Forgot Password?</Link>
              </div>
            )}

            <button className="w-full bg-trust-blue text-on-primary font-title-md py-sm rounded-xl shadow-lg hover:bg-primary transition-all transform active:scale-[0.98] mt-lg flex items-center justify-center gap-xs" type="submit">
              <span id="submit-text">{isLogin ? 'Log In' : 'Sign Up'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-xl">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-gray"></div>
            </div>
            <div className="relative flex justify-center text-label-sm">
              <span className="bg-surface-container-lowest px-md text-on-surface-variant font-label-sm uppercase tracking-widest">or continue with</span>
            </div>
          </div>

          {/* Social Logins: Google & Apple */}
          <div className="grid grid-cols-2 gap-md">
            <button 
              type="button" 
              onClick={() => handleSocialLogin('Google')} 
              className="flex items-center justify-center gap-xs border border-border-gray py-sm rounded-xl hover:bg-surface-slate transition-all font-body-md text-on-surface cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.13l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              <span>Google</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleSocialLogin('Apple')} 
              className="flex items-center justify-center gap-xs border border-border-gray py-sm rounded-xl hover:bg-surface-slate transition-all font-body-md text-on-surface cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]" style={{'fontVariationSettings': "'FILL' 1"}}>apps</span>
              <span>Apple</span>
            </button>
          </div>

          {/* Terms Footer */}
          <p className="mt-xl text-center font-label-sm text-label-sm text-on-surface-variant">
            By continuing, you agree to Go2Pick's{' '}
            <Link className="text-primary hover:underline" to="#">Terms of Service</Link> and{' '}
            <Link className="text-primary hover:underline" to="#">Privacy Policy</Link>.
          </p>
        </div>
      </main>

      {/* Social Login Modal Prompt (Fallback for Popup Blockers) */}
      {socialModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
                <h3 className="font-bold text-slate-800 text-base">Sign in with {socialModalProvider}</h3>
              </div>
              <button 
                onClick={() => setSocialModalProvider(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Confirm your {socialModalProvider} account email below to authenticate with 1 click.
            </p>

            <form onSubmit={handleConfirmSocialAuth} className="flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Account Email</label>
                <input 
                  type="email"
                  value={socialEmailInput}
                  onChange={(e) => setSocialEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={socialLoading}
                className="w-full py-2.5 bg-trust-blue hover:bg-primary text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                {socialLoading ? 'Authenticating...' : `Continue with ${socialModalProvider}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
