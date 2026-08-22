import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalDashboard from './pages/stitch/GlobalDashboard';
import ShopManagement from './pages/stitch/ShopManagement';
import ShopApprovals from './pages/stitch/ShopApprovals';
import UserManagementwithNavDrawer from './pages/stitch/UserManagementwithNavDrawer';
import ShopDetails from './pages/stitch/ShopDetails';
import ShopReviewDetail from './pages/stitch/ShopReviewDetail';
import ShopkeeperDashboard from './pages/stitch/ShopkeeperDashboard';
import ShopkeeperOrders from './pages/stitch/ShopkeeperOrders';
import ShopkeeperProducts from './pages/stitch/ShopkeeperProductswithBulkButton';
import ShopkeeperReports from './pages/stitch/ShopkeeperReports';
import ShopkeeperProfile from './pages/stitch/ShopkeeperProfile';
import BulkProductImportSheet from './pages/stitch/BulkProductImportSheet';
import ShopRegistration from './pages/stitch/ShopRegistration';
import CustomerHome from './pages/stitch/CustomerHome';
import CustomerProfile from './pages/stitch/CustomerProfile';
import ShoppingCart from './pages/stitch/ShoppingCart';
import CheckoutWithConfirmationPopup from './pages/stitch/CheckoutWithConfirmationPopup';
import CustomerOrderHistory from './pages/stitch/CustomerOrderHistory';
import EditProfile from './pages/stitch/EditProfile';
import ShippingAddress from './pages/stitch/ShippingAddress';
import MyReviews from './pages/stitch/MyReviews';
import LanguageSettings from './pages/stitch/LanguageSettings';
import CustomerSettings from './pages/stitch/CustomerSettings';

import WelcomePage from './pages/stitch/WelcomePage';
import LoginSignup from './pages/stitch/LoginSignup';
import CategoryListing from './pages/stitch/CategoryListing';
import ProductDetails from './pages/stitch/ProductDetails';
import OrderTracking from './pages/stitch/OrderTracking';
import SearchExplore from './pages/stitch/SearchExplore';
import HelpSupport from './pages/stitch/HelpSupport';
import NotificationsCenter from './pages/stitch/NotificationsCenter';
import ShopkeeperNotifications from './pages/stitch/ShopkeeperNotifications';
import AdminNotifications from './pages/stitch/AdminNotifications';
import ImportProducts from './pages/stitch/ImportProducts';
import NoOrdersFound from './pages/stitch/NoOrdersFound';
import ShopSettings from './pages/stitch/ShopSettings';
import AddEditProduct from './pages/stitch/AddEditProduct';
import UserSupportDashboard from './pages/stitch/UserSupportDashboard';
import ShopkeeperSupport from './pages/stitch/ShopkeeperSupport';
import ShopkeeperSupportTickets from './pages/stitch/ShopkeeperSupportTickets';
import ShopkeeperTicketConversation from './pages/stitch/ShopkeeperTicketConversation';
import PlatformSettings from './pages/stitch/PlatformSettings';
import PayoutEarningsDetail from './pages/stitch/PayoutEarningsDetail';
import ForgotPassword from './pages/stitch/ForgotPassword';
import ReviewManagement from './pages/stitch/ReviewManagement';
import EmailVerification from './pages/stitch/EmailVerification';
import AdminAnalytics from './pages/stitch/AdminAnalytics';
import MerchantLogs from './pages/stitch/MerchantLogs';
import SystemHealth from './pages/stitch/SystemHealth';
import AuditTrail from './pages/stitch/AuditTrail';
import AdminRoleSettings from './pages/stitch/AdminRoleSettings';
import ShopReviews from './pages/stitch/ShopReviews';
import BottomTabBar from './components/BottomTabBar';
import BackButton from './components/BackButton';

