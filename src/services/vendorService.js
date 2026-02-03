import sheetService from './sheetService';

const VENDOR_SHEET = 'Vendor';
const HEADERS = [
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
];

// Function to map new form data to old Google Sheets format
const mapFormDataToSheets = (formData) => {
  const primaryContact = formData.contacts?.[0] || {};
  const primaryProduct = formData.products?.[0] || {};
  
  return {
    'SKU Code': primaryProduct.skuCode || '',
    'SKU Description': primaryProduct.skuDescription || '',
    'Category': primaryProduct.category || formData.category || '',
    'UOM': primaryProduct.uom || '',
    'Vendor Name': formData.vendorName || '',
    'Alternate Vendors': primaryProduct.alternateVendors || '',
    'Vendor Code': formData.vendorCode || '',
    'Vendor Contact': primaryContact.name || '',
    'Vendor Email': primaryContact.email || '',
    'Address': formData.address || '',
    'State': formData.state || '',
    'State Code': formData.stateCode || '',
    'A/C Code': formData.accountCode || '',
    'GSTIN': formData.gstin || '',
    'PAN No.': formData.panNumber || '',
    'MOQ': primaryProduct.moq || '',
    'Lead Time (Days)': primaryProduct.leadTime || '',
    'Last Purchase Rate (₹)': primaryProduct.lastPurchaseRate || '',
    'Rate Validity': primaryProduct.rateValidity || '',
    'Payment Terms': formData.paymentTerms || '',
    'Remarks': formData.remarks || ''
  };
};

// Function to map Google Sheets data to new form format
const mapSheetsDataToForm = (sheetsData) => {
  return {
    vendorCode: sheetsData['Vendor Code'] || '',
    vendorName: sheetsData['Vendor Name'] || '',
    businessType: sheetsData['Business Type'] || '',
    industry: sheetsData['Industry'] || '',
    category: sheetsData['Category'] || '',
    address: sheetsData['Address'] || '',
    city: sheetsData['City'] || '',
    state: sheetsData['State'] || '',
    stateCode: sheetsData['State Code'] || '',
    pincode: sheetsData['Pincode'] || '',
    country: sheetsData['Country'] || 'India',
    gstin: sheetsData['GSTIN'] || '',
    panNumber: sheetsData['PAN No.'] || '',
    accountCode: sheetsData['A/C Code'] || '',
    website: sheetsData['Website'] || '',
    contacts: [{
      name: sheetsData['Vendor Contact'] || '',
      email: sheetsData['Vendor Email'] || '',
      phone: sheetsData['Vendor Contact'] || '',
      department: sheetsData['Department'] || '',
      designation: sheetsData['Designation'] || '',
      isPrimary: true
    }],
    products: [{
      skuCode: sheetsData['SKU Code'] || '',
      skuDescription: sheetsData['SKU Description'] || '',
      category: sheetsData['Category'] || '',
      uom: sheetsData['UOM'] || '',
      moq: sheetsData['MOQ'] || '',
      leadTime: sheetsData['Lead Time (Days)'] || '',
      lastPurchaseRate: sheetsData['Last Purchase Rate (₹)'] || '',
      rateValidity: sheetsData['Rate Validity'] || '',
      alternateVendors: sheetsData['Alternate Vendors'] || ''
    }],
    paymentTerms: sheetsData['Payment Terms'] || '',
    creditLimit: sheetsData['Credit Limit'] || '',
    creditPeriod: sheetsData['Credit Period'] || '',
    deliveryTerms: sheetsData['Delivery Terms'] || '',
    rating: parseFloat(sheetsData['Rating']) || 0,
    totalOrders: parseInt(sheetsData['Total Orders']) || 0,
    totalValue: parseFloat(sheetsData['Total Value']) || 0,
    onTimeDelivery: parseFloat(sheetsData['On-Time Delivery']) || 0,
    qualityScore: parseFloat(sheetsData['Quality Score']) || 0,
    remarks: sheetsData['Remarks'] || '',
    status: sheetsData['Status'] || 'Active',
    lastContactDate: sheetsData['Last Contact Date'] || '',
    registrationDate: sheetsData['Registration Date'] || new Date().toISOString().slice(0, 10)
  };
};

const vendorService = {
    async getVendors() {
        try {
          const rows = await sheetService.getSheetData(VENDOR_SHEET);
          if (!Array.isArray(rows) || rows.length === 0) return [];
      
          // Filter out rows without a Vendor Code and map to new format
          return rows
            .filter(row => !!row['Vendor Code'])
            .map(mapSheetsDataToForm);
        } catch (err) {
          console.error('Error in getVendors:', err);
          throw err;
        }
      },

  async addVendor(vendor) {
    if (Array.isArray(vendor)) {
      throw new Error('Vendor must be an object with header keys, not an array');
    }
    
    // Map the new form data to the old Google Sheets format
    const mappedVendor = mapFormDataToSheets(vendor);
    
    await sheetService.appendRow(VENDOR_SHEET, mappedVendor);
    return true;
  },

  async updateVendor(vendorCode, updatedVendor) {
    const data = await sheetService.getSheetData(VENDOR_SHEET);
    const updates = [];
  
    for (const [i, row] of data.entries()) {
      if (row['Vendor Code'] === vendorCode) {
        const rowIndex = i + 2;
        // Map the updated vendor data to the old Google Sheets format
        const mappedUpdatedVendor = mapFormDataToSheets(updatedVendor);
        const updatedRow = { ...row, ...mappedUpdatedVendor };
        updates.push(sheetService.updateRow(VENDOR_SHEET, rowIndex, updatedRow));
      }
    }
  
    if (updates.length === 0) {
      throw new Error('Vendor not found');
    }
  
    await Promise.all(updates);
    return true;
  },

  async deleteVendor(vendorCode) {
    const data = await sheetService.getSheetData(VENDOR_SHEET);
    
    const indicesToDelete = data
      .map((row, i) => row['Vendor Code'] === vendorCode ? i + 2 : null)
      .filter(idx => idx !== null)
      .sort((a, b) => b - a); // delete bottom-up
    
    if (indicesToDelete.length === 0) {
      throw new Error(`Vendor with code "${vendorCode}" not found`);
    }
  
    for (const rowIndex of indicesToDelete) {
      await sheetService.deleteRow(VENDOR_SHEET, rowIndex);
    }
  
    return true;
  }
  
};

export default vendorService; 