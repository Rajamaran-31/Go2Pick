import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TitleContext = createContext();

export const TitleProvider = ({ children }) => {
  const [customTitle, setCustomTitle] = useState(null);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Reset custom title on route changes to let the default mode-based title take over
    setCustomTitle(null);
  }, [location.pathname]);

  useEffect(() => {
    if (customTitle) {
      document.title = customTitle;
    } else {
      const path = location.pathname;
      const activeMode = user?.activeMode || user?.currentMode || localStorage.getItem('go2pick_mode') || 'customer';

      if (path.startsWith('/admin')) {
        document.title = 'Go2Pick - Super Admin';
      } else if (path.startsWith('/shopkeeper')) {
        document.title = 'Go2Pick - Shopkeeper';
      } else if (activeMode === 'shopkeeper') {
        document.title = 'Go2Pick - Shopkeeper';
      } else if (activeMode === 'super_admin') {
        document.title = 'Go2Pick - Super Admin';
      } else {
        document.title = 'Go2Pick - Customer';
      }
    }
  }, [customTitle, location.pathname, user?.activeMode, user?.currentMode]);

  return (
    <TitleContext.Provider value={{ setCustomTitle }}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => useContext(TitleContext);

export const useDocumentTitle = (title) => {
  const { setCustomTitle } = useTitle();

  useEffect(() => {
    if (title) {
      setCustomTitle(title);
    }
    return () => setCustomTitle(null);
  }, [title, setCustomTitle]);
};
