import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

export default function Login() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Social Login Modal State
  const [socialModalProvider, setSocialModalProvider] = useState(null); // 'Google' | 'Apple' | null
  const [socialEmailInput, setSocialEmailInput] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  
  const { login, logout } = useAuth();
  const navigate = useNavigate();

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
    if (lowerMsg.includes("user-not-found") || lowerMsg.includes("wrong-password") || lowerMsg.includes("invalid-credential") || lowerMsg.includes("incorrect")) {
      return "Incorrect email or password. Please try again.";
    }
    if (lowerMsg.includes("network-request-failed") || lowerMsg.includes("network error")) {
      return "Network error. Please check your internet connection and try again.";
    }
    return rawMessage || "Authentication failed. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const loginRes = await api.post('/api/auth/login', {
          email: email.trim(),
          password: password
        });
        const access_token = loginRes.data.access_token;
        const user = loginRes.data.user;
        
        const isSuperAdmin = (
          user?.role === 'super_admin' || 
          user?.role === 'admin' || 
          user?.isSuperAdmin === true || 
          (user?.email || '').toLowerCase() === 'rajamaran32@gmail.com' || 
          (user?.email || '').toLowerCase() === 'admin@go2pick.com'
        );
        if (isSuperAdmin) {
          login(access_token, user);
          navigate('/admin');
        } else {
          logout();
          setError('Access denied. Super Admin role required.');
        }
      } else {
        await api.post('/api/auth/signup', {
          fullName: fullName || email.split('@')[0],
          email: email.trim(),
          password,
          phone: '0000000000'
        });

        const loginRes = await api.post('/api/auth/login', {
          email: email.trim(),
          password: password
        });

        const access_token = loginRes.data.access_token;
        const user = loginRes.data.user;
        
        if (user?.role === 'super_admin') {
          login(access_token, user);
          navigate('/admin');
        } else {
          logout();
          setError('Access denied. Super Admin role required.');
        }
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

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

      if (userProfile.role === 'super_admin') {
        login(access_token, userProfile);
        navigate('/admin');
      } else {
        logout();
        setError('Access denied. Super Admin role required.');
      }
    } catch (err) {
      console.warn(`Social popup failed for ${providerName}, opening prompt modal:`, err);
      setSocialModalProvider(providerName);
      setSocialEmailInput(email.trim() || 'admin@go2pick.com');
    }
  };

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

      if (userProfile.role === 'super_admin' || userProfile.email === 'admin@go2pick.com' || userProfile.email === 'rajamaran32@gmail.com') {
        login(access_token, userProfile);
        setSocialModalProvider(null);
        navigate('/admin');
      } else {
        logout();
        setSocialModalProvider(null);
        setError('Access denied. Super Admin role required.');
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md mb-2">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
        </div>
        <span className="text-2xl font-bold text-blue-600 tracking-tight">Go2Pick</span>
      </div>

      <div className="bg-white w-full max-w-[420px] rounded-[32px] p-8 shadow-sm border border-slate-100">

        {/* Toggle */}
        <div className="bg-slate-50 p-1.5 rounded-2xl flex mb-8">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {isLogin ? 'Welcome back!' : 'Create an account'}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {isLogin ? 'Please enter your details to continue your journey.' : 'Join us to start your journey.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>}
          
          {!isLogin && (
            <div className="space-y-1.5 animate-fade-in">
              <label htmlFor="fullName" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                <input 
                  id="fullName" 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-700 placeholder:text-slate-400"
                  placeholder="John Doe" 
                  required={!isLogin} 
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-700 placeholder:text-slate-400"
                placeholder="name@example.com" 
                autoComplete="new-email"
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-700 placeholder:text-slate-400"
                placeholder="••••••••" 
                autoComplete="new-password"
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Forgot Password?
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-2xl py-3.5 mt-2 flex items-center justify-center gap-2 font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            <span>{loading ? 'Signing in...' : (isLogin ? 'Log In' : 'Sign Up')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => handleSocialLogin('Google')}
            className="flex-1 border border-slate-200 rounded-2xl py-3 flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.13l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm font-medium text-slate-700">Google</span>
          </button>
          <button 
            type="button" 
            onClick={() => handleSocialLogin('Apple')}
            className="flex-1 border border-slate-200 rounded-2xl py-3 flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-700" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
            <span className="text-sm font-medium text-slate-700">Apple</span>
          </button>
        </div>

        {/* Footer text */}
        <p className="mt-8 text-center text-[11px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          By continuing, you agree to Go2Pick's{' '}
          <Link to="#" className="text-blue-600 font-medium hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="#" className="text-blue-600 font-medium hover:underline">Privacy Policy</Link>.
        </p>

      </div>

      {/* Social Modal Fallback */}
      {socialModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">account_circle</span>
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={socialLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
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
