/* global gapi, google */
import axios from "axios";
import config from "../config/config";
import oauthConfig from "../config/oauthConfig";
import { ProductionQuantityLimits } from "@mui/icons-material";

class SheetService {
  constructor() {
    this.apiKey = config.apiKey;
    this.spreadsheetId = config.spreadsheetId;
    this.baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
    this.clientId = oauthConfig.clientId;
    this.scopes = oauthConfig.scopes;
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    
    // Performance optimization: Cache headers and data
    this.headersCache = new Map();
    this.dataCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Initialize Google API client only if DOM is ready
    if (typeof window !== 'undefined' && document.readyState === 'complete') {
      this.initializeGoogleApi();
    } else if (typeof window !== 'undefined') {
      // Wait for DOM to be ready
      window.addEventListener('load', () => {
        this.initializeGoogleApi();
      });
    }
  }

  // Cache management methods
  clearCache(sheetName = null) {
    if (sheetName) {
      this.headersCache.delete(`headers_${sheetName}`);
      this.dataCache.delete(`data_${sheetName}`);

    } else {
      this.headersCache.clear();
      this.dataCache.clear();

    }
  }

  invalidateCache(sheetName) {
    this.clearCache(sheetName);
  }

  // Update cache with new row instead of invalidating
  updateCacheWithNewRow(sheetName, newRowData) {
    const cacheKey = `data_${sheetName}`;
    const cached = this.dataCache.get(cacheKey);
    if (cached) {
      // The newRowData is already in the correct sheet format (ClientName, ClientCode, etc.)
      // Just add it directly to the cached data
      cached.data.push(newRowData);
      cached.timestamp = Date.now();
      this.dataCache.set(cacheKey, cached);

    } else {
      // If no cache, just invalidate
      this.invalidateCache(sheetName);
    }
  }

  // Update cache with modified row instead of invalidating
  updateCacheWithModifiedRow(sheetName, rowIndex, modifiedRowData) {
    const cacheKey = `data_${sheetName}`;
    const cached = this.dataCache.get(cacheKey);
    if (cached && cached.data[rowIndex - 2]) { // rowIndex is 1-based, cache is 0-based
      // Update the specific row in cached data
      cached.data[rowIndex - 2] = modifiedRowData;
      cached.timestamp = Date.now();
      this.dataCache.set(cacheKey, cached);

    } else {
      // If no cache or row not found, just invalidate
      this.invalidateCache(sheetName);
    }
  }

  // Remove row from cache instead of invalidating
  removeRowFromCache(sheetName, rowIndex) {
    const cacheKey = `data_${sheetName}`;
    const cached = this.dataCache.get(cacheKey);
    if (cached && cached.data[rowIndex - 2]) { // rowIndex is 1-based, cache is 0-based
      // Remove the specific row from cached data
      cached.data.splice(rowIndex - 2, 1);
      cached.timestamp = Date.now();
      this.dataCache.set(cacheKey, cached);

    } else {
      // If no cache or row not found, just invalidate
      this.invalidateCache(sheetName);
    }
  }

