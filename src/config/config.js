// src/config/config.js

const config = {
  /* ===============================
     GOOGLE / SHEETS (DATA ONLY)
     =============================== */
  apiKey: "AIzaSyBeO82LW4iMpj6AijPbNPwN3W0duUwQaaA",
 spreadsheetId: "1xoHK2oFVNhZpMpITr8ZYO5VbE2m9hDm6THTMGprDGKQ",

  /* ===============================
     AUTH MODES
     =============================== */
  // DEV auth = Google OAuth + whitelist
  // Sheets are NOT used for authentication
  useDevAuth: true,

  useLocalStorage: process.env.REACT_APP_USE_LOCAL_STORAGE === "true",

  /* ===============================
     SHEET NAMES
     =============================== */
  sheets: {
    poMaster: "PO_Master",
    soMaster: "SO_Master",
    bomTemplates: "BOM_Templates",
    inventory: "Inventory",
    users: "Users",
    auditLog: "Audit_Log",
    metrics: "Metrics",

    clients: "CLIENT",
    prospectsClients: "PROSPECTS_CLIENTS",

    clientOrders: "Client_Orders",
    clientPayments: "Client_Payments",
    clientQuotations: "Client_Quotations",
    clientNotifications: "Client_Notifications",
    clientMessages: "Client_Messages",

    enquiries: "Enquiries",
    enquiriesExport: "Enquiries_Export",
    enquiriesIndiaMart: "Enquiries_IndiaMart",

    employees: "Employees",
    attendance: "Attendance",
    performance: "Performance",

    stock: "Stock",
    finishedGoods: "Finished Goods",
    billOfMaterials: "Bill of Materials",
    dispatches: "Dispatches"
  },

  /* ===============================
     GOOGLE API ENDPOINTS
     =============================== */
  endpoints: {
    sheets: "https://sheets.googleapis.com/v4/spreadsheets",
    drive: "https://www.googleapis.com/drive/v3"
  },

  /* ===============================
     STATUS CODES
     =============================== */
  statusCodes: {
    NEW: "NEW",
    STORE1: "STORE1",
    CABLE_PRODUCTION: "CABLE_PRODUCTION",
    STORE2: "STORE2",
    MOULDING: "MOULDING",
    FG_SECTION: "FG_SECTION",
    DISPATCH: "DISPATCH",
    DELIVERED: "DELIVERED"
  },

  /* ===============================
     NOTIFICATIONS
     =============================== */
  notifications: {
    sender: "system@reyanshelectronics.com",
    escalationHours: 4
  },

  /* ===============================
     EXTERNAL LINKS
     =============================== */
  externalLinks: {
    whatsapp: process.env.REACT_APP_WHATSAPP_LINK || "https://wa.me/"
  }
};

/* ===============================
   FREEZE CONFIG (IMMUTABLE)
   =============================== */
const frozenConfig = JSON.parse(JSON.stringify(config));
Object.freeze(frozenConfig);
Object.freeze(frozenConfig.sheets);
Object.freeze(frozenConfig.endpoints);
Object.freeze(frozenConfig.statusCodes);
Object.freeze(frozenConfig.notifications);
Object.freeze(frozenConfig.externalLinks);

/* ===============================
   OAUTH ENV HELPERS
   =============================== */
const isVercel = process.env.VERCEL === '1';

export const oauthSettings = {
  localhost: {
    redirectUri: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  vercel: {
    redirectUri: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null,
    allowedOrigins: []
  }
};

export const getCurrentOAuthSettings = () =>
  isVercel ? oauthSettings.vercel : oauthSettings.localhost;

export default frozenConfig;
