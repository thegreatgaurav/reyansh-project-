import sheetService from './sheetService';
import config from '../config/config';

// Generate unique client code sequentially (C + 5 digits, e.g., C00001)
export async function generateSequentialClientCode() {
  const data = await sheetService.getSheetData(config.sheets.clients).catch(async () => {
    return await sheetService.getSheetData('CLIENT');
  });
  const max = data.reduce((acc, row) => {
    const code = row.ClientCode || '';
    const match = code.match(/^C(\d{5})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > acc ? num : acc;
    }
    return acc;
  }, 0);
  const next = (max + 1).toString().padStart(5, '0');
  return `C${next}`;
}

function parseClientRow(row, header) {
  const obj = {};
  header.forEach((h, i) => {
    obj[h] = row[i] || '';
  });
  obj.contacts = obj.Contacts ? JSON.parse(obj.Contacts) : [];
  obj.products = obj.Products ? JSON.parse(obj.Products) : [];
  // Normalize keys for frontend
  obj.clientName = obj.ClientName;
  obj.clientCode = obj.ClientCode;
  obj.address = obj.Address;
  return obj;
}

export async function checkClientCodeExists(clientCode) {
  const data = await sheetService.getSheetData(config.sheets.clients);
  return data.some(row => row.ClientCode === clientCode);
}

export async function getAllClients(forceRefresh = false) {
  const data = await sheetService.getSheetData(config.sheets.clients, forceRefresh).catch(async () => {
    // Fallback to legacy sheet name if needed
    return await sheetService.getSheetData('CLIENT', forceRefresh);
  });
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
  await sheetService.appendRow(config.sheets.clients, row);
}

export async function updateClient(client, originalClientCode = null) {
  // Check if the new client code already exists (and it's not the same as the original)
  if (client.clientCode && originalClientCode && client.clientCode !== originalClientCode) {
    if (await checkClientCodeExists(client.clientCode)) {
      throw new Error('Client code already exists. Please use a different client code.');
    }
  }
  
  // Find the row index by original client code (if provided) or current client code
  const data = await sheetService.getSheetData(config.sheets.clients);
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
  // Debug: Log the client data being updated

  // Row index in sheet = idx + 2 (header + 1-based)
  await sheetService.updateRow(config.sheets.clients, idx + 2, row);
}

export async function deleteClient(clientCode) {
  // Find the row index by clientCode
  const data = await sheetService.getSheetData(config.sheets.clients);
  const idx = data.findIndex(row => row.ClientCode === clientCode);
  if (idx === -1) throw new Error('Client not found');
  
  // Delete the row from the sheet
  await sheetService.deleteRow(config.sheets.clients, idx + 2); // +2 because of header row and 1-based indexing
}

// Get all unique products from all clients
export async function getAllProductsFromClients(forceRefresh = false) {
  try {
    const clients = await getAllClients(forceRefresh);
    const productMap = new Map(); // Use Map to ensure uniqueness by productCode
    
    for (const client of clients) {

      if (client.products && Array.isArray(client.products)) {
        client.products.forEach((product, index) => {
          if (product.productCode) {
            // If product code already exists, keep the first occurrence
            if (!productMap.has(product.productCode)) {
              productMap.set(product.productCode, {
                productCode: product.productCode,
                productName: product.productName || '',
                category: product.category || '',
                description: product.description || '',
                // Technical specifications
                conductorSize: product.conductorSize || '',
                strandCount: product.strandCount || '',
                numberOfCore: product.numberOfCore || '',
                coreColors: product.coreColors || [],
                // Also include the colour field directly
                colour: product.colour || '',
                coreOD: product.coreOD || '',
                corePVC: product.corePVC || '',
                sheathOD: product.sheathOD || '',
                sheathInnerPVC: product.sheathInnerPVC || '',
                sheathOuterPVC: product.sheathOuterPVC || '',
                printingMaterial: product.printingMaterial || '',
                totalLength: product.totalLength || '',
                colour: product.colour || '',
                // Stock-related fields
                currentStock: product.currentStock || '',
                minLevel: product.minLevel || '',
                maxLevel: product.maxLevel || '',
                reorderPoint: product.reorderPoint || '',
                unit: product.unit || '',
                location: product.location || '',
                lastUpdated: product.lastUpdated || '',
                status: product.status || 'Active',
                clientCode: client.clientCode,
                clientName: client.clientName,
                // Store reference to client for traceability
                sourceClient: {
                  clientCode: client.clientCode,
                  clientName: client.clientName
                }
              });
            } else {
            }
          } else {
          }
        });
      } else {
      }
    }
    
    // Convert Map to array and sort by product code
    const result = Array.from(productMap.values()).sort((a, b) => 
      a.productCode.localeCompare(b.productCode)
    );

    return result;
  } catch (error) {
    console.error('=== GET ALL PRODUCTS FROM CLIENTS ERROR ===');
    console.error('Error getting products from clients:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Create a new client from sales flow data
export async function createClientFromSalesFlow(salesFlowData, leadDetails) {
  try {
    // Generate unique client code sequentially
    const clientCode = await generateSequentialClientCode();
    
    // Extract contact information from lead details
    const contacts = [];
    if (leadDetails?.ContactPerson) {
      contacts.push({
        name: leadDetails.ContactPerson,
        email: leadDetails.EmailId || salesFlowData.Email,
        number: leadDetails.MobileNumber || salesFlowData.PhoneNumber,
        department: leadDetails.Department || 'General'
      });
    }
    
    // Extract products interested
    const products = [];
    if (leadDetails?.ProductsInterested) {
      try {
        const productsInterested = typeof leadDetails.ProductsInterested === 'string' 
          ? JSON.parse(leadDetails.ProductsInterested) 
          : leadDetails.ProductsInterested;
        
        if (Array.isArray(productsInterested)) {
          productsInterested.forEach(product => {
            // Handle both object format and string format
            if (typeof product === 'object' && (product.productCode || product.ProductCode)) {
              products.push({
                productCode: product.productCode || product.ProductCode
              });
            } else if (typeof product === 'string') {
              products.push({
                productCode: product
              });
            }
          });
        }
      } catch (err) {
        console.error('Error parsing products interested:', err);
      }
    }
    
    // Create client object
    const client = {
      clientName: leadDetails?.CompanyName || salesFlowData.CompanyName || salesFlowData.FullName,
      clientCode: clientCode,
      address: leadDetails?.CustomerLocation || salesFlowData.CustomerLocation || '',
      contacts: contacts,
      products: products
    };
    
    // Add to CLIENT sheet
    await addClient(client);
    
    return {
      success: true,
      client: client,
      message: 'Client created successfully'
    };
  } catch (error) {
    console.error('Error creating client from sales flow:', error);
    throw error;
  }
}
