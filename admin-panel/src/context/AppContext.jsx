import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [isShopApproved, setIsShopApproved] = useState(false);
  const [isShopkeeperMode, setIsShopkeeperMode] = useState(() => {
    return localStorage.getItem('picku_mode') === 'shopkeeper';
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasGetAccessNotification, setHasGetAccessNotification] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");

  const setShopkeeperMode = (val) => {
    setIsShopkeeperMode(val);
    const mode = val ? 'shopkeeper' : 'customer';
    localStorage.setItem('picku_mode', mode);
    if (user) {
      setUser({ ...user, activeMode: mode, currentMode: mode });
    }
    
    // Asynchronously notify backend
    api.post('/api/auth/switch-mode', { activeMode: mode })
      .catch(err => console.warn("Failed to sync mode with backend:", err));
  };

  useEffect(() => {
    if (user) {
      const mode = user.currentMode || user.activeMode || 'customer';
      const isShopMode = mode === 'shopkeeper';
      setIsShopkeeperMode(isShopMode);
      localStorage.setItem('picku_mode', isShopMode ? 'shopkeeper' : 'customer');
    }
  }, [user]);

  useEffect(() => {
    api.get('/health')
      .then(res => {
        if (res.data?.database === "disconnected") {
          setDbStatus("disconnected");
        } else {
          setDbStatus("connected");
        }
      })
      .catch(err => {
        console.error("Health check failed:", err);
        setDbStatus("disconnected");
      });
  }, []);

  const refreshNotifications = () => {
    const userToken = localStorage.getItem('picku_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (!userToken) return Promise.resolve([]);
    return api.get('/api/notifications')
      .then(res => {
        const list = res.data?.notifications || [];
        setNotifications(list);
        const unread = list.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        const hasAccess = list.some(
          n => n.type === "shop_approved" && n.actionType === "ENABLE_SHOPKEEPER_DASHBOARD"
        );
        setHasGetAccessNotification(hasAccess);
        return list;
      })
      .catch(err => {
        console.error("Notifications refresh error:", err);
        return [];
      });
  };

  const markAllNotificationsAsRead = () => {
    const userToken = localStorage.getItem('picku_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (!userToken) return Promise.resolve();

    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    return api.post('/api/notifications/read-all')
      .catch(err => {
        console.error("Failed to mark all notifications as read:", err);
      });
  };

  useEffect(() => {
    // We already have interceptors in api.js handling token, but let's check if we have one to avoid unnecessary calls
    const userToken = localStorage.getItem('picku_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
    
    if (userToken) {
      // Ensure the token is set in api interceptor if not already
      localStorage.setItem('picku_token', userToken);

      // Fetch shopkeeper status
      api.get('/api/shopkeeper/status')
        .then(res => {
          const data = res.data;
          console.log("Shopkeeper status response:", data);
          if (data.is_approved === true) {
            setIsShopApproved(true);
            console.log("isShopApproved set to TRUE");
          } else {
            setIsShopApproved(false);
            console.log("isShopApproved remains FALSE, status:", data.status);
          }
        })
        .catch(err => console.error("Status fetch error:", err));

      // Fetch notifications
      refreshNotifications();

      // Set up periodic polling for real-time notification badge increments
      const interval = setInterval(() => {
        refreshNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
        isShopApproved, 
        setIsShopApproved,
        isShopkeeperMode,
        setIsShopkeeperMode: setShopkeeperMode,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        hasGetAccessNotification,
        setHasGetAccessNotification,
        dbStatus,
        refreshNotifications,
        markAllNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
