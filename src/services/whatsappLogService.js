/**
 * WhatsApp Message Logging Service
 * Stores message drafts and usage logs internally
 * NO delivery tracking - only logs when WhatsApp button was used
 */

import sheetService from './sheetService';
import { getCurrentUser } from '../utils/authUtils';

class WhatsAppLogService {
  constructor() {
    this.sheetName = 'WhatsApp Message Logs';
  }

  /**
   * Initialize the logs sheet (create if doesn't exist)
   */
  async initializeSheet() {
    try {
      // Try to get headers to check if sheet exists
      await sheetService.getSheetHeaders(this.sheetName);
    } catch (error) {
      // Sheet doesn't exist, create it
      const headers = [
        'Timestamp',
        'OrderID',
        'ClientCode',
        'WorkflowStage',
        'Status',
        'MessageDraft',
        'Recipients',
        'UserEmail',
        'MessageSent' // 'Yes' or 'No' - indicates if user clicked send
      ];
      
      // Note: This assumes sheetService has a method to create sheets
      // If not available, the sheet should be created manually in Google Sheets
      console.log('WhatsApp Logs sheet headers:', headers);
    }
  }

  /**
   * Log a WhatsApp message draft
   */
  async logMessageDraft(orderId, clientCode, workflowStage, status, messageDraft, recipients, messageSent = false) {
    try {
      await this.initializeSheet();
      
      const currentUser = getCurrentUser();
      const timestamp = new Date().toISOString();
      
      const logEntry = {
        Timestamp: timestamp,
        OrderID: orderId || '',
        ClientCode: clientCode || '',
        WorkflowStage: workflowStage || '',
        Status: status || '',
        MessageDraft: messageDraft || '',
        Recipients: JSON.stringify(recipients || []),
        UserEmail: currentUser?.email || 'Unknown',
        MessageSent: messageSent ? 'Yes' : 'No'
      };
      
      await sheetService.appendRow(this.sheetName, logEntry);
      
      return logEntry;
    } catch (error) {
      console.error('Error logging WhatsApp message draft:', error);
      // Don't throw - logging is non-critical
      return null;
    }
  }

  /**
   * Get message logs for an order
   */
  async getOrderLogs(orderId) {
    try {
      await this.initializeSheet();
      
      const logs = await sheetService.getSheetData(this.sheetName);
      return logs.filter(log => log.OrderID === orderId);
    } catch (error) {
      console.error('Error fetching order logs:', error);
      return [];
    }
  }

  /**
   * Get message logs for a client
   */
  async getClientLogs(clientCode) {
    try {
      await this.initializeSheet();
      
      const logs = await sheetService.getSheetData(this.sheetName);
      return logs.filter(log => 
        log.ClientCode === clientCode || 
        log.ClientCode?.toLowerCase() === clientCode?.toLowerCase()
      );
    } catch (error) {
      console.error('Error fetching client logs:', error);
      return [];
    }
  }

  /**
   * Get recent message logs
   */
  async getRecentLogs(limit = 50) {
    try {
      await this.initializeSheet();
      
      const logs = await sheetService.getSheetData(this.sheetName);
      // Sort by timestamp descending and limit
      return logs
        .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  }
}

export default new WhatsAppLogService();
