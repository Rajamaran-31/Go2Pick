import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (tokenValue, userData) => {
    localStorage.setItem('admin_token', tokenValue);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('picku_token', tokenValue);
    localStorage.setItem('picku_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('picku_token');
    localStorage.removeItem('picku_user');
    localStorage.removeItem('picku_mode');
    setToken(null);
    setUser(null);
    auth.signOut().catch(e => console.error("Firebase signout error:", e));
  };

  useEffect(() => {
    let isMounted = true;
    let authListenerTriggered = false;

    const handleLocalFallback = async () => {
      const savedToken = localStorage.getItem('admin_token') || localStorage.getItem('picku_token');
      const savedUser = localStorage.getItem('admin_user') || localStorage.getItem('picku_user');

      if (savedToken) {
        try {
          const res = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (res.data && res.data.success !== false) {
            const userData = res.data.user || res.data;
            if (isMounted) {
              setToken(savedToken);
              setUser(userData);
              console.log("DEBUG [AuthContext]: legacy local session restored");
            }
          } else {
            if (isMounted) logout();
          }
        } catch (err) {
          console.error("DEBUG [AuthContext]: legacy session validation failed:", err.message);
          if (isMounted) logout();
        }
      } else {
        if (isMounted) logout();
      }
      if (isMounted) setLoading(false);
    };

    // We set up a timeout to handle fallback in case Firebase Auth doesn't trigger onAuthStateChanged quickly
    const fallbackTimeout = setTimeout(async () => {
      if (!authListenerTriggered) {
        console.log("DEBUG [AuthContext]: Firebase auth listener timeout, checking local fallback");
        await handleLocalFallback();
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("DEBUG [AuthContext]: onAuthStateChanged triggered:", firebaseUser?.email);
      authListenerTriggered = true;
      clearTimeout(fallbackTimeout);

      if (firebaseUser) {
        try {
          const tokenValue = await firebaseUser.getIdToken();
          const res = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${tokenValue}` }
          });
          
          if (res.data && res.data.success !== false) {
             const userData = res.data.user || res.data;
             if (isMounted) {
               localStorage.setItem('admin_token', tokenValue);
               localStorage.setItem('picku_token', tokenValue);
               localStorage.setItem('admin_user', JSON.stringify(userData));
               localStorage.setItem('picku_user', JSON.stringify(userData));
               setToken(tokenValue);
               setUser(userData);
               console.log("DEBUG [AuthContext]: Firebase auth restored successfully");
             }
          } else {
             console.log("DEBUG [AuthContext]: backend me failed, logging out");
             if (isMounted) logout();
          }
        } catch (error) {
          console.error("DEBUG [AuthContext]: token validation failed:", error.message);
          if (isMounted) logout();
        }
      } else {
        console.log("DEBUG [AuthContext]: Firebase user is null, trying local fallback");
        await handleLocalFallback();
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem('admin_token') || localStorage.getItem('picku_token');
    if (activeToken) {
      try {
        const res = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.data) {
          const userData = res.data.user || res.data;
          localStorage.setItem('admin_user', JSON.stringify(userData));
          localStorage.setItem('picku_user', JSON.stringify(userData));
          setUser(userData);
          return userData;
        }
      } catch (err) {
        console.error("Failed to refresh user:", err);
      }
    }
    return null;
  };

  // Switch mode persistence
  const updateUser = (newUserData) => {
    localStorage.setItem('admin_user', JSON.stringify(newUserData));
    localStorage.setItem('picku_user', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const isAuthenticated = !!token && (user?.role === 'admin' || user?.role === 'super_admin');

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, refreshUser, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
