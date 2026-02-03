import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import config from '../../config/config';
import oauthConfig from '../../config/oauthConfig';
import sheetService from '../../services/sheetService';

const SheetsTroubleshooting = () => {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [sheetStatus, setSheetStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkTokenAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize and get access token
      await sheetService.init();
      
      if (sheetService.accessToken) {
        setTokenStatus({
          success: true,
          message: 'Successfully obtained OAuth access token.'
        });
      } else {
        setTokenStatus({
          success: false,
          message: 'Failed to obtain OAuth access token. Try signing out and signing back in.'
        });
      }
    } catch (error) {
      console.error('Error checking token access:', error);
      setTokenStatus({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSheetAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get values from a simple test range
      const reqHeaders = {
        Authorization: `Bearer ${sheetService.accessToken}`
      };
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/A1:A1`;
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: reqHeaders
      });
      
      if (response.ok) {
        setSheetStatus({
          success: true,
          message: 'Successfully accessed spreadsheet!'
        });
      } else {
        const errorData = await response.json();
        setSheetStatus({
          success: false,
          message: `Error accessing spreadsheet: ${errorData.error.message}`,
          details: errorData.error
        });
      }
    } catch (error) {
      console.error('Error checking sheet access:', error);
      setSheetStatus({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Google Sheets Troubleshooting
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Troubleshooting 401 Authentication Errors</AlertTitle>
        Use this page to diagnose issues with Google Sheets authentication.
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        Current Configuration
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Spreadsheet ID"
            value={config.spreadsheetId}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            label="Client ID"
            value={oauthConfig.clientId}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Scopes"
            value={Array.isArray(oauthConfig.scopes) ? oauthConfig.scopes.join(', ') : oauthConfig.scopes}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Authentication Tests
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={checkTokenAccess}
            startIcon={<SecurityIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Check OAuth Token'}
          </Button>
          
          <Button 
            variant="contained" 
            onClick={checkSheetAccess}
            startIcon={<StorageIcon />}
            disabled={loading || !sheetService.accessToken}
            color="secondary"
          >
            {loading ? <CircularProgress size={24} /> : 'Check Spreadsheet Access'}
          </Button>
        </Box>
        
        {tokenStatus && (
          <Alert severity={tokenStatus.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            <Typography variant="body2">{tokenStatus.message}</Typography>
          </Alert>
        )}
        
        {sheetStatus && (
          <Alert severity={sheetStatus.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            <Typography variant="body2">{sheetStatus.message}</Typography>
            {sheetStatus.details && (
              <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                {JSON.stringify(sheetStatus.details, null, 2)}
              </pre>
            )}
          </Alert>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Common Issues
      </Typography>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>401 Authentication Error</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            This happens when the OAuth token is not valid or has expired. Try:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Sign out and sign back in to refresh your token" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Make sure you're signed in with a Google account that has access to the spreadsheet" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Check that your OAuth client ID is correct in the Google Cloud Console" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>403 Permission Denied</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            This happens when your account doesn't have permission to access the spreadsheet. Try:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Share the spreadsheet with your Google account (with Editor permissions)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Make sure the Google Sheets API is enabled in your Google Cloud Console" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Verify the scopes in the OAuth consent screen include spreadsheets and drive.file" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>404 Spreadsheet Not Found</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            This happens when the spreadsheet ID is incorrect. Try:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Verify that the spreadsheet ID in config.js is correct" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Check that the spreadsheet hasn't been deleted" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Create a new spreadsheet if needed and update the ID in config.js" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default SheetsTroubleshooting; 