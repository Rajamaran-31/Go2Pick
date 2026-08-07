import axios from 'axios';
import { auth } from '../firebase';

export const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error('Error getting Firebase ID Token:', e);
    }
  } else {
    const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/shopkeeper');
    const token = isAdminRoute 
      ? (localStorage.getItem('admin_token') || localStorage.getItem('go2pick_token'))
      : (localStorage.getItem('go2pick_token') || localStorage.getItem('admin_token'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We remove the automatic 401 logout here because it races with Firebase Auth initialization on page refresh.
    // AuthContext will handle invalid tokens gracefully.
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  signup: (data) => api.post('/api/auth/signup', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  toggleBlockUser: (id, isCurrentlyBlocked) => isCurrentlyBlocked
    ? api.put(`/api/admin/users/${id}/unblock`)
    : api.put(`/api/admin/users/${id}/block`),
  getShopkeeperRequests: (params) => api.get('/api/admin/shop-applications', { params }),
  approveRequest: (id) => api.put(`/api/admin/shopkeeper-requests/${id}/approve`),
  rejectRequest: (id, body) => api.put(`/api/admin/shopkeeper-requests/${id}/reject`, body),
  getShops: (params) => api.get('/api/admin/shops', { params }),
  toggleShop: (id) => api.put(`/api/admin/shops/${id}/toggle`),
  getOrders: (params) => api.get('/api/admin/orders', { params }),
  getReviews: (params) => api.get('/api/admin/reviews', { params }),
  updateReviewStatus: (id, status) => api.put(`/api/admin/reviews/${id}/status`, { status }),
};

export const shopsAPI = {
  getFeatured: () => api.get('/api/shops/featured'),
  listShops: (params) => api.get('/api/shops/', { params }),
  getShop: (id) => api.get(`/api/shops/${id}`),
};

export const productsAPI = {
  listProducts: (params) => api.get('/api/products/', { params }),
  getProduct: (id) => api.get(`/api/products/${id}`),
};

export const cartAPI = {
  getCart: () => api.get('/api/cart/'),
  addToCart: (data) => api.post('/api/cart/', data),
  updateItem: (id, data) => api.put(`/api/cart/${id}`, data),
  removeItem: (id) => api.delete(`/api/cart/${id}`),
  clearCart: () => api.delete('/api/cart/clear/all'),
};

export const categoriesAPI = {
  listCategories: () => api.get('/api/categories/'),
};

export const shopkeeperAPI = {
  getMyShop: () => api.get('/api/shopkeeper/my-shop'),
  getDashboard: () => api.get('/api/shopkeeper/dashboard'),
  getOrders: (params) => api.get('/api/shopkeeper/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/api/shopkeeper/orders/${id}/status`, { status }),
  verifyPickupCode: (id, pickupCode) => api.post(`/api/shopkeeper/orders/${id}/verify-code`, { pickupCode }),
};

export const ordersAPI = {
  getOrders: () => api.get('/api/orders/'),
  getMyOrders: () => api.get('/api/orders/my'),
  getOrder: (id) => api.get(`/api/orders/${id}`),
  createOrder: (data) => api.post('/api/orders/', data),
};

export default api;
