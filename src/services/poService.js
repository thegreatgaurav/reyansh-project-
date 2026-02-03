import sheetService from './sheetService';
import config from '../config/config';
import { getCurrentUser } from '../utils/authUtils';

class POService {
  // Get all POs
  async getAllPOs(forceRefresh = false) {
    try {
      return await sheetService.getSheetData(config.sheets.poMaster, forceRefresh);
    } catch (error) {
      console.error('Error fetching POs:', error);
      throw error;
    }
  }
  
  // Get PO by ID
  async getPOById(poId) {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);
      return pos.find(po => po.POId === poId) || null;
    } catch (error) {
      console.error(`Error fetching PO with ID ${poId}:`, error);
      throw error;
    }
  }
  
  // Create a new PO
  async createPO(poData) {
    try {
      const currentUser = getCurrentUser();
      const now = new Date().toISOString();

      // For each item, add a row to PO_Master
      if (Array.isArray(poData.items)) {
        for (const item of poData.items) {
          const newPO = {
            UniqueId: item.uniqueId || '', // Unique ID for each item
            SOId: item.soId || poData.name, // Sales Order ID (same for all items in same SO)
            POId: poData.name, // PO Number from form
            Name: item.itemName, // Item Name
            PODocumentId: poData.poDocumentId || '', // Use the same doc for all items
            ClientCode: poData.clientCode,
            OrderType: item.orderType,
            ProductCode: item.productCode,
            Description: item.productDesc,
            Quantity: item.qty,
            BatchSize: item.batchSize,
            Price: item.price || '', // Price per unit
            Status: config.statusCodes.NEW,
            CreatedBy: currentUser.email,
            CreatedAt: now,
            UpdatedAt: now,
            AssignedTo: poData.assignedTo || '',
            DueDate: ''
          };
          await sheetService.appendRow(config.sheets.poMaster, newPO);
          await sheetService.logAction(
            poData.name,
            '',
            config.statusCodes.NEW,
            currentUser.email
          );
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error creating PO:', error);
      throw error;
    }
  }
  
  // Update a PO by UniqueId (for individual items within a sales order)
  async updatePOByUniqueId(uniqueId, poData) {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);

      const poIndex = pos.findIndex(po => po.UniqueId === uniqueId);
      if (poIndex === -1) {
        console.error(`PO with UniqueId ${uniqueId} not found in the following POs:`, pos.map(p => p.UniqueId));
        throw new Error(`PO with UniqueId ${uniqueId} not found`);
      }
      
      const currentUser = getCurrentUser();
      const oldStatus = pos[poIndex].Status;
      // Prepare updated PO data
      const updatedPO = {
        ...pos[poIndex],
        ...poData,
        UpdatedAt: new Date().toISOString()
      };
      // Update in PO Master sheet (row index is poIndex + 2 because of headers and 0-indexing)
      const updateResult = await sheetService.updateRow(config.sheets.poMaster, poIndex + 2, updatedPO);
      // Log the action if status has changed
      if (poData.Status && poData.Status !== oldStatus) {
        await sheetService.logAction(
          pos[poIndex].POId, // Use POId for logging (sales order level)
          oldStatus,
          poData.Status,
          currentUser.email
        );
      }
      return updatedPO;
    } catch (error) {
      console.error(`Error updating PO with UniqueId ${uniqueId}:`, error);
      console.error(`Error details:`, error.message);
      console.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  // Update a PO
  async updatePO(poId, poData) {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);

      const poIndex = pos.findIndex(po => po.POId === poId);
      if (poIndex === -1) {
        console.error(`PO with ID ${poId} not found in the following POs:`, pos.map(p => p.POId));
        throw new Error(`PO with ID ${poId} not found`);
      }
      
      const currentUser = getCurrentUser();
      const oldStatus = pos[poIndex].Status;
      // Prepare updated PO data
      const updatedPO = {
        ...pos[poIndex],
        ...poData,
        UpdatedAt: new Date().toISOString()
      };
      // Update in PO Master sheet (row index is poIndex + 2 because of headers and 0-indexing)
      const updateResult = await sheetService.updateRow(config.sheets.poMaster, poIndex + 2, updatedPO);
      // Log the action if status has changed
      if (poData.Status && poData.Status !== oldStatus) {
        await sheetService.logAction(
          poId,
          oldStatus,
          poData.Status,
          currentUser.email
        );
      }
      return updatedPO;
    } catch (error) {
      console.error(`Error updating PO with ID ${poId}:`, error);
      console.error(`Error details:`, error.message);
      console.error(`Error stack:`, error.stack);
      throw error;
    }
  }
  
  // Get BOM for a PO
  async getBOM(poId, bomType = 'BOM1') {
    try {
      const po = await this.getPOById(poId);
      
      if (!po) {
        throw new Error(`PO with ID ${poId} not found`);
      }
      
      // Get BOM templates
      const bomTemplates = await sheetService.getSheetData(config.sheets.bomTemplates);
      
      // Find the template for this product
      const template = bomTemplates.find(t => 
        t.ProductCode === po.ProductCode && 
        t.BOMType === bomType
      );
      
      if (!template) {
        throw new Error(`BOM template for product ${po.ProductCode} and type ${bomType} not found`);
      }
      
      // TODO: In a real implementation, this would calculate BOM based on
      // template, inventory levels, and batch size
      // For now, we'll just return the template with calculated quantities
      const bom = {
        POId: poId,
        ProductCode: po.ProductCode,
        BOMType: bomType,
        Materials: JSON.parse(template.Materials || '[]').map(material => ({
          ...material,
          RequiredQuantity: material.QuantityPerUnit * po.Quantity
        }))
      };
      
      return bom;
    } catch (error) {
      console.error(`Error fetching BOM for PO ${poId}:`, error);
      throw error;
    }
  }
  
  // Upload PO document and update PO with document ID
  async uploadPODocument(poId, file) {
    try {
      // Upload document to Google Drive or localStorage based on config
      const documentId = await sheetService.uploadFile(file);
      
      // Update PO with document ID
      await this.updatePO(poId, { PODocumentId: documentId });
      
      return documentId;
    } catch (error) {
      console.error(`Error uploading document for PO ${poId}:`, error);
      throw error;
    }
  }

  // Get PO document details by PO ID
  async getPODocument(poId) {
    try {
      // Get PO details to retrieve document ID
      const po = await this.getPOById(poId);
      
      if (!po.PODocumentId) {
        throw new Error(`No document attached to PO ${poId}`);
      }
      
      // Get document details from Google Drive or localStorage
      const documentDetails = await sheetService.getFileById(po.PODocumentId);
      
      return documentDetails;
    } catch (error) {
      console.error(`Error fetching document for PO ${poId}:`, error);
      throw error;
    }
  }

  // Delete a PO (deletes all items belonging to the sales order)
  async deletePO(poId) {
    try {
      const pos = await sheetService.getSheetData(config.sheets.poMaster);
      // Log all PO IDs for debugging

      // Find all rows that match the POId (a sales order can have multiple items)
      const matchingRows = pos
        .map((po, index) => ({ po, index }))
        .filter(({ po }) => po.POId === poId);
      if (matchingRows.length === 0) {
        console.error(`PO with ID ${poId} not found in database. Available PO IDs:`, pos.map(p => p.POId).filter(id => id));
        
        // Try to find by SOId as a fallback
        const soIdMatchingRows = pos
          .map((po, index) => ({ po, index }))
          .filter(({ po }) => po.SOId === poId);
        
        if (soIdMatchingRows.length > 0) {
          const sortedRows = soIdMatchingRows.sort((a, b) => b.index - a.index);
          
          for (const { index } of sortedRows) {
            const rowIndex = index + 2; // +2 because of headers and 0-indexing
            
            await sheetService.deleteRow(config.sheets.poMaster, rowIndex);
          }

          return { success: true, deletedRows: soIdMatchingRows.length };
        }
        
        throw new Error(`PO with ID ${poId} not found (also checked SOId)`);
      }
      
      // Delete rows in reverse order to maintain correct indices
      const sortedRows = matchingRows.sort((a, b) => b.index - a.index);
      
      for (const { index } of sortedRows) {
        const rowIndex = index + 2; // +2 because of headers and 0-indexing
        
        await sheetService.deleteRow(config.sheets.poMaster, rowIndex);
      }
      return { success: true, deletedRows: matchingRows.length };
    } catch (error) {
      console.error(`Error deleting PO with ID ${poId}:`, error);
      throw error;
    }
  }
}

export default new POService(); 