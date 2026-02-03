import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Alert,
  Paper,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import whatsappMessageService from '../../services/whatsappMessageService';
import whatsappLogService from '../../services/whatsappLogService';

const WhatsAppModal = ({ open, onClose, task, stageName, status, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToInternal, setSendToInternal] = useState(false);
  const [customNumber, setCustomNumber] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && task) {
      initializeModal();
    }
  }, [open, task, stageName, status]);

  const initializeModal = async () => {
    try {
      setLoading(true);
      setError('');

      // Generate default message - always generate even if task is incomplete
      let defaultMessage = '';
      try {
        defaultMessage = whatsappMessageService.generateMessage(
          task || {},
          stageName || 'STORE1',
          status || 'NEW'
        );
      } catch (msgErr) {
        console.error('Error generating message:', msgErr);
        // Fallback message
        defaultMessage = `Hello,

Your order status has been updated.
Current Status: ${status || 'Updated'}
Next step: Processing

Thank you,
Reyansh Industries`;
      }
      setMessage(defaultMessage);

      // Load client contacts - don't fail if this doesn't work
      let clientContacts = [];
      try {
        const clientCode = task?.ClientCode || task?.clientCode;
        if (clientCode) {
          clientContacts = await whatsappMessageService.getClientContacts(clientCode);
        }
      } catch (contactErr) {
        console.warn('Could not load client contacts:', contactErr);
        // Continue without contacts - user can add manually
      }

      // Initialize recipients
      const initialRecipients = [];
      
      // Add primary customer contact if available
      if (clientContacts.length > 0) {
        const primaryContact = clientContacts.find(c => c.isPrimary) || clientContacts[0];
        if (primaryContact && primaryContact.phone) {
          initialRecipients.push({
            name: primaryContact.name || task?.ClientName || 'Customer',
            phone: primaryContact.phone,
            type: 'customer',
            isEditable: false
          });
        }
      }

      setRecipients(initialRecipients);
      setSendToCustomer(initialRecipients.length > 0);
    } catch (err) {
      console.error('Error initializing WhatsApp modal:', err);
      // Set a basic message even on error
      if (!message) {
        setMessage(`Hello,

Your order status has been updated.
Thank you,
Reyansh Industries`);
      }
      setError('Some contact information could not be loaded. You can still add recipients manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = () => {
    if (!customNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
    if (!phoneRegex.test(customNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return;
    }

    const newRecipient = {
      name: customName.trim() || 'Contact',
      phone: customNumber.trim(),
      type: 'custom',
      isEditable: true
    };

    setRecipients([...recipients, newRecipient]);
    setCustomNumber('');
    setCustomName('');
    setError('');
  };

  const handleRemoveRecipient = (index) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
  };

  const handleAddCustomerContact = async () => {
    try {
      const clientContacts = await whatsappMessageService.getClientContacts(
        task.ClientCode || task.clientCode
      );

      clientContacts.forEach(contact => {
        if (contact.phone && !recipients.find(r => r.phone === contact.phone)) {
          setRecipients(prev => [...prev, {
            name: contact.name || 'Customer Contact',
            phone: contact.phone,
            type: 'customer',
            isEditable: false
          }]);
        }
      });
    } catch (err) {
      setError('Failed to load customer contacts');
    }
  };

  const handleSendToRecipient = async (recipient) => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      // Open WhatsApp
      whatsappMessageService.openWhatsApp(recipient.phone, message);

      // Log the message draft
      await whatsappLogService.logMessageDraft(
        task.POId || task.DispatchUniqueId || task.orderId,
        task.ClientCode || task.clientCode,
        stageName,
        status,
        message,
        recipients,
        true // Message sent
      );

      if (onMessageSent) {
        onMessageSent(recipient, message);
      }
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      setError('Failed to open WhatsApp. Please check the phone number.');
    }
  };

  const handleSendAll = async () => {
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      // Open WhatsApp for each recipient
      recipients.forEach(recipient => {
        whatsappMessageService.openWhatsApp(recipient.phone, message);
      });

      // Log the message draft
      await whatsappLogService.logMessageDraft(
        task.POId || task.DispatchUniqueId || task.orderId,
        task.ClientCode || task.clientCode,
        stageName,
        status,
        message,
        recipients,
        true // Message sent
      );

      if (onMessageSent) {
        onMessageSent(recipients, message);
      }

      // Show success and close after a delay
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      console.error('Error sending WhatsApp messages:', err);
      setError('Failed to open WhatsApp for some recipients');
    }
  };

  const handleClose = () => {
    setMessage('');
    setRecipients([]);
    setCustomNumber('');
    setCustomName('');
    setError('');
    setSendToCustomer(true);
    setSendToInternal(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 4
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <WhatsAppIcon sx={{ color: '#25D366', fontSize: 28 }} />
            <Typography variant="h6">Send WhatsApp Update</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Order: {task?.POId || task?.DispatchUniqueId || 'N/A'} | 
          Stage: {stageName} | 
          Status: {status}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Message Editor */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Message (Editable)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your WhatsApp message will appear here..."
            variant="outlined"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            You can edit this message before sending
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Recipients Section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Recipients
          </Typography>

          {/* Recipient List */}
          {recipients.length > 0 && (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {recipients.map((recipient, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: recipient.type === 'customer' ? 'action.hover' : 'background.paper'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                    <PersonIcon color="action" />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {recipient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recipient.phone}
                      </Typography>
                    </Box>
                    <Chip
                      label={recipient.type === 'customer' ? 'Customer' : 'Custom'}
                      size="small"
                      color={recipient.type === 'customer' ? 'primary' : 'default'}
                    />
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<WhatsAppIcon />}
                      onClick={() => handleSendToRecipient(recipient)}
                      sx={{ textTransform: 'none' }}
                    >
                      Send
                    </Button>
                    {recipient.isEditable && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRecipient(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Add Recipient Form */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add Recipient
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name (Optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  size="small"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRecipient}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Add Recipient
            </Button>
          </Paper>

          {/* Quick Actions */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToCustomer}
                  onChange={(e) => {
                    setSendToCustomer(e.target.checked);
                    if (e.target.checked) {
                      handleAddCustomerContact();
                    }
                  }}
                />
              }
              label="Send to Customer"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToInternal}
                  onChange={(e) => setSendToInternal(e.target.checked)}
                />
              }
              label="Send to Internal Team Member"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSendAll}
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          disabled={recipients.length === 0 || !message.trim()}
          sx={{ textTransform: 'none' }}
        >
          Send to All ({recipients.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppModal;
