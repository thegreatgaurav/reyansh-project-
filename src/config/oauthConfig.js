// src/config/oauthConfig.js

const oauthConfig = {
  // REQUIRED: must be provided via environment variable
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,

  scopes: [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
  ],

  // Google Identity Services (popup mode)
  gsiConfig: {
    auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin"
  },

  // POPUP mode → redirect URI is just the site origin
  getRedirectUri: () => {
    return window.location.origin;
  }
};

if (typeof window !== "undefined") {
  console.info("OAuth config loaded", {
    clientId: oauthConfig.clientId,
    redirectUri: oauthConfig.getRedirectUri()
  });
}

export default oauthConfig;
