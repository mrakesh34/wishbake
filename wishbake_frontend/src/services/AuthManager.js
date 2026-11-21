import { apiUrl } from './api.js';

/**
 * AuthManager - Central Authentication State Manager for WISHBAKE
 */
export class AuthManager {
  constructor() {
    this.tokenKey = 'wb_auth_token';
    this.userKey = 'wb_auth_user';
    this.listeners = [];
    this.token = localStorage.getItem(this.tokenKey) || null;
    this.currentUser = null;

    try {
      const savedUser = localStorage.getItem(this.userKey);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse cached user', e);
    }

    // If we have a saved token, verify and refresh user profile silently
    if (this.token) {
      this.fetchMe().catch(() => {
        // Token expired or invalid
        this.logout();
      });
    }
  }

  isLoggedIn() {
    return !!(this.token && this.currentUser);
  }

  getUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }

  onAuthChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners() {
    const user = this.currentUser;
    const isAuth = this.isLoggedIn();
    this.listeners.forEach(cb => {
      try {
        cb({ user, isLoggedIn: isAuth });
      } catch (err) {
        console.error('Auth change listener error:', err);
      }
    });
  }

  async sendOtp(email, name = '') {
    const res = await fetch(apiUrl('/api/auth/send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), name: name ? name.trim() : undefined })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to send verification code.');
    }
    return data;
  }

  async verifyOtp(email, otp, name = '') {
    const res = await fetch(apiUrl('/api/auth/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim(),
        name: name ? name.trim() : undefined
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to verify code.');
    }

    this.token = data.token;
    this.currentUser = data.user;

    localStorage.setItem(this.tokenKey, this.token);
    localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));

    this.notifyListeners();
    return data;
  }

  async fetchMe() {
    if (!this.token) return null;

    const res = await fetch(apiUrl('/api/auth/me'), {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!res.ok) {
      this.logout();
      return null;
    }

    const user = await res.json();
    this.currentUser = user;
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  async updateProfile(profileData) {
    if (!this.token) throw new Error('Not authenticated');

    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update profile.');
    }

    this.currentUser = data;
    localStorage.setItem(this.userKey, JSON.stringify(data));
    this.notifyListeners();
    return data;
  }

  async fetchOrders() {
    if (!this.token) return [];

    const res = await fetch(apiUrl('/api/auth/orders'), {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch order history.');
    }

    return await res.json();
  }

  logout() {
    if (this.token) {
      fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).catch(() => {});
    }

    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    this.notifyListeners();
  }
}

// Global Singleton Instance
export const authManager = new AuthManager();
