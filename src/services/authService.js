import config from '../config/config';

// 🚨 IMPORTANT:
// We intentionally DO NOT import sheetService in DEV auth mode
// to guarantee Google Sheets is never touched.

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
      // Save token
      this.token = accessToken;
      sessionStorage.setItem('googleToken', accessToken);

      // Fetch Google profile
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

      /* ======================================================
         🔥 DEV AUTH MODE — NO GOOGLE SHEETS, EVER
         ====================================================== */

      if (config.useDevAuth === true) {
        const DEV_ALLOWED_EMAILS = [
          'gauravdhikale18@gmail.com',
          'admin@reyanshelectronics.com',
          'test@reyanshelectronics.com'
        ];

        if (!DEV_ALLOWED_EMAILS.includes(email)) {
          throw new Error('Access denied. This account is not approved for DEV access.');
        }

        this.currentUser = {
          email,
          name: profile.name || 'Dev User',
          role: 'CEO',
          permissions: 'CRUD',
          imageUrl: profile.picture
        };

        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return this.currentUser; // ⛔ EXIT — NOTHING BELOW RUNS
      }

      /* ======================================================
         🚫 PRODUCTION AUTH (INTENTIONALLY DISABLED FOR NOW)
         ====================================================== */

      throw new Error(
        'Production auth is disabled. Enable Sheets-based auth when ready.'
      );

    } catch (err) {
      console.error('Sign-in error:', err);
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
    if (!token || token === 'mock-token') return true;

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
