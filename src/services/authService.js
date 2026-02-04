import config from '../config/config';
import sheetService from './sheetService'; // ✅ allowed for DATA ONLY

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
      } catch {
        sessionStorage.clear();
      }
    }
  }

  /* ================= SIGN IN ================= */

  async signIn(accessToken) {
    if (!accessToken) throw new Error('No access token provided');

    try {
      this.token = accessToken;
      sessionStorage.setItem('googleToken', accessToken);

      // 🔹 Fetch Google profile
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!profileRes.ok) throw new Error('Failed to fetch Google profile');

      const profile = await profileRes.json();
      const email = profile.email;

      if (!email) throw new Error('No email found in Google profile');

      /* ======================================================
         🔥 DEV AUTH (WHO CAN LOG IN)
         ====================================================== */

      if (config.useDevAuth === true) {
        const DEV_ALLOWED_EMAILS = [
          'gauravdhikale18@gmail.com',
          'admin@reyanshelectronics.com',
          'test@reyanshelectronics.com'
        ];

        if (!DEV_ALLOWED_EMAILS.includes(email)) {
          throw new Error('Access denied. Not approved for DEV access.');
        }

        // ✅ Create DEV user
        this.currentUser = {
          email,
          name: profile.name || 'Dev User',
          role: 'CEO',
          permissions: 'CRUD',
          imageUrl: profile.picture
        };

        sessionStorage.setItem(
          'currentUser',
          JSON.stringify(this.currentUser)
        );

        /* ======================================================
           ✅ INITIALIZE GOOGLE SHEETS (DATA ONLY)
           ====================================================== */

        try {
          await sheetService.init(accessToken);
        } catch (err) {
          console.warn('Sheet init failed (data may not load):', err);
        }

        return this.currentUser;
      }

      /* ======================================================
         🚫 PROD AUTH (NOT ENABLED YET)
         ====================================================== */
      throw new Error('Production auth is disabled');

    } catch (err) {
      sessionStorage.clear();
      this.currentUser = null;
      this.token = null;
      throw err;
    }
  }

  /* ================= SIGN OUT ================= */

  async signOut() {
    try {
      if (this.token) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${this.token}`,
          { method: 'POST' }
        );
      }
    } catch {}
    finally {
      sessionStorage.clear();
      localStorage.clear();
      this.currentUser = null;
      this.token = null;
    }

    return true;
  }

  /* ================= HELPERS ================= */

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
      return true;
    }
  }
}

export default new AuthService();
