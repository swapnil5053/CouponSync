// API Configuration and Axios Instance
import axios from 'axios';

// Backend server default is port 5001 to avoid conflicts with macOS services
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  verifyToken: () => api.get('/auth/verify'),
};

// Campaign API
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  updateStatus: (id, status) => api.patch(`/campaigns/${id}/status`, { status }),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getStats: (id) => api.get(`/campaigns/${id}/stats`),
};

// Coupon API
export const couponAPI = {
  getAll: (params) => api.get('/coupons', { params }),
  getById: (id) => api.get(`/coupons/${id}`),
  generate: (data) => api.post('/coupons/generate', data),
  generateQR: (id) => api.post(`/coupons/${id}/qr`),
  assign: (id, userId) => api.post(`/coupons/${id}/assign`, { user_id: userId }),
  expire: () => api.post('/coupons/expire'),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// Redemption API
export const redemptionAPI = {
  redeem: (data) => api.post('/redemptions/redeem', data),
  validate: (code) => api.get(`/redemptions/validate/${code}`),
  getHistory: (params) => api.get('/redemptions/history', { params }),
  getFraudAttempts: (params) => api.get('/redemptions/fraud-attempts', { params }),
};

// Report API
export const reportAPI = {
  getMerchantReports: (params) => api.get('/reports/merchant', { params }),
  getDashboard: () => api.get('/reports/dashboard'),
  exportCSV: (params) => api.get('/reports/export-csv', { params, responseType: 'blob' }),
  getCampaignMetrics: (id) => api.get(`/reports/campaign/${id}/metrics`),
  getSystemStats: () => api.get('/reports/system-stats'),
  getCustomerStats: () => api.get('/reports/customer-stats'),
};

// Distribution API
export const distributionAPI = {
  sendEmail: (data) => api.post('/distribution/email', data),
  sendSMS: (data) => api.post('/distribution/sms', data),
  retry: () => api.post('/distribution/retry'),
  getLogs: (params) => api.get('/distribution/logs', { params }),
  getCampaignStats: (campaignId) => api.get(`/distribution/campaign/${campaignId}/stats`),
};

// User API (Admin)
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

export default api;
