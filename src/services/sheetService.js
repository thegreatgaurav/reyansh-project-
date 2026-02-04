import axios from "axios";
import config from "../config/config";

class SheetService {
  constructor() {
    this.spreadsheetId = config.spreadsheetId;
    this.baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
    this.accessToken = null;

    // Simple in-memory cache
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /* ==============================
     CORE INITIALIZATION
     ============================== */

  async init() {
    if (this.accessToken) return true;

    const token = sessionStorage.getItem("googleToken");
    if (token) {
      this.accessToken = token;
      return true;
    }

    if (config.useLocalStorage) {
      return true; // DEV mode fallback
    }

    throw new Error("No Google OAuth token found. User not authenticated.");
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  /* ==============================
     CACHE HELPERS
     ============================== */

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.time > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, time: Date.now() });
  }

  clearCache(sheetName) {
    if (!sheetName) this.cache.clear();
    else this.cache.delete(sheetName);
  }

  /* ==============================
     READ SHEET
     ============================== */

  async getSheetData(sheetName, forceRefresh = false) {
    if (!sheetName) throw new Error("Sheet name required");

    if (config.useLocalStorage) return [];

    if (!forceRefresh) {
      const cached = this.getCache(sheetName);
      if (cached) return cached;
    }

    await this.init();

    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}`;

    const res = await axios.get(url, {
      headers: this.getAuthHeaders(),
    });

    const values = res.data?.values || [];
    if (values.length === 0) return [];

    const headers = values[0];
    const rows = values.slice(1);

    const parsed = rows.map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });

    this.setCache(sheetName, parsed);
    return parsed;
  }

  /* ==============================
     GET HEADERS
     ============================== */

  async getSheetHeaders(sheetName) {
    await this.init();

    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!1:1`;

    const res = await axios.get(url, {
      headers: this.getAuthHeaders(),
    });

    if (!res.data?.values?.[0]) {
      throw new Error(`No headers found for sheet ${sheetName}`);
    }

    return res.data.values[0];
  }

  /* ==============================
     APPEND ROW
     ============================== */

  async appendRow(sheetName, rowData) {
    if (config.useLocalStorage) return true;

    await this.init();
    const headers = await this.getSheetHeaders(sheetName);

    const values = headers.map((h) =>
      rowData[h] !== undefined ? String(rowData[h]) : ""
    );

    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}:append?valueInputOption=USER_ENTERED`;

    const res = await axios.post(
      url,
      { values: [values] },
      { headers: this.getAuthHeaders() }
    );

    this.clearCache(sheetName);
    return res.data;
  }

  /* ==============================
     UPDATE ROW
     ============================== */

  async updateRow(sheetName, rowIndex, rowData) {
    if (config.useLocalStorage) return true;

    await this.init();
    const headers = await this.getSheetHeaders(sheetName);

    const values = headers.map((h) =>
      rowData[h] !== undefined ? String(rowData[h]) : ""
    );

    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!A${rowIndex}?valueInputOption=USER_ENTERED`;

    const res = await axios.put(
      url,
      { values: [values] },
      { headers: this.getAuthHeaders() }
    );

    this.clearCache(sheetName);
    return res.data;
  }

  /* ==============================
     DELETE ROW
     ============================== */

  async deleteRow(sheetName, rowIndex) {
    if (config.useLocalStorage) return true;

    await this.init();

    const sheetMeta = await axios.get(
      `${this.baseUrl}/${this.spreadsheetId}`,
      { headers: this.getAuthHeaders() }
    );

    const sheet = sheetMeta.data.sheets.find(
      (s) => s.properties.title === sheetName
    );

    if (!sheet) throw new Error("Sheet not found");

    const sheetId = sheet.properties.sheetId;

    const res = await axios.post(
      `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
      { headers: this.getAuthHeaders() }
    );

    this.clearCache(sheetName);
    return res.data;
  }
}

export default new SheetService();
