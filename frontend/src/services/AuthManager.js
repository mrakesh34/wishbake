import { apiUrl } from './api.js';
import { resolveApiError } from '../utils/ui.js';

export class AuthManager {
  constructor() {
    this.tokenKey = 'wb_auth_token';
    this.userKey = 'wb_auth_user';
    this.listeners = [];
    this.token = localStorage.getItem(this.tokenKey);
    try {
      this.currentUser = JSON.parse(localStorage.getItem(this.userKey) || 'null');
    } catch {
      this.currentUser = null;
    }
    if (this.token) this.fetchMe().catch(() => this.logout());
  }

  isLoggedIn() {
    return Boolean(this.token && this.currentUser);
  }

  getUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(fn => fn({ user: this.currentUser, isLoggedIn: this.isLoggedIn() }));
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(apiUrl(path), { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(resolveApiError(data, 'Request failed. Please try again.'));
    }
    return data;
  }

  async authenticate(mode, credentials) {
    const data = await this.request(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.token = data.token;
    this.currentUser = data.user;
    localStorage.setItem(this.tokenKey, this.token);
    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    this.notify();
    return data;
  }

  requestSignupOtp(credentials) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  resendSignupOtp(email) {
    return this.request('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async verifySignupOtp({ email, otp }) {
    const data = await this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    this.token = data.token;
    this.currentUser = data.user;
    localStorage.setItem(this.tokenKey, this.token);
    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    this.notify();
    return data;
  }

  signup(credentials) {
    return this.requestSignupOtp(credentials);
  }

  login(credentials) {
    return this.authenticate('login', credentials);
  }

  async fetchMe() {
    this.currentUser = await this.request('/api/auth/me');
    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    this.notify();
    return this.currentUser;
  }

  async updateProfile(profile) {
    this.currentUser = await this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    this.notify();
    return this.currentUser;
  }

  fetchCart() {
    return this.request('/api/auth/cart');
  }

  saveCart(items) {
    return this.request('/api/auth/cart', {
      method: 'PUT',
      body: JSON.stringify({ items })
    });
  }

  fetchOrders() {
    return this.request('/api/auth/orders');
  }

  async logout() {
    try {
      if (this.token) await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      /* clear local session */
    }
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.notify();
  }
}

export const authManager = new AuthManager();
