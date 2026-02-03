import sheetService from './sheetService';
import config from '../config/config';

// Generate unique client code (PC + 4 digits starting from PC0001 for Prospects Clients)
async function generateClientCode() {
  const data = await sheetService.getSheetData(config.sheets.prospectsClients);
  const max = data.reduce((acc, row) => {
    const match = row.ClientCode && row.ClientCode.match(/^PC(\d{4})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > acc ? num : acc;
    }
    return acc;
  }, 0); // Start from 0 so next will be 1
  const next = (max + 1).toString().padStart(4, '0');
  return `PC${next}`;
}

export async function checkClientCodeExists(clientCode) {
  const data = await sheetService.getSheetData(config.sheets.prospectsClients);
  return data.some(row => row.ClientCode === clientCode);
}

export async function getAllClients(forceRefresh = false) {
  const data = await sheetService.getSheetData(config.sheets.prospectsClients, forceRefresh);
  // data is array of objects with keys from header
  return data.map(row => ({
    // Basic Information
    clientName: row.ClientName || '',
    clientCode: row.ClientCode || '',
    businessType: row.BusinessType || '',
    
    // Contact Information
    address: row.Address || '',
    city: row.City || '',
    state: row.State || '',
    stateCode: row.StateCode || '',
    pincode: row.Pincode || '',
    country: row.Country || 'India',
    
    // Business Details
    gstin: row.GSTIN || '',
    panNumber: row.PANNumber || '',
    accountCode: row.AccountCode || '',
    website: row.Website || '',
    
    // Contact Management
    contacts: row.Contacts ? JSON.parse(row.Contacts) : [],
    
    // Business Terms
    paymentTerms: row.PaymentTerms || '',
    creditLimit: row.CreditLimit || '',
    creditPeriod: row.CreditPeriod || '',
    deliveryTerms: row.DeliveryTerms || '',
    
    // Product Information
    products: row.Products ? JSON.parse(row.Products) : [],
    
    // Additional Information
    notes: row.Notes || '',
    status: row.Status || 'Active',
    rating: parseInt(row.Rating) || 0,
    lastContactDate: row.LastContactDate || '',
    totalOrders: parseInt(row.TotalOrders) || 0,
    totalValue: parseFloat(row.TotalValue) || 0
  }));
}

export async function addClient(client) {
  // Check if client code already exists
  if (client.clientCode && await checkClientCodeExists(client.clientCode)) {
    throw new Error('Client code already exists. Please use a different client code.');
  }
  
  const row = {
    // Basic Information
    ClientName: client.clientName || '',
    ClientCode: client.clientCode || '',
    BusinessType: client.businessType || '',
    
    // Contact Information
    Address: client.address || '',
    City: client.city || '',
    State: client.state || '',
    StateCode: client.stateCode || '',
    Pincode: client.pincode || '',
    Country: client.country || 'India',
    
    // Business Details
    GSTIN: client.gstin || '',
    PANNumber: client.panNumber || '',
    AccountCode: client.accountCode || '',
    Website: client.website || '',
    
    // Contact Management
    Contacts: JSON.stringify(client.contacts || []),
    
    // Business Terms
    PaymentTerms: client.paymentTerms || '',
    CreditLimit: client.creditLimit || '',
    CreditPeriod: client.creditPeriod || '',
    DeliveryTerms: client.deliveryTerms || '',
    
    // Product Information
    Products: JSON.stringify(client.products || []),
    
    // Additional Information
    Notes: client.notes || '',
    Status: client.status || 'Active',
    Rating: client.rating || 0,
    LastContactDate: client.lastContactDate || '',
    TotalOrders: client.totalOrders || 0,
    TotalValue: client.totalValue || 0
  };
  await sheetService.appendRow(config.sheets.prospectsClients, row);
}

export async function updateClient(client, originalClientCode = null) {
  // Check if the new client code already exists (and it's not the same as the original)
  if (client.clientCode && originalClientCode && client.clientCode !== originalClientCode) {
    if (await checkClientCodeExists(client.clientCode)) {
      throw new Error('Client code already exists. Please use a different client code.');
    }
  }
  
  // Find the row index by original client code (if provided) or current client code
  const data = await sheetService.getSheetData(config.sheets.prospectsClients);
  const searchCode = originalClientCode || client.clientCode;
  const idx = data.findIndex(row => row.ClientCode === searchCode);
  if (idx === -1) throw new Error('Client not found');
  const row = {
    // Basic Information
    ClientName: client.clientName || '',
    ClientCode: client.clientCode || '',
    BusinessType: client.businessType || '',
    
    // Contact Information
    Address: client.address || '',
    City: client.city || '',
    State: client.state || '',
    StateCode: client.stateCode || '',
    Pincode: client.pincode || '',
    Country: client.country || 'India',
    
    // Business Details
    GSTIN: client.gstin || '',
    PANNumber: client.panNumber || '',
    AccountCode: client.accountCode || '',
    Website: client.website || '',
    
    // Contact Management
    Contacts: JSON.stringify(client.contacts || []),
    
    // Business Terms
    PaymentTerms: client.paymentTerms || '',
    CreditLimit: client.creditLimit || '',
    CreditPeriod: client.creditPeriod || '',
    DeliveryTerms: client.deliveryTerms || '',
    
    // Product Information
    Products: JSON.stringify(client.products || []),
    
    // Additional Information
    Notes: client.notes || '',
    Status: client.status || 'Active',
    Rating: client.rating || 0,
    LastContactDate: client.lastContactDate || '',
    TotalOrders: client.totalOrders || 0,
    TotalValue: client.totalValue || 0
  };
  // Row index in sheet = idx + 2 (header + 1-based)
  await sheetService.updateRow(config.sheets.prospectsClients, idx + 2, row);
}

export async function deleteClient(clientCode) {
  // Find the row index by clientCode
  const data = await sheetService.getSheetData(config.sheets.prospectsClients);
  const idx = data.findIndex(row => row.ClientCode === clientCode);
  if (idx === -1) throw new Error('Client not found');
  
  // Delete the row from the sheet
  await sheetService.deleteRow(config.sheets.prospectsClients, idx + 2); // +2 because of header row and 1-based indexing
}

