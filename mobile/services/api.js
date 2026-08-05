import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';

export const BASE_URL = 'https://go2pick.onrender.com'; // Replace with your computer's local IP if testing on a physical device

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/profile', data),
  switchMode: (data) => api.post('/auth/switch-mode', data),
};

export const shopkeeperAPI = {
  submitRequest: (data) => api.post('/shopkeeper/apply', data),
  dashboard: () => api.get('/shopkeeper/dashboard'),
  getSettings: () => api.get('/shopkeeper/settings'),
  updateSettings: (data) => api.put('/shopkeeper/settings', data),
  getReports: (params) => api.get('/shopkeeper/reports', { params }),
};

export const shopAPI = {
  list: (params) => api.get('/shops', { params }),
  get: (id) => api.get(`/shops/${id}`),
};

export const productAPI = {
  list: (params) => api.get('/customer/products', { params }),
  get: (id) => api.get(`/customer/products/${id}`),
  create: (data) => api.post('/shopkeeper/products', data),
  update: (id, data) => api.put(`/shopkeeper/products/${id}`, data),
  delete: (id) => api.delete(`/shopkeeper/products/${id}`),
  bulkAdd: (data) => api.post('/shopkeeper/products/bulk', data),
};

export const categoryAPI = {
  list: () => api.get('/customer/categories'),
};

export const cartAPI = {
  get: () => api.get('/customer/cart'),
  add: (data) => {
    // productId is required by backend AddToCartRequest
    return api.post('/customer/cart/add', {
      productId: data.product_id || data.productId,
      quantity: data.quantity || 1
    });
  },
  remove: (id) => api.delete(`/customer/cart/item/${id}`),
  clear: () => api.delete('/customer/cart'),
};

export const orderAPI = {
  list: (params) => api.get('/customer/orders/my', { params }),
  get: (id) => api.get(`/customer/orders/${id}`),
  place: (data) => {
    // orderType and pickupTime are required by backend CreateOrderRequest
    return api.post('/customer/orders', {
      orderType: data.order_type || data.orderType || 'pickup',
      pickupTime: data.pickup_time || data.pickupTime || 'ASAP',
      deliveryAddress: data.delivery_address || data.deliveryAddress || null
    });
  },
  // For shopkeeper
  listShopOrders: (params) => api.get('/shopkeeper/orders', { params }),
  updateStatus: (id, data) => api.put(`/shopkeeper/orders/${id}/status`, data),
};

export const uploadAPI = {
  uploadImage: async (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    
    formData.append('file', { uri, name: filename, type });
    
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