  // Batch update method for better performance
  async batchUpdate(sheetName, updates) {
    try {
      await this.init();

      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error("OAuth access token required for this operation");
      }

      const sheetHeaders = await this.getSheetHeaders(sheetName);
      const batchData = updates.map(update => {
        const values = sheetHeaders.map(header => {
          const value = update.data[header];
          
          // Handle arrays by converting them to JSON strings
          if (Array.isArray(value)) {
            return JSON.stringify(value);
          }
          
          // Handle objects by converting them to JSON strings
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          
          // Handle null/undefined values
          if (value === null || value === undefined) {
            return '';
          }
          
          // Convert to string to ensure compatibility
          return String(value);
        });
        return {
          range: `${sheetName}!A${update.rowIndex}`,
          values: [values]
        };
      });

      const requestBody = {
        valueInputOption: 'USER_ENTERED',
        data: batchData
      };

      const reqHeaders = {};
      if (this.accessToken) {
        reqHeaders.Authorization = `Bearer ${this.accessToken}`;
      }

      const url = `${this.baseUrl}/${this.spreadsheetId}/values:batchUpdate`;
      if (!this.accessToken) {
        url += `?key=${this.apiKey}`;
      }

      const response = await axios.post(url, requestBody, { headers: reqHeaders });
      
      // Invalidate cache for batch operations (too complex to update incrementally)
      this.invalidateCache(sheetName);
      
      return response.data;
    } catch (error) {
      console.error(`Error batch updating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Initialize Google API client
  async initializeGoogleApi() {
    try {
      // Check if scripts are already loaded
      if (typeof gapi !== 'undefined' && gapi.client) {
        this.gapiInited = true;
      } else {
        // Load the Google API client
        await new Promise((resolve, reject) => {
          // Check if script already exists
          const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
          if (existingScript) {
            if (typeof gapi !== 'undefined') {
              resolve();
            } else {
              existingScript.onload = resolve;
              existingScript.onerror = reject;
            }
          } else {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Google API script'));
            document.body.appendChild(script);
          }
        });

        // Initialize the Google API client
        await new Promise((resolve, reject) => {
          if (typeof gapi === 'undefined') {
            reject(new Error('gapi is not defined'));
            return;
          }
          
          gapi.load('client', async () => {
            try {
              await gapi.client.init({
                apiKey: this.apiKey,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
              });
              this.gapiInited = true;
              resolve();
            } catch (error) {
              console.error('Error initializing gapi client:', error);
              reject(error);
            }
          });
        });
      }

      // Initialize Google Identity Services
      if (typeof google !== 'undefined' && google.accounts) {
        this.gisInited = true;
      } else {
        await new Promise((resolve, reject) => {
          // Check if script already exists
          const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
          if (existingScript) {
            if (typeof google !== 'undefined' && google.accounts) {
              this.gisInited = true;
              resolve();
            } else {
              existingScript.onload = () => {
                this.gisInited = true;
                resolve();
              };
              existingScript.onerror = reject;
            }
          } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
              this.gisInited = true;
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
            document.body.appendChild(script);
          }
        });
      }

      // Initialize Google Identity Services token client
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.scopes.join(' '),
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              this.accessToken = tokenResponse.access_token;
              sessionStorage.setItem('googleToken', tokenResponse.access_token);
            }
          },
        });
      }
    } catch (error) {
      console.error('Error initializing Google API:', error);
      // Don't throw - allow the app to continue with localStorage fallback
      this.gapiInited = false;
      this.gisInited = false;
    }
  }

  // Initialize the Google API client
  async init() {
    try {
      // Check if we already have a token
      if (this.accessToken) {
        return true;
      }

      // Try to get token from session storage
      const storedToken = sessionStorage.getItem("googleToken");
      if (storedToken) {
        this.accessToken = storedToken;
        return true;
      }

      // If we're using localStorage for documents, we can initialize without token
      if (config.useLocalStorage) {
        return true;
      }

      // Wait for Google API to initialize
      if (!this.gapiInited || !this.gisInited) {
        await this.initializeGoogleApi();
      }

      // Check if google is available
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        console.warn('Google Identity Services not available. Using stored token if available.');
        // If we have a stored token, we can still proceed
        if (storedToken) {
          return true;
        }
        return false;
      }

      // Request new token
      return new Promise((resolve, reject) => {
        try {
          // Create a new token client for each request
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scopes.join(' '),
            callback: (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                this.accessToken = tokenResponse.access_token;
                sessionStorage.setItem('googleToken', tokenResponse.access_token);
                resolve(true);
              } else {
                console.error('Token response:', tokenResponse);
                reject(new Error('Failed to get access token'));
              }
            },
            error_callback: (error) => {
              // Handle popup closure gracefully - this is a user action, not a critical error
              if (error && (error.type === 'popup_closed' || error.message?.includes('Popup window closed') || error.message?.includes('popup_closed'))) {
                console.log('OAuth popup was closed by user');
                // Resolve with false instead of rejecting to prevent uncaught errors
                resolve(false);
              } else {
                console.error('Google OAuth error:', error);
                // For other errors, still reject but with a more user-friendly message
                const errorMessage = error?.message || error?.type || 'Unknown error';
                reject(new Error('Google OAuth error: ' + errorMessage));
              }
            }
          });

          // Request the token with explicit prompt
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
          console.error("Error requesting access token:", error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("Error initializing Google API client:", error);
      return false;
    }
  }

  // Read data from a specific sheet (with caching)
  async getSheetData(sheetName, forceRefresh = false) {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = `data_${sheetName}`;
        const cached = this.dataCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {

          return cached.data;
        }
      }

      // If using localStorage, return empty array
      if (config.useLocalStorage) {
        return [];
      }

      const initialized = await this.init();
      if (!initialized) {
        // If we have a stored token, try to use it anyway
        const storedToken = sessionStorage.getItem("googleToken");
        if (storedToken) {
          this.accessToken = storedToken;
        } else {
          throw new Error('Failed to initialize Google API client. Please sign in again.');
        }
      }

      if (!sheetName) {
        throw new Error('Sheet name is required');
      }

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error('OAuth access token required for this operation');
      }

      // Make direct API call with OAuth token
      const reqHeaders = {
        Authorization: `Bearer ${this.accessToken}`
      };

      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}`;

      const response = await axios.get(url, { 
        headers: reqHeaders,
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });

      if (response.status === 401) {
        // Clear the stored token and try to re-authenticate
        sessionStorage.removeItem("googleToken");
        this.accessToken = null;
        throw new Error('Authentication failed. Please try again.');
      }

      if (response.status === 400) {
        console.error('Bad Request - Response:', response.data);
        throw new Error(`Bad Request: ${response.data?.error?.message || 'Invalid request'}`);
      }

      if (response.data && response.data.values) {
        const parsedData = this.parseSheetData(response.data.values);
        // Cache the data
        const cacheKey = `data_${sheetName}`;
        this.dataCache.set(cacheKey, {
          data: parsedData,
          timestamp: Date.now()
        });
        return parsedData;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Error getting data from sheet ${sheetName}:`, error);
      if (error.response && error.response.status === 404) {
        throw new Error(`Sheet ${sheetName} does not exist. Please create it using the Sheet Initializer in the UI.`);
      }
      throw error;
    }
  }

  // Parse the raw sheet data into a more usable format
  parseSheetData(values) {
    if (!values || values.length === 0) {
      return [];
    }

    const headers = values[0];
    const rows = values.slice(1);

    return rows.map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || "";
      });
      return item;
    });
  }

  // Append data to a sheet
  async appendRow(sheetName, rowData) {
    try {
      await this.init();

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error("OAuth access token required for this operation");
      }
      
      // Get the headers for the sheet
      const sheetHeaders = await this.getSheetHeaders(sheetName);

      if (!sheetHeaders || sheetHeaders.length === 0) {
        throw new Error(`No headers available for sheet ${sheetName}`);
      }

      // Format the row data according to the headers
      const values = sheetHeaders.map(header => {
        const value = rowData[header];

        // Handle arrays by converting them to JSON strings
        if (Array.isArray(value)) {
          const jsonString = JSON.stringify(value);

          return jsonString;
        }
        
        // Handle objects by converting them to JSON strings (but not if already a JSON string)
        if (typeof value === 'object' && value !== null) {
          const jsonString = JSON.stringify(value);

          return jsonString;
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert to string to ensure compatibility
        return String(value);
      });

      // Make direct API call with OAuth token
      const reqHeaders = {};
      if (this.accessToken) {
        reqHeaders.Authorization = `Bearer ${this.accessToken}`;

      } else {

      }

      // Encode sheet name to handle special characters
      const encodedSheetName = encodeURIComponent(sheetName);
      let url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodedSheetName}:append?valueInputOption=USER_ENTERED`;
      if (!this.accessToken) {
        url += `&key=${this.apiKey}`;
      }
      
      const requestBody = { values: [values] };

      const response = await axios.post(
        url,
        requestBody,
        { headers: reqHeaders }
      );

      // Update cache with new row instead of invalidating
      this.updateCacheWithNewRow(sheetName, rowData);
      
      return response.data;
    } catch (error) {
      console.error(`Error appending row to sheet ${sheetName}:`, error);
      if (error.response) {
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        console.error('Full error response:', error.response);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  // Get the headers of a sheet (with caching)
  async getSheetHeaders(sheetName) {
    try {
      // Check cache first
      const cacheKey = `headers_${sheetName}`;
      const cached = this.headersCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {

        return cached.data;
      }

      await this.init();

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error("OAuth access token required for this operation");
      }

      try {
        const reqHeaders = {};
        if (this.accessToken) {
          reqHeaders.Authorization = `Bearer ${this.accessToken}`;
        }

        let url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!1:1`;
        if (!this.accessToken) {
          url += `?key=${this.apiKey}`;
        }

        const response = await axios.get(url, { headers: reqHeaders });

        if (
          response.data &&
          response.data.values &&
          response.data.values.length > 0
        ) {
          const headers = response.data.values[0];
          // Cache the headers
          this.headersCache.set(cacheKey, {
            data: headers,
            timestamp: Date.now()
          });
          return headers;
        }

        // If we have no headers, initialize with default headers
        console.warn(
          `No headers found for sheet ${sheetName}, using default headers`
        );

        // Define default headers for each sheet type
        const defaultHeaders = {
          [config.sheets.poMaster]: [
            "POId",
            "Name",
            "ClientCode",
            "OrderType",
            "ProductCode",
            "Description",
            "Quantity",
            "BatchSize",
            "Status",
            "CreatedBy",
            "CreatedAt",
            "UpdatedAt",
            "AssignedTo",
            "DueDate",
            "PODocumentId",
          ],
          [config.sheets.bomTemplates]: [
            "TemplateId",
            "ProductCode",
            "BOMType",
            "Description",
            "Materials",
            "CreatedAt",
          ],
          [config.sheets.inventory]: [
            "MaterialId",
            "Name",
            "Category",
            "UnitOfMeasure",
            "QuantityAvailable",
            "ReorderLevel",
            "LastUpdated",
          ],
          [config.sheets.users]: [
            "UserId",
            "Name",
            "Email",
            "Role",
            "Department",
            "LastLogin",
          ],
          [config.sheets.auditLog]: [
            "LogId",
            "POId",
            "PreviousStatus",
            "NewStatus",
            "UserId",
            "Timestamp",
          ],
          [config.sheets.metrics]: [
            "MetricId",
            "MetricName",
            "MetricValue",
            "DateRecorded",
            "Category",
          ],
          // Dispatches sheet headers (trimmed to match current sheet layout)
          Dispatches: [
            "DispatchUniqueId",
            "UniqueId",
            "ClientCode",
            "ProductCode",
            "ProductName",
            "BatchNumber",
            "BatchSize",
            "updatedBatch",
            "DispatchDate",
            "DateEntry",
            "CreatedAt",
            "Dispatched",
            "store1Status",
            "cableProdStatus",
            "store2Status",
            "mouldingProdStatus",
            "fgSectionStatus",
            "dispatchStatus",
            "deliveryStatus",
            "receivingDocuments",
            "BatchCompleted",
            "LastModified"
          ],
          // Add CLIENT sheet headers
          CLIENT: [
            "ClientCode",
            "ClientName",
            "Address",
            "Contacts",
            "Products",
            "CreatedAt",
            "UpdatedAt"
          ],
          // Add CLIENTS sheet headers (new naming)
          [config.sheets.clients]: [
            "ClientCode",
            "ClientName",
            "Address",
            "Contacts",
            "Products",
            "CreatedAt",
            "UpdatedAt"
          ],
          // Add PRODUCT sheet headers
          PRODUCT: [
            "ProductCode",
            "ProductName",
            "Description",
            "AssemblyLineManpower",
            "CableCuttingManpower",
            "MoldingMachineManpower",
            "PackingLineManpower",
            "SingleShiftTarget",
            "BasePrice",
            "Drawing",
            "FPA",
            "PDI",
          ],
          // Add Power Cord Master sheet headers
          "Power Cord Master": [
            "Product Code",
            "Product Name",
            "Pin Type",
            "Amperage",
            "Cable Type",
            "Standard Length",
            "Plug Type",
            "Molding Require Assembly Steps",
            "Terminal Specs",
            "Applications",
            "Safety Standard: Is Active",
            "Last Updated"
          ],
          // Add Purchase Flow sheet definition
          [config.sheets.purchaseFlow]: [
            "FlowId",              // Unique identifier for the purchase flow
            "IndentNumber",        // Reference number for the indent
            "ItemName",           // Name of the item being purchased
            "Quantity",           // Quantity required
            "Specifications",     // Technical specifications
            "CurrentStep",        // Current step in the workflow (1-21)
            "Status",            // Overall status (In Progress, Completed, Rejected)
            "CreatedBy",         // User who initiated the flow
            "CreatedAt",         // Flow creation timestamp
            "UpdatedAt",         // Last update timestamp
            "ExpectedDelivery",  // Expected delivery date
            "Priority",          // Priority level (High, Medium, Low)
            "Department",        // Department requesting the purchase
            "Budget",            // Budget allocation
            "VendorDetails",     // JSON string of vendor information
            "Documents",         // JSON string of document references
            "Comments",          // JSON string of comments/notes
            "TATBreaches",       // JSON string of TAT breach records
            "ApprovalChain",     // JSON string of approval history
            "FinalAmount",       // Final purchase amount
            "PaymentStatus",     // Payment status
            "LastModifiedBy",    // User who last modified the flow
            "Steps"              // <-- Added Steps field for workflow array
          ],
          // Client Dashboard sheets
          [config.sheets.clientOrders]: [
            'orderNumber',
            'clientCode',
            'clientName',
            'contactPerson',
            'contactEmail',
            'contactPhone',
            'orderDate',
            'requiredDeliveryDate',
            'priority',
            'orderType',
            'paymentTerms',
            'specialInstructions',
            'status',
            'items',
            'totalAmount',
            'taxAmount',
            'finalAmount',
            'assignedTo',
            'createdBy',
            'createdAt',
            'updatedAt'
          ],
          [config.sheets.clientPayments]: [
            'Id',
            'ClientCode',
            'OrderId',
            'Amount',
            'PaymentDate',
            'Method',
            'Status',
            'TransactionId'
          ],
          [config.sheets.clientQuotations]: [
            'Id',
            'ClientCode',
            'QuotationNumber',
            'IssueDate',
            'Status',
            'TotalAmount',
            'ValidUntil'
          ],
          [config.sheets.clientNotifications]: [
            'Id',
            'ClientCode',
            'Type',
            'Message',
            'Timestamp',
            'Read'
          ],
          [config.sheets.clientMessages]: [
            'Id',
            'ClientCode',
            'Channel',
            'Subject',
            'Body',
            'Timestamp',
            'From',
            'To',
            'Read'
          ],
          // Add Purchase Flow Steps sheet definition
          [config.sheets.purchaseFlowSteps]: [
            "StepId",           // Step identifier (1-21)
            "FlowId",           // Reference to the main flow
            "IndentNumber",     // Reference number for the indent (added)
            "StepNumber",       // Step number in sequence
            "Role",            // Role responsible for this step
            "Action",          // Action to be performed
            "ItemName",        // Name of the item being purchased
            "Quantity", // (if any)
            "Specifications",  // Technical specifications
            "Status",          // Step status (Pending, In Progress, Completed, Rejected)
            "AssignedTo",      // User assigned to this step
            "StartTime",       // When the step was started
            "EndTime",         // When the step was completed
            "TAT",            // Turn Around Time in days
            "TATStatus",      // TAT status (On Time, Breached)
            "Documents",      // JSON string of documents attached
            "Comments",       // JSON string of comments
            "ApprovalStatus", // Approval status for this step
            "RejectionReason", // Reason if rejected
            "NextStep",       // Next step in sequence
            "PreviousStep",   // Previous step in sequence
            "Dependencies",   // JSON string of step dependencies
            "LastModifiedBy", // User who last modified the step
            "LastModifiedAt", // Last modification timestamp
            "Note"
          ],
          Vendor: [
            'SKU Code',
            'SKU Description',
            'Category',
            'UOM',
            'Vendor Name',
            'Alternate Vendors',
            'Vendor Code',
            'Vendor Contact',
            'Vendor Email',
            'Address',
            'State',
            'State Code',
            'A/C Code',
            'GSTIN',
            'PAN No.',
            'MOQ',
            'Lead Time (Days)',
            'Last Purchase Rate (₹)',
            'Rate Validity',
            'Payment Terms',
            'Remarks',
          ],
          ComparativeStatement: [
            "IndentNumber",
            "Data",
            "CreatedBy",
            "CreatedAt"
          ],
          SheetApproveQuotation: [
            "IndentNumber",
            "ApprovedQuotation",
            "ApprovedBy",
            "ApprovedAt",
            "SampleRequired"
          ],
          RequestSample: [
            "IndentNumber",
            "SampleData",
            "CreatedBy",
            "CreatedAt",
            "LastModifiedBy",
            "LastModifiedAt"
          ],
          [config.sheets.placePO]: [
            "POId",
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "VendorCode",
            "Price",
            "DeliveryTime",
            "Terms",
            "LeadTime",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "PlacedAt",
            "PODocumentId"
          ],
          [config.sheets.materialApproval]: [
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "Price",
            "VendorCode",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "DCDocumentId",
            "InvoiceDocumentId",
            "PODocumentId",
            "Status",
            "ApprovalDate",
            "ApprovedBy",
            "RejectionNote",
          ],
          [config.sheets.followUpQuotations]: [
            "IndentNumber",
            "Vendor",
            "QuotationDocument",
            "CreatedBy",
            "CreatedAt",
          ],
          [config.sheets.inspectMaterial]: [
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "Price",
            "VendorCode",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "DCDocumentId",
            "InvoiceDocumentId",
            "PODocumentId",
            "InspectionDate",
            "InspectedBy",
            "Status",
            "Note",
          ],
          [config.sheets.generateGrn]: [
            "GRNId",
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "Price",
            "VendorCode",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "DCDocumentId",
            "InvoiceDocumentId",
            "PODocumentId",
            "InspectionDate",
            "InspectedBy",
            "GRNDate",
            "GeneratedBy",
            "GRNDocumentId",
            "Status",
          ],
          [config.sheets.schedulePayment]: [
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "Price",
            "VendorCode",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "DCDocumentId",
            "InvoiceDocumentId",
            "PODocumentId",
            "GRNId",
            "GRNDate",
            "PaymentDate",
            "ScheduledBy",
            "ScheduledAt",
            "Status",
          ],
          [config.sheets.releasePayment]: [
            "IndentNumber",
            "ItemName",
            "Specifications",
            "Quantity",
            "Price",
            "VendorCode",
            "VendorName",
            "VendorContact",
            "VendorEmail",
            "DCDocumentId",
            "InvoiceDocumentId",
            "PODocumentId",
            "GRNId",
            "GRNDate",
            "ScheduledPaymentDate",
            "ScheduledBy",
            "ScheduledAt",
            "PaymentMethod",
            "TransactionId",
            "PaymentAmount",
            "PaymentNotes",
            "PaymentDate",
            "ReleasedBy",
            "ReleasedAt",
            "Status",
          ],
          // Add InspectSample sheet headers
          InspectSample: [
            "IndentNumber",
            "VendorCode",
            "ItemCode",
            "Note",
            "Status", // Approved/Rejected
            "Action",
            "InspectedBy",
            "InspectedAt",
            "RejectionReason",
          ],
          // Add ReturnMaterial sheet headers
          [config.sheets.returnMaterial]: [
            "POId",
            "Details",
            "CreatedBy",
            "CreatedAt"
          ],
          // Add Costing sheet headers
          Costing: [
            "Costing ID",
            "Date",
            "Specifications",
            "Cu Strands",
            "Gauge",
            "Inner OD",
            "Bunch",
            "Copper Weight (Kgs/100 mtr)",
            "PVC Weight (Kgs/100 mtr)",
            "No. Of Cores",
            "Round OD",
            "Flat B",
            "Flat W",
            "Laying",
            "Final Copper (Kgs/100 mtr)",
            "Final PVC Round (Kgs/100 mtr)",
            "Final PVC Flat (Kgs/100 mtr)",
            "Copper Rate",
            "PVC Rate",
            "RMC",
            "Labour on Wire",
            "Bundle Cost",
            "Bundle Weight",
            "Cost Of Wire/Mtr",
            "Length Required",
            "Wire Cost",
            "Type (Wire/Plug)",
            "Plug Cost",
            "Terminal/Acc. Cost",
            "Cord Cost",
            "Enquiry By",
            "Company",
            "Remarks",
            "Unique"
          ],
          // Add Company Kitting Issues sheet headers
          "Company Material Issues": [
            "uniqueKittingId",
            "bomId", 
            "itemIssueDetails"
          ],
          // Add Sales Flow sheet headers
          [config.sheets.salesFlow]: [
            "LogId",              // Unique identifier for the sales flow (EN + 4 random digits)
            "FullName",           // Lead's name
            "CompanyName",        // Where they work
            "Email",              // For follow-up
            "PhoneNumber",        // Contact number
            "ProductsInterested", // Products interested in
            "LeadSource",         // Source of lead
            "Priority",           // Priority level
            "QualificationStatus", // Qualification status
            "Notes",              // Free-form notes
            "CurrentStep",        // Current step in the workflow (1-15)
            "Status",            // Overall status (New, In Progress, Completed, Rejected)
            "CreatedBy",         // User who initiated the flow
            "CreatedAt",         // Flow creation timestamp
            "UpdatedAt",         // Last update timestamp
            "ExpectedDelivery",  // Expected delivery date
            "AssignedTo",        // Currently assigned to
            "TAT",              // Turn Around Time in days
            "TATStatus",        // TAT status (On Time, Breached)
            "Documents",        // JSON string of document references
            "Comments",         // JSON string of comments/notes
            "LastModifiedBy",   // User who last modified the flow
            "NextStep",         // Next step in sequence
            "PreviousStep",     // Previous step in sequence
            "StepId"            // Current step ID
          ],
          // Add Sales Flow Steps sheet headers
          [config.sheets.salesFlowSteps]: [
            "StepId",           // Step identifier (1-15)
            "LogId",            // Reference to the main flow
            "StepNumber",       // Step number in sequence
            "Role",            // Role responsible for this step (Customer Relations Manager, Sales Executive, NPD, Quality Engineer, Director, Production Manager, Store Manager, Accounts Executive)
            "Action",          // Action to be performed
            "Status",          // Step status (Pending, In Progress, Completed, Rejected)
            "AssignedTo",      // User assigned to this step
            "StartTime",       // When the step was started
            "EndTime",         // When the step was completed
            "TAT",            // Turn Around Time in days
            "TATStatus",      // TAT status (On Time, Breached)
            "Documents",      // JSON string of documents attached
            "Comments",       // JSON string of comments
            "ApprovalStatus", // Approval status for this step
            "RejectionReason", // Reason if rejected
            "NextStep",       // Next step in sequence
            "PreviousStep",   // Previous step in sequence
            "Dependencies",   // JSON string of step dependencies
            "LastModifiedBy", // User who last modified the step
            "LastModifiedAt", // Last modification timestamp
            "Note"            // Additional notes
          ],
          // Add Log and Qualify Leads sheet headers
          [config.sheets.logAndQualifyLeads]: [
            "EnquiryNumber",      // Primary key (EN + 4 random digits)
            "CustomerName",       // Customer's name
            "CompanyName",        // Where they work
            "MobileNumber",       // Contact number
            "EmailId",            // For follow-up
            "ProductsInterested", // Products interested in (JSON array)
            "Requirement",        // Customer's requirement
            "LeadAssignedTo",     // Lead assigned to
            "CustomerLocation",   // Customer location
            "CustomerType",       // Customer type
            "Notes",              // Free-form notes
            "DateOfEntry",        // Auto-filled date
            "CreatedBy",          // User who created the log
            "CreatedAt",          // Creation timestamp
            "UpdatedAt",          // Last update timestamp
            "Status"              // Status (New)
          ],
          // Add Initial Call sheet headers
          [config.sheets.initialCall]: [
            "LogId",              // Reference to the main flow (EnquiryNumber)
            "FullName",           // Customer's name
            "CompanyName",        // Where they work
            "Email",              // For follow-up
            "PhoneNumber",        // Contact number
            "ProductsInterested", // Products interested in (JSON array)
            "LeadSource",         // Source of lead
            "Priority",           // Priority level (Low, Medium, High)
            "QualificationStatus", // Qualification status (New, Contacted, Qualified, Disqualified)
            "Notes",              // Free-form notes
            "Needs",              // Requirements gathered during initial call
            "ContactedBy",        // User who made the initial call
            "ContactedAt",        // When the initial call was made
            "Status"              // Status of the initial call
          ],
          // Add Evaluate High Value Prospects sheet headers
          [config.sheets.evaluateHighValueProspects]: [
            "LogId",              // Reference to the main flow
            "FullName",           // Customer's name
            "CompanyName",        // Where they work
            "Email",              // For follow-up
            "PhoneNumber",        // Contact number
            "ProductsInterested", // Products interested in
            "LeadSource",         // Source of lead
            "Priority",           // Priority level
            "QualificationStatus", // Qualification status
            "Notes",              // Free-form notes
            "EvaluationCriteria", // Evaluation criteria used
            "Score",              // Numerical score
            "Recommendation",     // Recommendation (Proceed, Reject, Further Analysis)
            "EvaluatedBy",        // User who evaluated
            "EvaluatedAt",        // When evaluation was done
            "Status"              // Status of evaluation
          ],
          // Add Check Feasibility sheet headers
          [config.sheets.checkFeasibility]: [
            "LogId",              // Reference to the main flow
            "FullName",           // Customer's name
            "CompanyName",        // Where they work
            "Email",              // For follow-up
            "PhoneNumber",        // Contact number
            "ProductsInterested", // Products interested in
            "LeadSource",         // Source of lead
            "Priority",           // Priority level
            "QualificationStatus", // Qualification status
            "Notes",              // Free-form notes
            "FeasibilityStatus",  // Feasibility status (Feasible, Not Feasible)
            "FeasibilityNotes",   // Detailed feasibility notes
            "CheckedBy",          // User who checked feasibility
            "CheckedAt",          // When feasibility was checked
            "Status"              // Status of feasibility check
          ],
          // Add Confirm Standard and Compliance sheet headers
          [config.sheets.confirmStandardAndCompliance]: [
            "LogId",              // Reference to the main flow
            "FullName",           // Customer's name
            "CompanyName",        // Where they work
            "Email",              // For follow-up
            "PhoneNumber",        // Contact number
            "ProductsInterested", // Products interested in
            "Requirement",        // Customer's requirement
            "LeadSource",         // Source of lead
            "Priority",           // Priority level
            "QualificationStatus", // Qualification status
            "Notes",              // Free-form notes
            "ComplianceStatus",   // Compliance status (Meets Requirements, Cannot Meet Requirements)
            "ComplianceNotes",    // Detailed compliance notes
            "CheckedBy",          // User who checked compliance
            "CheckedAt",          // When compliance was checked
            "Status"              // Status of compliance check
          ],
          // Add Send Quotation sheet headers
          [config.sheets.sendQuotation]: [
            "LogId",                // Reference to the lead (EnquiryNumber)
            "CustomerName",         // Customer name
            "CompanyName",          // Company
            "Email",                // Email
            "PhoneNumber",          // Phone
            "ProductsInterested",   // JSON array of product codes
            "Requirement",          // Requirement text
            "QuotationItems",       // JSON array of items with qty and price
            "TotalAmount",          // Total quotation amount
            "QuotationDocumentId",  // Google Drive file ID for the quotation PDF
            "CreatedBy",            // User who generated the quotation
            "CreatedAt",            // Timestamp
            "Status"                // e.g., Sent / Draft
          ],
          // Employee Management Sheets
          Employees: [
            "EmployeeCode",
            "EmployeeName", 
            "Email",
            "Phone",
            "DateOfBirth",
            "Address",
            "Department",
            "Designation",
            "EmployeeType",
            "JoiningDate",
            "ReportingManager",
            "SalaryGrade",
            "Status",
            "HighestQualification",
            "University",
            "GraduationYear",
            "Specialization",
            "Experience",
            "Skills",
            "Certifications",
            "EmployeeId",
            "CreatedAt",
            "UpdatedAt"
          ],
          TimeTracking: [
            "EmployeeCode",
            "Date",
            "ClockIn",
            "ClockOut",
            "Status",
            "WorkingHours",
            "BreakTime",
            "Notes",
            "CreatedAt"
          ],
          Performance: [
            "EmployeeCode",
            "Date",
            "Metric",
            "Score",
            "Target",
            "Comments",
            "ReviewedBy",
            "CreatedAt"
          ],
          Attendance: [
            "EmployeeCode",
            "Date",
            "Status",
            "ClockIn",
            "ClockOut",
            "WorkingHours",
            "Notes",
            "Remarks",
            "CreatedAt"
          ],
          EmployeeTasks: [
            "TaskId",
            "TaskTitle",
            "Description",
            "AssignedTo",
            "Priority",
            "Status",
            "DueDate",
            "CreatedBy",
            "CreatedAt",
            "UpdatedAt",
            "Notes"
          ],
          Notifications: [
            "Id",
            "EmployeeCode",
            "Type",
            "Title",
            "Message",
            "Priority",
            "Read",
            "ReadAt",
            "CreatedAt"
          ],
          // Cable Production Sheets
          Stock: [
            "itemCode",
            "itemName",
            "category",
            "currentStock",
            "minLevel",
            "maxLevel",
            "reorderPoint",
            "unit",
            "location",
            "item specifications",
            "lastUpdated",
            "status"
          ],
          "Machine Schedules": [
            "scheduleId",
            "planId",
            "machineType",
            "machineId",
            "machineName",
            "operation",
            "operationSequence",
            "productCode",
            "quantity",
            "unit",
            "setupTime",
            "operationTime",
            "cleanupTime",
            "totalTime",
            "scheduledStartTime",
            "scheduledEndTime",
            "actualStartTime",
            "actualEndTime",
            "status",
            "operatorId",
            "operatorName",
            "shift",
            "priority",
            "dependencies",
            "materialConsumed",
            "qualityCheckStatus",
            "efficiency",
            "downtime",
            "notes",
            "createdDate"
          ],
          "Cable Products": [
            "productCode",
            "productName",
            "productFamily",
            "cableType",
            "strandCount",
            "conductorMaterial",
            "conductorSize",
            "conductorConstruction",
            "insulationMaterial",
            "insulationThickness",
            "jacketMaterial",
            "jacketThickness",
            "shieldType",
            "armorType",
            "coreCount",
            "coreColors",
            "cableProfile",
            "outerDiameter",
            "standardLength",
            "minLength",
            "maxLength",
            "temperatureRating",
            "flameRating",
            "complianceStandards",
            "ipRating",
            "bendRadius",
            "weightPerMeter",
            "applicationArea",
            "isActive",
            "specifications",
            "remarks",
            "createdDate",
            "lastModified"
          ],
          "Cable Production Plans": [
            "planId",
            "orderNumber",
            "customerName",
            "productCode",
            "productName",
            "quantity",
            "requiredLength",
            "totalMeters",
            "dueDate",
            "priority",
            "status",
            "productionMethod",
            "qualityRequirements",
            "specialInstructions",
            "materialAllocated",
            "machineAllocated",
            "estimatedStartDate",
            "estimatedCompletionDate",
            "actualStartDate",
            "actualCompletionDate",
            "completedQuantity",
            "rejectedQuantity",
            "materialWastage",
            "efficiency",
            "remarks",
            "createdBy",
            "createdDate",
            "lastModified"
          ],
        };

        // Try to initialize the sheet with headers
        if (defaultHeaders[sheetName]) {
          try {
            // Use direct API call with OAuth token
            const initHeaders = {};
            if (this.accessToken) {
              initHeaders.Authorization = `Bearer ${this.accessToken}`;
            }

            let url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!1:1?valueInputOption=RAW`;
            if (!this.accessToken) {
              url += `&key=${this.apiKey}`;
            }

            await axios.put(
              url,
              { values: [defaultHeaders[sheetName]] },
              { headers: initHeaders }
            );

            return defaultHeaders[sheetName];
          } catch (initError) {
            console.error(
              `Failed to initialize headers for sheet ${sheetName}:`,
              initError
            );
            throw new Error(
              `Failed to initialize sheet ${sheetName}. Please create the sheet manually in Google Sheets.`
            );
          }
        } else {
          throw new Error(`Unknown sheet type: ${sheetName}`);
        }
      } catch (fetchError) {
        if (
          fetchError.message &&
          fetchError.message.includes("does not exist")
        ) {
          throw fetchError; // Just pass through the "does not exist" error
        } else if (
          fetchError.response &&
          fetchError.response.status === 400 &&
          fetchError.response.data &&
          fetchError.response.data.error &&
          fetchError.response.data.error.message &&
          fetchError.response.data.error.message.includes(
            "Unable to parse range"
          )
        ) {
          throw new Error(
            `Sheet ${sheetName} does not exist. Please create it using the Sheet Initializer in the UI.`
          );
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error(`Error getting headers from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Update a specific row in a sheet
  async updateRow(sheetName, rowIndex, rowData) {
    try {
      await this.init();

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error("OAuth access token required for this operation");
      }

      const sheetHeaders = await this.getSheetHeaders(sheetName);

      // Format the row data according to the headers
      const values = [sheetHeaders.map((header) => {
        // Normalize header names to avoid trailing/leading space mismatches
        const normalizedHeader = typeof header === 'string' ? header.trim() : header;
        const value = rowData[normalizedHeader];
        
        // Handle arrays by converting them to JSON strings
        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
        
        // Handle objects by converting them to JSON strings
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert to string to ensure compatibility
        return String(value);
      })];

      // Make direct API call with OAuth token
      const reqHeaders = {};
      if (this.accessToken) {
        reqHeaders.Authorization = `Bearer ${this.accessToken}`;
      }

      let url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!A${rowIndex}?valueInputOption=USER_ENTERED`;
      if (!this.accessToken) {
        url += `&key=${this.apiKey}`;
      }

      const response = await axios.put(
        url,
        { values },
        { headers: reqHeaders }
      );

      // Update cache with modified row instead of invalidating
      this.updateCacheWithModifiedRow(sheetName, rowIndex, rowData);
      
      return response.data;
    } catch (error) {
      console.error(`Error updating row in sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Get the sheet ID for a given sheet name
  async getSheetId(sheetName) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const sheet = response.data.sheets.find(
        (s) => s.properties.title === sheetName
      );
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return sheet.properties.sheetId;
    } catch (error) {
      console.error(`Error getting sheet ID for ${sheetName}:`, error);
      throw error;
    }
  }

  // Create a new sheet
  async createSheet(sheetName) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Delete a specific row from a sheet
  async deleteRow(sheetName, rowIndex) {
    try {
      await this.init();

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error("OAuth access token required for this operation");
      }

      // Make direct API call with OAuth token
      const reqHeaders = {
        Authorization: `Bearer ${this.accessToken}`,
      };

      // Use batchUpdate to delete the row
      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await this.getSheetId(sheetName),
                  dimension: "ROWS",
                  startIndex: rowIndex - 1, // Convert to 0-based index
                  endIndex: rowIndex, // End index is exclusive
                },
              },
            },
          ],
        },
        { headers: reqHeaders }
      );

      // Remove row from cache instead of invalidating
      this.removeRowFromCache(sheetName, rowIndex);
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting row from sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Upload a file to Google Drive and return the file ID
  async uploadFile(file, folderId = null) {
    try {
      // Check if we should use localStorage instead of Google Drive
      if (config.useLocalStorage) {
        return this.uploadFileToLocalStorage(file);
      }

      await this.init();

      // Make sure we have an access token
      if (!this.accessToken) {
        console.warn(
          "No OAuth token available, falling back to localStorage for file storage"
        );
        return this.uploadFileToLocalStorage(file);
      }

      // Check if token is expired
      try {
        const response = await axios.get(
          "https://www.googleapis.com/oauth2/v1/tokeninfo",
          {
            params: { access_token: this.accessToken }
          }
        );
        if (response.data.expires_in <= 0) {
          // Token is expired, reinitialize
          await this.init();
        }
      } catch (tokenError) {
        console.warn("Token validation failed, reinitializing...");
        await this.init();
      }

      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : [],
      };

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", file);

      try {
        const response = await axios.post(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          form,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return response.data.id;
      } catch (error) {
        // Check if it's a 403 error
        if (error.response && error.response.status === 403) {
          console.warn("Permission denied. Please check OAuth scopes and file permissions.");
          // Try to reinitialize and get a new token
          try {
            await this.init();
            // Retry the upload once with the new token
            const retryResponse = await axios.post(
              "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
              form,
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            return retryResponse.data.id;
          } catch (retryError) {
            console.error("Retry failed:", retryError);
            throw retryError;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("Error uploading file to Google Drive:", error);
      console.warn("Falling back to localStorage for file storage");
      return this.uploadFileToLocalStorage(file);
    }
  }

  // Upload a file to localStorage instead of Google Drive
  async uploadFileToLocalStorage(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const fileId = `doc_${Date.now()}_${file.name}`;
            const fileData = {
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              dateUploaded: new Date().toISOString(),
              content: e.target.result,
            };

            // Get existing files from localStorage or initialize empty array
            const existingFiles = JSON.parse(
              localStorage.getItem("documentFiles") || "[]"
            );

            // Check if adding this file would exceed quota
            const newFiles = [...existingFiles, fileData];
            const totalSize = newFiles.reduce((sum, file) => sum + file.content.length, 0);
            
            // If total size would exceed 4MB (typical localStorage limit), remove oldest files
            if (totalSize > 4 * 1024 * 1024) {
              // Sort by dateUploaded and keep only the newest files that fit within quota
              const sortedFiles = newFiles.sort((a, b) => 
                new Date(b.dateUploaded) - new Date(a.dateUploaded)
              );
              
              let currentSize = 0;
              const filesToKeep = [];
              
              for (const file of sortedFiles) {
                if (currentSize + file.content.length <= 4 * 1024 * 1024) {
                  filesToKeep.push(file);
                  currentSize += file.content.length;
                }
              }
              
              localStorage.setItem("documentFiles", JSON.stringify(filesToKeep));
            } else {
              localStorage.setItem("documentFiles", JSON.stringify(newFiles));
            }

            resolve(fileId);
          } catch (storageError) {
            console.error("Error storing file in localStorage:", storageError);
            reject(new Error("Failed to store file in localStorage. Please try a smaller file or clear some space."));
          }
        };

        reader.onerror = (e) => {
          reject(new Error("Error reading file"));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error in uploadFileToLocalStorage:", error);
        reject(error);
      }
    });
  }

  // Get or create a Google Drive folder by name
  async getOrCreateFolder(folderName, parentFolderId = null) {
    try {
      // If using localStorage, return null (no folder structure needed)
      if (config.useLocalStorage) {
        return null;
      }

      await this.init();

      // Make sure we have an access token
      if (!this.accessToken) {
        console.warn("No OAuth token available, cannot create Drive folder");
        return null;
      }

      // Check if token is expired
      try {
        const response = await axios.get(
          "https://www.googleapis.com/oauth2/v1/tokeninfo",
          {
            params: { access_token: this.accessToken }
          }
        );
        if (response.data.expires_in <= 0) {
          await this.init();
        }
      } catch (tokenError) {
        console.warn("Token validation failed, reinitializing...");
        await this.init();
      }

      // First, try to find existing folder
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchParams = parentFolderId 
        ? `${query} and '${parentFolderId}' in parents`
        : query;

      try {
        const searchResponse = await axios.get(
          "https://www.googleapis.com/drive/v3/files",
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            params: {
              q: searchParams,
              fields: "files(id, name)",
            },
          }
        );

        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
          // Folder exists, return its ID
          return searchResponse.data.files[0].id;
        }
      } catch (searchError) {
        console.warn("Error searching for folder:", searchError);
        // Continue to create folder
      }

      // Folder doesn't exist, create it
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId ? [parentFolderId] : [],
      };

      const createResponse = await axios.post(
        "https://www.googleapis.com/drive/v3/files",
        folderMetadata,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return createResponse.data.id;
    } catch (error) {
      console.error("Error getting/creating Drive folder:", error);
      // Return null on error - files will be uploaded to root
      return null;
    }
  }

  // Get file from localStorage or Google Drive by ID
  async getFileById(fileId) {
    try {
      if (config.useLocalStorage) {
        // Retrieve files from localStorage
        const files = JSON.parse(localStorage.getItem("documentFiles") || "[]");
        const file = files.find((f) => f.id === fileId);

        if (!file) {
          throw new Error(`File with ID ${fileId} not found in localStorage`);
        }

        return file;
      }

      // If not using localStorage, download from Google Drive
      await this.init();

      // Make sure we have an access token
      if (!this.accessToken) {
        console.warn(
          "No OAuth token available, checking localStorage as fallback"
        );
        // Try to get the file from localStorage as a fallback
        const files = JSON.parse(localStorage.getItem("documentFiles") || "[]");
        const file = files.find((f) => f.id === fileId);

        if (!file) {
          throw new Error(
            `File with ID ${fileId} not found in localStorage (fallback)`
          );
        }

        return file;
      }

      // Use the access token to fetch the file from Google Drive
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: "blob",
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error retrieving file with ID ${fileId}:`, error);
      throw error;
    }
  }

  // Log an action to the audit log
  async logAction(poId, previousStatus, newStatus, userId) {
    try {
      const timestamp = new Date().toISOString();
      const logData = {
        POId: poId,
        PreviousStatus: previousStatus,
        NewStatus: newStatus,
        UserId: userId,
        Timestamp: timestamp,
      };

      return await this.appendRow(config.sheets.auditLog, logData);
    } catch (error) {
      console.error("Error logging action to audit log:", error);
      throw error;
    }
  }

  // Check if a sheet exists
  async doesSheetExist(sheetName) {
    try {
      const reqHeaders = {
        Authorization: `Bearer ${this.accessToken}`,
      };

      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!1:1`;

      await axios.get(url, { headers: reqHeaders });
      return true; // If no error is thrown, the sheet exists
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return false; // Sheet doesn't exist
      }
      throw error; // Some other error occurred
    }
  }

  // Initialize all sheets needed by the application
  async initializeAllSheets() {
    try {
      await this.init();
      
      // Get all existing sheets
      const response = await axios.get(
        `${this.baseUrl}/${this.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      
      const allSheets = response.data.sheets;
      const results = [];

      // Define headers for each sheet
      const defaultHeaders = {
        [config.sheets.poMaster]: [
          "PO_Number",
          "Date",
          "Vendor",
          "Items",
          "Total_Amount",
          "Status",
          "Created_By",
          "Created_At",
          "Updated_At"
        ],
        [config.sheets.bomTemplates]: [
          "Template_ID",
          "Product_Name",
          "Components",
          "Created_By",
          "Created_At",
          "Updated_At"
        ],
        [config.sheets.inventory]: [
          "Item_ID",
          "Name",
          "Category",
          "Quantity",
          "Unit",
          "Location",
          "Last_Updated"
        ],
        [config.sheets.users]: [
          "User_ID",
          "Name",
          "Email",
          "Role",
          "Department",
          "Last_Login"
        ],
        [config.sheets.auditLog]: [
          "Log_ID",
          "User_ID",
          "Action",
          "Details",
          "Timestamp"
        ],
        [config.sheets.metrics]: [
          "Metric_ID",
          "Name",
          "Value",
          "Timestamp",
          "MetricId",
          "MetricName",
          "MetricValue",
          "DateRecorded",
          "Category",
        ],
        // Dispatches sheet headers (trimmed to match current sheet layout)
        Dispatches: [
          "DispatchUniqueId",
          "UniqueId",
          "ClientCode",
          "ProductCode",
          "ProductName",
          "BatchNumber",
          "BatchSize",
          "updatedBatch",
          "DispatchDate",
          "DateEntry",
          "CreatedAt",
          "Dispatched",
          "store1Status",
          "cableProdStatus",
          "store2Status",
          "mouldingProdStatus",
          "fgSectionStatus",
          "dispatchStatus",
          "deliveryStatus",
          "receivingDocuments",
          "BatchCompleted",
          "mouldingRemaining",
          "mouldingRemair",
          "moveToFg",
          "moveHistory",
          "LastModified"
        ],
        // Add CLIENT sheet headers
        CLIENT: [
          "ClientCode",
          "ClientName",
          "Address",
          "Contacts",
          "Products",
          "CreatedAt",
          "UpdatedAt"
        ],
        PurchaseFlow: [
          "FlowId",
          "IndentNumber",
          "ItemCode",
          "ItemName",
          "Quantity",
          "Specifications",
          "CurrentStep",
          "Status",
          "CreatedBy",
          "CreatedAt",
          "UpdatedAt",
          "ExpectedDelivery",
          "Priority",
          "Department",
          "Budget",
          "VendorDetails",
          "Documents",
          "Comments",
          "TATBreaches",
          "ApprovalChain",
          "FinalAmount",
          "PaymentStatus",
          "LastModifiedBy"
        ],
        // Send Quotation sheet for sales flow
        [config.sheets.sendQuotation]: [
          "LogId",
          "CustomerName",
          "CompanyName",
          "Email",
          "PhoneNumber",
          "ProductsInterested",
          "Requirement",
          "QuotationItems",
          "TotalAmount",
          "QuotationDocumentId",
          "CreatedBy",
          "CreatedAt",
          "Status"
        ],
        purchaseFlowSteps: [
          "StepId",
          "FlowId",
          "IndentNumber",
          "ItemCode",
          "StepNumber",
          "Role",
          "Action",
          "ItemName",
          "Quantity",
          "Specifications",
          "Status",
          "AssignedTo",
          "StartTime",
          "EndTime",
          "TAT",
          "TATStatus",
          "Documents",
          "Comments",
          "ApprovalStatus",
          "RejectionReason",
          "NextStep",
          "PreviousStep",
          "Dependencies",
          "LastModifiedBy",
          "LastModifiedAt",
          "Note"
        ],
        [config.sheets.placePO]: [
          "POId",
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "VendorCode",
          "Price",
          "DeliveryTime",
          "Terms",
          "LeadTime",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "PlacedAt",
          "PODocumentId"
        ],
        [config.sheets.materialApproval]: [
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "Price",
          "VendorCode",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "DCDocumentId",
          "InvoiceDocumentId",
          "PODocumentId",
          "Status",
          "ApprovalDate",
          "ApprovedBy",
          "RejectionNote",
        ],
        [config.sheets.followUpQuotations]: [
          "IndentNumber",
          "Vendor",
          "QuotationDocument",
          "CreatedBy",
          "CreatedAt",
        ],
        [config.sheets.inspectMaterial]: [
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "Price",
          "VendorCode",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "DCDocumentId",
          "InvoiceDocumentId",
          "PODocumentId",
          "InspectionDate",
          "InspectedBy",
          "Status",
          "Note",
        ],
        [config.sheets.generateGrn]: [
          "GRNId",
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "Price",
          "VendorCode",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "DCDocumentId",
          "InvoiceDocumentId",
          "PODocumentId",
          "InspectionDate",
          "InspectedBy",
          "GRNDate",
          "GeneratedBy",
          "GRNDocumentId",
          "Status",
        ],
        [config.sheets.schedulePayment]: [
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "Price",
          "VendorCode",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "DCDocumentId",
          "InvoiceDocumentId",
          "PODocumentId",
          "GRNId",
          "GRNDate",
          "PaymentDate",
          "ScheduledBy",
          "ScheduledAt",
          "Status",
        ],
        [config.sheets.releasePayment]: [
          "IndentNumber",
          "ItemName",
          "Specifications",
          "Quantity",
          "Price",
          "VendorCode",
          "VendorName",
          "VendorContact",
          "VendorEmail",
          "DCDocumentId",
          "InvoiceDocumentId",
          "PODocumentId",
          "GRNId",
          "GRNDate",
          "ScheduledPaymentDate",
          "ScheduledBy",
          "ScheduledAt",
          "PaymentMethod",
          "TransactionId",
          "PaymentAmount",
          "PaymentNotes",
          "PaymentDate",
          "ReleasedBy",
          "ReleasedAt",
          "Status",
        ],
        // Add InspectSample sheet headers
        InspectSample: [
          "IndentNumber",
          "VendorCode",
          "ItemCode",
          "Note",
          "Status", // Approved/Rejected
          "Action",
          "InspectedBy",
          "InspectedAt",
          "RejectionReason",
        ],
        // Add ReturnMaterial sheet headers
        [config.sheets.returnMaterial]: [
          "POId",
          "Details",
          "CreatedBy",
          "CreatedAt"
        ],
        // Add Costing sheet headers
        Costing: [
          "Costing ID",
          "Date",
          "Specifications",
          "Cu Strands",
          "Gauge",
          "Inner OD",
          "Bunch",
          "Copper Weight (Kgs/100 mtr)",
          "PVC Weight (Kgs/100 mtr)",
          "No. Of Cores",
          "Round OD",
          "Flat B",
          "Flat W",
          "Laying",
          "Final Copper (Kgs/100 mtr)",
          "Final PVC Round (Kgs/100 mtr)",
          "Final PVC Flat (Kgs/100 mtr)",
          "Copper Rate",
          "PVC Rate",
          "RMC",
          "Labour on Wire",
          "Bundle Cost",
          "Bundle Weight",
          "Cost Of Wire/Mtr",
          "Length Required",
          "Wire Cost",
          "Type (Wire/Plug)",
          "Plug Cost",
          "Terminal/Acc. Cost",
          "Cord Cost",
          "Enquiry By",
          "Company",
          "Remarks",
          "Unique"
        ],
        // Add Company Kitting Issues sheet headers
        "Company Material Issues": [
          "uniqueKittingId",
          "bomId", 
          "itemIssueDetails"
        ],
        // Add Sales Flow sheet headers
        [config.sheets.salesFlow]: [
          "LogId",              // Unique identifier for the sales flow (LO + 4 random digits)
          "FullName",           // Lead's name
          "CompanyName",        // Where they work
          "Email",              // For follow-up
          "PhoneNumber",        // Contact number
          "ProductsInterested", // Products interested in
          "LeadSource",         // Source of lead
          "Priority",           // Priority level
          "QualificationStatus", // Qualification status
          "Notes",              // Free-form notes
          "CurrentStep",        // Current step in the workflow (1-15)
          "Status",            // Overall status (New, In Progress, Completed, Rejected)
          "CreatedBy",         // User who initiated the flow
          "CreatedAt",         // Flow creation timestamp
          "UpdatedAt",         // Last update timestamp
          "ExpectedDelivery",  // Expected delivery date
          "AssignedTo",        // Currently assigned to
          "TAT",              // Turn Around Time in days
          "TATStatus",        // TAT status (On Time, Breached)
          "Documents",        // JSON string of document references
          "Comments",         // JSON string of comments/notes
          "LastModifiedBy",   // User who last modified the flow
          "NextStep",         // Next step in sequence
          "PreviousStep",     // Previous step in sequence
          "StepId"            // Current step ID
        ],
        // Add Sales Flow Steps sheet headers
        [config.sheets.salesFlowSteps]: [
          "StepId",           // Step identifier (1-15)
          "LogId",            // Reference to the main flow
          "StepNumber",       // Step number in sequence
          "Role",            // Role responsible for this step (Customer Relations Manager, Sales Executive, NPD, Quality Engineer, Director, Production Manager, Store Manager, Accounts Executive)
          "Action",          // Action to be performed
          "Status",          // Step status (Pending, In Progress, Completed, Rejected)
          "AssignedTo",      // User assigned to this step
          "StartTime",       // When the step was started
          "EndTime",         // When the step was completed
          "TAT",            // Turn Around Time in days
          "TATStatus",      // TAT status (On Time, Breached)
          "Documents",      // JSON string of documents attached
          "Comments",       // JSON string of comments
          "ApprovalStatus", // Approval status for this step
          "RejectionReason", // Reason if rejected
          "NextStep",       // Next step in sequence
          "PreviousStep",   // Previous step in sequence
          "Dependencies",   // JSON string of step dependencies
          "LastModifiedBy", // User who last modified the step
          "LastModifiedAt", // Last modification timestamp
          "Note"            // Additional notes
        ],
        // Add Log and Qualify Leads sheet headers
        [config.sheets.logAndQualifyLeads]: [
          "EnquiryNumber",      // Primary key (EN + 4 random digits)
          "CustomerName",       // Customer's name
          "CompanyName",        // Where they work
          "MobileNumber",       // Contact number
          "EmailId",            // For follow-up
          "ProductsInterested", // Products interested in (JSON array)
          "Requirement",        // Customer's requirement
          "LeadAssignedTo",     // Lead assigned to
          "CustomerLocation",   // Customer location
          "CustomerType",       // Customer type
          "Notes",              // Free-form notes
          "DateOfEntry",        // Auto-filled date
          "CreatedBy",          // User who created the log
          "CreatedAt",          // Creation timestamp
          "UpdatedAt",          // Last update timestamp
          "Status"              // Status (New)
        ],
        // Add SortVendor sheet headers
        [config.sheets.sortVendor]: [
          "POId",
          "VendorDetails",
          "Items",
          "StepId",
          "NextStep",
          "CreatedBy",
          "CreatedAt",
          "LastModifiedBy",
          "LastModifiedAt",
          "Status"
        ],
        // Add FollowUpDelivery sheet headers
        [config.sheets.followUpDelivery]: [
          "POId",
          "VendorDetails",
          "Items",
          "ExpectedDate",
          "CreatedBy",
          "CreatedAt",
          "LastModifiedBy",
          "LastModifiedAt"
        ],
        // Add InspectMaterial sheet headers
        [config.sheets.inspectMaterial]: [
          "POId",
          "VendorDetails",
          "Items",
          "Status",
          "Note",
          "CreatedBy",
          "CreatedAt",
          "LastModifiedBy",
          "LastModifiedAt"
        ],
        // Payment Reminder sheets
        [config.sheets.crmInvoices]: [
          "Id",
          "InvoiceNo",
          "CustomerId",
          "CustomerName",
          "Amount",
          "IssueDate",
          "DueDate",
          "Status",
          "PaymentMode",
          "Notes",
          "CreatedBy",
          "CreatedAt",
          "UpdatedAt"
        ],
        [config.sheets.crmReminderTemplates]: [
          "Id",
          "Channel",
          "Language",
          "Subject",
          "Body",
          "DefaultSendOffsetDays",
          "SendWindow",
          "CreatedAt",
          "UpdatedAt"
        ],
        [config.sheets.crmCommunications]: [
          "Id",
          "InvoiceId",
          "CustomerId",
          "Channel",
          "TemplateId",
          "SendAt",
          "SentBy",
          "Status",
          "DeliveryMeta",
          "CreatedAt"
        ],
        [config.sheets.crmCallTasks]: [
          "Id",
          "InvoiceId",
          "CustomerId",
          "CustomerName",
          "AssignedTo",
          "DueAt",
          "Priority",
          "Status",
          "Attempts",
          "LastContactAt",
          "LastOutcome",
          "CreatedBy",
          "CreatedAt",
          "UpdatedAt"
        ],
        [config.sheets.crmTaskLogs]: [
          "Id",
          "TaskId",
          "UserId",
          "Action",
          "Note",
          "CreatedAt"
        ]
      };

      // Initialize each sheet if it doesn't exist
      for (const [sheetName, headers] of Object.entries(defaultHeaders)) {
        const sheetExists = allSheets.some(sheet => sheet.properties.title === sheetName);
        
        if (!sheetExists) {
          try {
            // Create the sheet
            await this.createSheet(sheetName);
            
            // Add headers
            await this.appendRow(sheetName, headers);
            
            results.push({
              sheet: sheetName,
              status: 'created',
              message: 'Sheet created and initialized with headers'
            });
          } catch (error) {
            results.push({
              sheet: sheetName,
              status: 'error',
              message: error.message
            });
          }
        } else {
          results.push({
            sheet: sheetName,
            status: 'exists',
            message: 'Sheet already exists'
          });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error initializing sheets:', error);
      throw error;
    }
  }

  // Update step status by IndentNumber and StepId, and update both sheets
  async updateStepStatus(indentNumber, stepId, status, data) {
    try {
      await this.init();
      const now = new Date().toISOString();
      // Update all matching steps in PurchaseFlowSteps
      const stepData = await this.getSheetData(config.sheets.purchaseFlowSteps);
      const stepUpdates = [];
      for (let i = 0; i < stepData.length; i++) {
        const row = stepData[i];
        if (row.IndentNumber === indentNumber && row.StepId === stepId) {
          const rowIndex = i + 2;
          stepUpdates.push(this.updateRow(config.sheets.purchaseFlowSteps, rowIndex, {
            ...row,
            Status: status,
            StepNumber: 2,
            ApprovalStatus: data.ApprovalStatus || row.ApprovalStatus,
            RejectionReason: data.RejectionReason || row.RejectionReason,
            Documents: data.documents ? JSON.stringify(data.documents) : row.Documents,
            Comments: data.comments ? JSON.stringify(data.comments) : row.Comments,
            LastModifiedBy: data.userEmail || row.LastModifiedBy,
            LastModifiedAt: now
          }));
        }
      }
      // Update all matching main flow rows in PurchaseFlow
      const flowData = await this.getSheetData(config.sheets.purchaseFlow);
      const flowUpdates = [];
      for (let i = 0; i < flowData.length; i++) {
        const row = flowData[i];
        if (row.IndentNumber === indentNumber) {
          const rowIndex = i + 2;
          let newStatus = status === 'completed' ? 'In Progress' : (status === 'rejected' ? 'Rejected' : row.Status);
          flowUpdates.push(this.updateRow(config.sheets.purchaseFlow, rowIndex, {
            ...row,
            Status: newStatus,
            CurrentStep: 2,
            UpdatedAt: now,
            LastModifiedBy: data.userEmail || row.LastModifiedBy
          }));
        }
      }
      await Promise.all([...stepUpdates, ...flowUpdates]);
      return true;
    } catch (error) {
      console.error('Error updating step status:', error);
      throw error;
    }
  }

  // Update data in a specific sheet
  async updateSheetData(sheetName, rowIndex, data) {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize Google API client');
      }

      if (!sheetName) {
        throw new Error('Sheet name is required');
      }

      // Make sure we have an access token for non-localStorage mode
      if (!config.useLocalStorage && !this.accessToken) {
        throw new Error('OAuth access token required for this operation');
      }

      // Convert data object to array of values
      const values = Object.values(data);

      // Make API call to update the row
      const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!A${rowIndex}:Z${rowIndex}?valueInputOption=USER_ENTERED`;
      const response = await axios.put(url, {
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        majorDimension: 'ROWS',
        values: [values]
      }, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 200) {
        return true;
      } else {
        throw new Error('Failed to update sheet data');
      }
    } catch (error) {
      console.error(`Error updating data in sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Get the latest dispatch limit range from a sheet (e.g., 'DispatchLimits')
  async getLatestDispatchLimitRange(
    sheetName = "Daily_CAPACITY",
    forDate = new Date()
  ) {
    try {
      const data = await this.getSheetData(sheetName);
      if (!data || data.length === 0) return null;
      let latest = null;
      const checkDate = new Date(forDate);
      data.forEach((row) => {
        const start =
          row["Start Date"] || row["startDate"] || row["start_date"];
        const end = row["End Date"] || row["endDate"] || row["end_date"];
        const limit = row["Limit"] || row["limit"];
        if (!start || !end || !limit) return;
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (checkDate >= startDate && checkDate <= endDate) {
          latest = { startDate, endDate, limit: parseInt(limit, 10) };
        }
      });
      // If no range matches, return the last row
      if (!latest) {
        const last = data[data.length - 1];
        latest = {
          startDate: new Date(
            last["Start Date"] || last["startDate"] || last["start_date"]
          ),
          endDate: new Date(
            last["End Date"] || last["endDate"] || last["end_date"]
          ),
          limit: parseInt(last["Limit"] || last["limit"], 10),
        };
      }
      return latest;
    } catch (error) {
      console.error("Error getting latest dispatch limit range:", error);
      throw error;
    }
  }

  // Fetch all items from the Stock (Inventory) sheet
  async getStockItems() {
    return await this.getSheetData('Stock');
  }

  // Create a new sheet in the spreadsheet
  async createSheet(sheetName) {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize Google API client');
      }

      if (!sheetName) {
        throw new Error('Sheet name is required');
      }

      // Check if sheet already exists
      const exists = await this.doesSheetExist(sheetName);
      if (exists) {
        return {
          success: true,
          message: `Sheet ${sheetName} already exists`
        };
      }

      // Create new sheet using batchUpdate
      const requests = [{
        addSheet: {
          properties: {
            title: sheetName
          }
        }
      }];

      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`,
        { requests },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: `Sheet ${sheetName} created successfully`
        };
      } else {
        throw new Error(`Failed to create sheet: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw new Error(`Failed to create sheet ${sheetName}: ${error.message}`);
    }
  }

  // Create a sheet if it doesn't exist and initialize with headers
  async createSheetIfNotExists(sheetName, headers = []) {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize Google API client');
      }

      if (!sheetName) {
        throw new Error('Sheet name is required');
      }

      // Check if sheet already exists
      const exists = await this.doesSheetExist(sheetName);
      if (exists) {

        return {
          success: true,
          message: `Sheet ${sheetName} already exists`
        };
      }

      // Create new sheet
      const createResult = await this.createSheet(sheetName);
      
      // Add headers if provided
      if (headers && headers.length > 0) {
        await this.appendRow(sheetName, headers);
      }

      return {
        success: true,
        message: `Sheet ${sheetName} created successfully with headers`
      };
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw new Error(`Failed to create sheet ${sheetName}: ${error.message}`);
    }
  }

  // Clear all data from a sheet (except headers)
  async clearSheet(sheetName, keepHeaders = true) {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize Google API client');
      }

      if (!sheetName) {
        throw new Error('Sheet name is required');
      }

      // Get current data to determine range
      const data = await this.getSheetData(sheetName);
      
      if (!data || data.length === 0) {
        return {
          success: true,
          message: `Sheet ${sheetName} is already empty`
        };
      }

      // Determine the range to clear
      let range;
      if (keepHeaders && data.length > 1) {
        // Clear from row 2 onwards (keep headers)
        range = `${sheetName}!A2:ZZ${data.length}`;
      } else if (data.length > 0) {
        // Clear everything
        range = `${sheetName}!A1:ZZ${data.length}`;
      } else {
        return {
          success: true,
          message: `Sheet ${sheetName} is already empty`
        };
      }

      // Clear the range
      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}/values/${range}:clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: `Sheet ${sheetName} cleared successfully`
        };
      } else {
        throw new Error(`Failed to clear sheet: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error clearing sheet ${sheetName}:`, error);
      throw new Error(`Failed to clear sheet ${sheetName}: ${error.message}`);
    }
  }

  // Batch append multiple rows to a sheet
  async batchAppendRows(sheetName, rows) {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize Google API client');
      }

      if (!sheetName || !rows || rows.length === 0) {
        throw new Error('Sheet name and rows are required');
      }

      // Prepare the batch request
      const range = `${sheetName}!A:Z`;
      const values = rows.map(row => {
        if (Array.isArray(row)) {
          return row.map(cell => String(cell || ''));
        } else {
          return [String(row || '')];
        }
      });

      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}/values/${range}:append`,
        {
          values: values,
          majorDimension: 'ROWS'
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS'
          }
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: `Successfully added ${rows.length} rows to ${sheetName}`,
          updatedRows: response.data.updates.updatedRows
        };
      } else {
        throw new Error(`Failed to append rows: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error batch appending to sheet ${sheetName}:`, error);
      throw new Error(`Failed to batch append rows to ${sheetName}: ${error.message}`);
    }
  }
}

export default new SheetService();