function PrivateRoute() {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  const hasAccess = token && user?.role === 'super_admin';
  return hasAccess ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

function ShopkeeperRoute() {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  
  console.log("DEBUG [ShopkeeperRoute]:", {
    role: user?.role,
    isShopkeeper: user?.isShopkeeper,
    shopkeeperStatus: user?.shopkeeperStatus,
    shopkeeperDashboardEnabled: user?.shopkeeperDashboardEnabled,
    activeMode: user?.activeMode || user?.currentMode
  });

  if (!token) return <Navigate to="/" replace />;

  if (user?.isShopkeeper !== true || user?.shopkeeperStatus !== 'approved') {
    alert("Your shopkeeper access is not approved yet.");
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

function DbOfflineBanner() {
  const { dbStatus } = useAppContext();
  if (dbStatus !== "disconnected") return null;
  return (
    <div style={{
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      padding: '12px 16px',
      borderBottom: '1px solid #fee2e2',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <span style={{ fontSize: '18px' }}>⚠️</span>
      <span><strong>Database Connection Error:</strong> Unable to connect to the backend database service. Please ensure the backend server is running.</span>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-primary animate-spin"></div>
          <span className="material-symbols-outlined absolute text-3xl text-primary font-bold animate-pulse">
            local_mall
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900">Go2Pick</h3>
        <p className="text-sm text-slate-500 mt-1 font-medium animate-pulse">Restoring session...</p>
      </div>
    );
  }

  return (
    <AppProvider>
      <DbOfflineBanner />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />
          <Route path="/admin/login" element={<Login />} />
          
          {/* Customer / Public Silo - Wrapped in CustomerLayout */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<CustomerHome />} />
            <Route path="categories" element={<CategoryListing />} />
            <Route path="category/:categoryName" element={<CategoryListing />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="track-order" element={<OrderTracking />} />
            <Route path="explore" element={<SearchExplore />} />
            <Route path="support" element={<HelpSupport />} />
            <Route path="shop-details" element={<ShopDetails />} />
            <Route path="shop/:shopId/reviews" element={<ShopReviews />} />

            {/* Authenticated Customer Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="cart" element={<ShoppingCart />} />
              <Route path="checkout" element={<CheckoutWithConfirmationPopup />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="profile/address" element={<ShippingAddress />} />
              <Route path="profile/reviews" element={<MyReviews />} />
              <Route path="profile/language" element={<LanguageSettings />} />
              <Route path="profile/settings" element={<CustomerSettings />} />
              <Route path="orders" element={<CustomerOrderHistory />} />
              <Route path="register-shop" element={<ShopRegistration />} />
              <Route path="notifications" element={<NotificationsCenter />} />
            </Route>
          </Route>

          {/* Customer screens that do NOT need header/footer */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/shopkeeper/notifications" element={<ShopkeeperNotifications />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />

          {/* Super Admin Silo */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<GlobalDashboard />} />
            <Route path="users" element={<UserManagementwithNavDrawer />} />
            <Route path="approvals" element={<ShopApprovals />} />
            <Route path="shops" element={<ShopManagement />} />
            <Route path="shop-review" element={<ShopReviewDetail />} />
          
            <Route path="support" element={<UserSupportDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="settings/role" element={<AdminRoleSettings />} />
            <Route path="payouts" element={<Navigate to="/admin" replace />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="logs" element={<MerchantLogs />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="audit" element={<AuditTrail />} />
          </Route>

          {/* Shopkeeper Silo */}
          <Route path="/shopkeeper" element={<ShopkeeperRoute />}>
            <Route index element={<ShopkeeperDashboard />} />
            <Route path="orders" element={<ShopkeeperOrders />} />
            <Route path="products" element={<ShopkeeperProducts />} />
            <Route path="bulk-import" element={<BulkProductImportSheet />} />
            <Route path="reports" element={<ShopkeeperReports />} />
            <Route path="profile" element={<ShopkeeperProfile />} />
            <Route path="shops" element={<ShopManagement />} />
          
            <Route path="settings" element={<ShopSettings />} />
            <Route path="import-products" element={<ImportProducts />} />
            <Route path="edit-product" element={<AddEditProduct />} />
            <Route path="no-orders" element={<NoOrdersFound />} />
            <Route path="support" element={<ShopkeeperSupport />} />
            <Route path="support/tickets" element={<ShopkeeperSupportTickets />} />
            <Route path="support/tickets/:ticketId" element={<ShopkeeperTicketConversation />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BackButton />
        <BottomTabBar />
      </ErrorBoundary>
    </AppProvider>
  );
}
