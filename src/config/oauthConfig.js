import { getCurrentOAuthSettings } from './config';

// Google OAuth configuration
const oauthConfig = {
  // Allow overriding the client ID via env var (REACT_APP_GOOGLE_CLIENT_ID) so local testing can use any Console client
  clientId: (process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_CLIENT_ID.trim().length > 0) ? process.env.REACT_APP_GOOGLE_CLIENT_ID.trim() : (window.location.hostname.includes('vercel.app') ? "686859527901-rb4nuehhml4b7jmrirpnengul9rehm7a.apps.googleusercontent.com" : "686859527901-om7j9h4st5makfaog0p4tjmrnpcpav06.apps.googleusercontent.com"), // Replace with your Google OAuth client ID
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/spreadsheets", 
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
  ],
  // Configuration for Google Identity Services
  gsiConfig: {
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin'
  },
  // Get the current origin for OAuth redirect
  getRedirectUri: () => {
    // Allow overriding the redirect URI via REACT_APP_GOOGLE_REDIRECT_URI (useful for non-standard dev ports)
    if (process.env.REACT_APP_GOOGLE_REDIRECT_URI && process.env.REACT_APP_GOOGLE_REDIRECT_URI.trim().length > 0) {
      return process.env.REACT_APP_GOOGLE_REDIRECT_URI.trim();
    }

    // If deployed on Vercel, use the Vercel origin
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://reyanshfactoryai.vercel.app';
    }

    // For local development return the current origin (includes port)
    return window.location.origin;
  },
  // Get allowed origins for CORS
  getAllowedOrigins: () => {
    const origins = new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://factoryai-olive.vercel.app',
      'https://reyanshfactoryai.vercel.app'
    ]);
    // Always include runtime origin (useful when running on non-standard dev ports like 3001)
    origins.add(window.location.origin);
    // Include redirect env if provided
    if (process.env.REACT_APP_GOOGLE_REDIRECT_URI && process.env.REACT_APP_GOOGLE_REDIRECT_URI.trim().length > 0) {
      try {
        const u = new URL(process.env.REACT_APP_GOOGLE_REDIRECT_URI.trim());
        origins.add(u.origin);
      } catch (err) {
        console.warn('Invalid REACT_APP_GOOGLE_REDIRECT_URI:', process.env.REACT_APP_GOOGLE_REDIRECT_URI);
      }
    }

    return Array.from(origins);
  }
};

if (typeof window !== 'undefined') {
  console.info('OAuth configuration loaded:', { clientId: oauthConfig.clientId, redirectUri: oauthConfig.getRedirectUri(), allowedOrigins: oauthConfig.getAllowedOrigins() });
}

export default oauthConfig; 