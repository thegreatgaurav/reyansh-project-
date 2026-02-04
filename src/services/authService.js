import sheetService from './sheetService';
import config from '../config/config';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;

    const storedUser = sessionStorage.getItem('currentUser');
    const storedToken = sessionStorage.getItem('googleToken');

    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken || null;
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        sessionStorage.clear();
      }
    }
  }

  /* ---------------- SIGN IN ---------------- */

  async signIn(accessToken) {
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    try {
      this.token = accessToken;
      sessionStorage.setItem('googleToken', accessToken);

      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (profileRes.status === 401) {
        throw new Error('Access token expired. Please sign in again.');
      }

      if (!profileRes.ok) {
        throw new Error('Failed to fetch Google profile');
      }

      const profile = await profileRes.json();
      const email = profile.email;

      if (!email) {
        throw new Error('No email found in Google profile');
      }

      if (!email.endsWith('@reyanshelectronics.com') && !config.useLocalStorage) {
        throw new Error('Only @reyanshelectronics.com users are allowed');
      }

      try {
        await sheetService.init(accessToken);
      } catch (err) {
        console.warn('Sheet service init failed:', err);
      }

      // Local / dev mode
      if (config.useLocalStorage) {
        this.currentUser = {
          email,
          name: profile.name,
          role: 'Customer Relations Manager',
          permissions: 'CRUD',
          imageUrl: profile.picture
        };
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
      }

      // Production user lookup
      const users = await sheetService.getSheetData(config.sheets.users);
      const user = users.find(u => u.Email === email);

      if (!user) {
        throw new Error('User not found. Contact administrator.');
      }

      this.currentUser = {
        email,
        name: profile.name || user.Name || 'User',
        role: user.Role || 'User',
        permissions: user.Permissions || 'READ',
        imageUrl: profile.picture
      };

      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return this.currentUser;

    } catch (err) {
      sessionStorage.clear();
      this.currentUser = null;
      this.token = null;
      throw err;
    }
  }

  /* ---------------- SIGN OUT ---------------- */

  async signOut() {
    try {
      if (this.token) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${this.token}`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
      }
    } catch (err) {
      console.warn('Token revoke failed:', err);
    } finally {
      sessionStorage.clear();
      localStorage.clear();
      this.currentUser = null;
      this.token = null;
    }

    return true;
  }

  /* ---------------- HELPERS ---------------- */

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token || sessionStorage.getItem('googleToken');
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  async validateToken() {
    const token = this.getToken();
    if (!token || token === 'mock-token' || config.useLocalStorage) return true;

    try {
      const res = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        sessionStorage.clear();
        this.currentUser = null;
        this.token = null;
        return false;
      }

      return res.ok;
    } catch {
      return true; // network-safe
    }
  }

  mockLogin(role) {
    const user = {
      email: `mock.${role.toLowerCase()}@reyanshelectronics.com`,
      name: `Mock ${role}`,
      role,
      permissions: 'CRUD',
      imageUrl: ''
    };

    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('googleToken', 'mock-token');

    return user;
  }

  directLogin(email, role = 'CEO') {
    const user = {
      email,
      name: role,
      role,
      permissions: 'CRUD',
      imageUrl: ''
    };

    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('googleToken', 'mock-token');

    return user;
  }
}

export default new AuthService();
