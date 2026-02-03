import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, Paper, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Check, Error, Refresh, Add } from '@mui/icons-material';
import axios from 'axios';
import config from '../../config/config';

const SheetInitializer = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);

  // Sheet definitions with their headers
  const sheetDefinitions = {
    [config.sheets.poMaster]: [
      'POId', 'Name', 'ClientCode', 'OrderType', 'ProductCode', 'Description', 
      'Quantity', 'BatchSize', 'Price', 'Status', 'CreatedAt', 'UpdatedAt', 'CreatedBy', 
      'AssignedTo', 'DueDate', 'PODocumentId'
    ],
    [config.sheets.bomTemplates]: [
      'TemplateId', 'ProductCode', 'BOMType', 'Description', 'Materials', 'CreatedAt'
    ],
    [config.sheets.inventory]: [
      'MaterialId', 'Name', 'Category', 'UnitOfMeasure', 'QuantityAvailable',
      'ReorderLevel', 'LastUpdated'
    ],
    [config.sheets.users]: [
      'UserId', 'Name', 'Email', 'Role', 'Department', 'LastLogin'
    ],
    [config.sheets.auditLog]: [
      'LogId', 'POId', 'PreviousStatus', 'NewStatus', 'UserId', 'Timestamp'
    ],
    [config.sheets.metrics]: [
      'MetricId', 'MetricName', 'MetricValue', 'DateRecorded', 'Category'
    ],
    // Add CLIENT sheet definition
    CLIENT: [
      'ClientCode', 'ClientName', 'Address', 'Contacts', 'Products', 'CreatedAt', 'UpdatedAt'
    ],
    // Add PRODUCT sheet definition
    PRODUCT: [
      'ProductCode', 'ProductName', 'Description', 'AssemblyLineManpower', 'CableCuttingManpower', 'MoldingMachineManpower', 'PackingLineManpower', 'SingleShiftTarget', 'BasePrice',
      'Drawing', 'FPA', 'PDI', 'ProcessChecksheet', 'PackagingStandard', 'BOM', 'SOP', 'PFC',
      'CreatedAt', 'UpdatedAt'
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
      'MOQ',
      'Lead Time (Days)',
      'Last Purchase Rate (b9)',
      'Rate Validity',
      'Payment Terms',
      'Remarks',
    ],
    PlacePO: [
      'POId',
      'IndentNumber',
      'ItemName',
      'Specifications',
      'VendorCode',
      'Price',
      'DeliveryTime',
      'Terms',
      'LeadTime',
      'VendorName',
      'VendorContact',
      'VendorEmail',
      'PlacedAt',
      'PODocumentId',
    ],
  };

  // Function to check if a sheet exists and create it if not
  const initializeSheet = async (sheetName, headers) => {
    try {
      // Check if the sheet exists by trying to get its headers
      const response = await axios.get(
        `${config.endpoints.base}/${config.spreadsheetId}/values/${sheetName}!1:1?key=${config.apiKey}`
      );

      if (response.status === 200) {
        // Sheet exists - check if headers match what we expect
        const existingHeaders = response.data.values?.[0] || [];
        
        if (existingHeaders.length === 0) {
          // Sheet exists but is empty - add headers
          // Use OAuth token if available, otherwise use API key
          const accessToken = localStorage.getItem('accessToken');
          const requestHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
          const url = accessToken 
            ? `${config.endpoints.base}/${config.spreadsheetId}/values/${sheetName}!1:1?valueInputOption=RAW`
            : `${config.endpoints.base}/${config.spreadsheetId}/values/${sheetName}!1:1?valueInputOption=RAW&key=${config.apiKey}`;
          
          await axios.put(url, {
            values: [headers]
          }, { headers: requestHeaders });
          
          return { status: 'created', message: `Added headers to existing sheet ${sheetName}` };
        } else {
          // Sheet exists with headers - check if they match
          const missingHeaders = headers.filter(h => !existingHeaders.includes(h));
          if (missingHeaders.length > 0) {
            return { status: 'warning', message: `Sheet ${sheetName} exists but is missing headers: ${missingHeaders.join(', ')}` };
          }
          return { status: 'exists', message: `Sheet ${sheetName} already exists with correct headers` };
        }
      }
      
      return { status: 'error', message: `Could not verify sheet ${sheetName}` };
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.error.message.includes('Unable to parse range')) {
        // Sheet doesn't exist - need to create it
        try {
          // Create the sheet using the Google Sheets API
          // This requires a different approach - we need to use the spreadsheets.batchUpdate method
          // which isn't accessible just with an API key, so we'll return an error
          return { 
            status: 'error', 
            message: `Sheet ${sheetName} doesn't exist. Please create the sheet manually in Google Sheets.` 
          };
        } catch (createError) {
          return { status: 'error', message: `Failed to create sheet ${sheetName}: ${createError.message}` };
        }
      } else if (error.response && error.response.status === 401) {
        // Unauthorized - OAuth token might be required
        return { 
          status: 'error', 
          message: `Unauthorized access to sheet ${sheetName}. Please ensure you have proper authentication.` 
        };
      } else {
        return { 
          status: 'error', 
          message: `Error checking sheet ${sheetName}: ${error.response?.data?.error?.message || error.message}` 
        };
      }
    }
  };

  // Initialize all defined sheets
  const initializeAllSheets = async () => {
    setStatus('loading');
    setResults({});
    setError(null);
    
    try {
      const results = {};
      
      for (const [sheetName, headers] of Object.entries(sheetDefinitions)) {
        const result = await initializeSheet(sheetName, headers);
        results[sheetName] = result;
      }
      
      setResults(results);
      setStatus('success');
    } catch (error) {
      setError(error.message || 'Failed to initialize sheets');
      setStatus('error');
    }
  };

  // Run initialization on component mount
  useEffect(() => {
    initializeAllSheets();
  }, []);

  // Get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'exists':
      case 'created':
        return <Check color="success" />;
      case 'warning':
        return <Refresh color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  // Function to attempt to create a sheet
  const attemptCreateSheet = async (sheetName) => {
    setSelectedSheet(sheetName);
    setOpenDialog(true);
  };

  // Function to create a sheet using the Sheets API
  const createSheet = async () => {
    try {
      // First, try to check if we can get access to the spreadsheet
      const checkResponse = await axios.get(
        `${config.endpoints.base}/${config.spreadsheetId}?key=${config.apiKey}`
      );
      
      if (checkResponse.status !== 200) {
        throw new Error('Cannot access spreadsheet. Check permissions and API key.');
      }
      
      // Create a new sheet using batchUpdate - this requires a POST request
      const createResponse = await axios.post(
        `${config.endpoints.base}/${config.spreadsheetId}:batchUpdate?key=${config.apiKey}`,
        {
          requests: [
            {
              addSheet: {
                properties: {
                  title: selectedSheet
                }
              }
            }
          ]
        }
      );
      
      if (createResponse.status === 200) {
        // Sheet created successfully - now add headers
        const headers = sheetDefinitions[selectedSheet];
        await axios.put(
          `${config.endpoints.base}/${config.spreadsheetId}/values/${selectedSheet}!1:1?valueInputOption=RAW&key=${config.apiKey}`,
          {
            values: [headers]
          }
        );
        
        // Refresh the sheet list
        await initializeAllSheets();
        setOpenDialog(false);
      }
    } catch (error) {
      console.error(`Error creating sheet ${selectedSheet}:`, error);
      alert(`Failed to create sheet ${selectedSheet}. Please create it manually in Google Sheets.\n\nError: ${error.response?.data?.error?.message || error.message}`);
      setOpenDialog(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Google Sheets Structure Initializer
      </Typography>
      
      {status === 'loading' && (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Checking and initializing Google Sheets structure...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
        </>
      )}
      
      {status === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {status === 'success' && Object.keys(results).length > 0 && (
        <List>
          {Object.entries(results).map(([sheetName, result]) => (
            <ListItem key={sheetName}>
              <ListItemIcon>
                {getStatusIcon(result.status)}
              </ListItemIcon>
              <ListItemText 
                primary={sheetName} 
                secondary={result.message}
                secondaryTypographyProps={{
                  color: result.status === 'error' ? 'error' : 'textSecondary'
                }}
              />
              {result.status === 'error' && result.message.includes('doesn\'t exist') && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Add />}
                  onClick={() => attemptCreateSheet(sheetName)}
                >
                  Create
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={initializeAllSheets} 
          disabled={status === 'loading'}
          startIcon={<Refresh />}
        >
          {status === 'loading' ? 'Checking...' : 'Refresh Sheet Structure'}
        </Button>
        
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          This tool checks if all required sheets exist in your Google Spreadsheet and verifies they 
          have the correct headers. If a sheet is missing, you'll need to create it manually 
          in Google Sheets and then refresh.
        </Typography>
      </Box>
      
      {/* Dialog for sheet creation confirmation */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Create Sheet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to attempt to create the sheet "{selectedSheet}" automatically? 
            This requires write access to the spreadsheet.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={createSheet} variant="contained">Create Sheet</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SheetInitializer; 