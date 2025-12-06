/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';
import { API_URL, STORAGE_KEYS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Auth API
 */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
  deleteAccount: (data) => api.delete('/auth/account', { data })
};

/**
 * Posts API
 */
export const postsAPI = {
  create: (data) => api.post('/posts', data),
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
  getUserPosts: (userId, params) => api.get(`/posts/user/${userId}`, { params })
};

/**
 * Comments API
 */
export const commentsAPI = {
  create: (data) => api.post('/comments', data),
  getPostComments: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  getReplies: (commentId, params) => api.get(`/comments/${commentId}/replies`, { params }),
  getOne: (id) => api.get(`/comments/${id}`),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  like: (id) => api.post(`/comments/${id}/like`),
  unlike: (id) => api.delete(`/comments/${id}/like`)
};

/**
 * Messages API
 */
export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getConversations: (params) => api.get('/messages/conversations', { params }),
  getConversationMessages: (conversationId, params) => 
    api.get(`/messages/conversations/${conversationId}`, { params }),
  getOrCreateConversation: (userId) => api.post(`/messages/conversations/${userId}`),
  markAsRead: (conversationId) => api.put(`/messages/conversations/${conversationId}/read`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  deleteConversation: (conversationId) => api.delete(`/messages/conversations/${conversationId}`),
  getUnreadCount: () => api.get('/messages/unread/count')
};

/**
 * Notifications API
 */
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getOne: (id) => api.get(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications/all')
};

/**
 * Users API
 */
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getStats: (id) => api.get(`/users/${id}/stats`),
  getPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
  getMyProfile: () => api.get('/users/me'),
  regenerateIdentity: (data) => api.post('/users/regenerate-identity', data),
  updateOnlineStatus: (data) => api.put('/users/online-status', data),
  search: (params) => api.get('/users/search', { params }),
  getLeaderboard: (params) => api.get('/users/leaderboard', { params })
};

/**
 * Clans API
 */
export const clansAPI = {
  getAll: () => api.get('/clans'),
  getLeaderboard: (params) => api.get('/clans/leaderboard', { params }),
  getOne: (name) => api.get(`/clans/${name}`),
  getMembers: (name, params) => api.get(`/clans/${name}/members`, { params }),
  getStats: (name) => api.get(`/clans/${name}/stats`),
  getWeeklyRankings: () => api.get('/clans/rankings/weekly'),
  getMyClan: () => api.get('/clans/me')
};

/**
 * Search API
 */
export const searchAPI = {
  searchAll: (params) => api.get('/search', { params }),
  searchPosts: (params) => api.get('/search/posts', { params }),
  searchUsers: (params) => api.get('/search/users', { params }),
  getTrending: (params) => api.get('/search/trending', { params }),
  searchHashtags: (params) => api.get('/search/hashtags', { params }),
  getHashtagPosts: (hashtag, params) => api.get(`/search/hashtag/${hashtag}`, { params }),
  getSuggestions: (params) => api.get('/search/suggestions', { params })
};

export default api;