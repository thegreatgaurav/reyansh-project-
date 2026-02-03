import { GoogleSpreadsheet } from "google-spreadsheet";
import { GOOGLE_SHEETS_CONFIG } from "../config/googleSheets";

// Initialize the sheet
const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.spreadsheetId);

// Initialize auth - using public access since it's a public sheet
const initializeAuth = async () => {
  try {
    await doc.loadInfo();
  } catch (error) {
    console.error("Error initializing Google Sheets:", error);
    throw error;
  }
};

// Get sheet by title
const getSheet = async (title) => {
  try {
    await initializeAuth();
    return doc.sheetsByTitle[title];
  } catch (error) {
    console.error(`Error getting sheet ${title}:`, error);
    throw error;
  }
};

// Generic function to get all rows from a sheet
const getAllRows = async (sheetTitle) => {
  try {
    const sheet = await getSheet(sheetTitle);
    const rows = await sheet.getRows();
    return rows.map((row) => {
      const rowData = {};
      sheet.headerValues.forEach((header) => {
        rowData[header] = row[header];
      });
      return rowData;
    });
  } catch (error) {
    console.error(`Error getting rows from ${sheetTitle}:`, error);
    throw error;
  }
};

// Function to find stock item by itemCode
const findStockItem = async (itemCode) => {
  try {
    const stockSheet = await getSheet(GOOGLE_SHEETS_CONFIG.sheets.stock);
    const rows = await stockSheet.getRows();
    return rows.find((row) => row.itemCode === itemCode);
  } catch (error) {
    console.error(`Error finding stock item ${itemCode}:`, error);
    throw error;
  }
};

// Function to update stock quantity
const updateStockQuantity = async (itemCode, quantity, isInward = true) => {
  try {
    const stockItem = await findStockItem(itemCode);
    if (!stockItem) {
      throw new Error(`Stock item ${itemCode} not found`);
    }

    const currentStock = parseFloat(stockItem.currentStock) || 0;
    const newStock = isInward
      ? currentStock + parseFloat(quantity)
      : currentStock - parseFloat(quantity);

    stockItem.currentStock = newStock.toString();
    stockItem.lastUpdated = new Date().toISOString().split("T")[0];
    await stockItem.save();

    return true;
  } catch (error) {
    console.error(`Error updating stock quantity for ${itemCode}:`, error);
    throw error;
  }
};

// Generic function to add a row to a sheet
const addRow = async (sheetTitle, rowData) => {
  try {
    const sheet = await getSheet(sheetTitle);
    await sheet.addRow(rowData);
    return true;
  } catch (error) {
    console.error(`Error adding row to ${sheetTitle}:`, error);
    throw error;
  }
};

// Generic function to update a row in a sheet
const updateRow = async (sheetTitle, rowIndex, rowData) => {
  try {
    const sheet = await getSheet(sheetTitle);
    const rows = await sheet.getRows();
    const row = rows[rowIndex];
    Object.keys(rowData).forEach((key) => {
      row[key] = rowData[key];
    });
    await row.save();
    return true;
  } catch (error) {
    console.error(`Error updating row in ${sheetTitle}:`, error);
    throw error;
  }
};

// Generic function to delete a row from a sheet
const deleteRow = async (sheetTitle, rowIndex) => {
  try {
    const sheet = await getSheet(sheetTitle);
    const rows = await sheet.getRows();
    await rows[rowIndex].delete();
    return true;
  } catch (error) {
    console.error(`Error deleting row from ${sheetTitle}:`, error);
    throw error;
  }
};

// Material Inward functions with automatic stock update
export const MaterialInward = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.materialInward),
  add: async (data) => {
    await addRow(GOOGLE_SHEETS_CONFIG.sheets.materialInward, data);
    await updateStockQuantity(data.itemCode, data.quantity, true);
    return true;
  },
  update: async (rowIndex, data, oldData) => {
    if (oldData && oldData.itemCode === data.itemCode) {
      // Adjust stock for the difference
      const quantityDiff =
        parseFloat(data.quantity) - parseFloat(oldData.quantity);
      await updateStockQuantity(
        data.itemCode,
        Math.abs(quantityDiff),
        quantityDiff > 0
      );
    } else {
      // Reverse old entry and add new entry
      if (oldData) {
        await updateStockQuantity(oldData.itemCode, oldData.quantity, false);
      }
      await updateStockQuantity(data.itemCode, data.quantity, true);
    }
    return updateRow(
      GOOGLE_SHEETS_CONFIG.sheets.materialInward,
      rowIndex,
      data
    );
  },
  delete: async (rowIndex, data) => {
    await updateStockQuantity(data.itemCode, data.quantity, false);
    return deleteRow(GOOGLE_SHEETS_CONFIG.sheets.materialInward, rowIndex);
  },
};

// Material Issue functions with automatic stock update
export const MaterialIssue = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.materialIssue),
  add: async (data) => {
    await addRow(GOOGLE_SHEETS_CONFIG.sheets.materialIssue, data);
    await updateStockQuantity(data.itemCode, data.quantity, false);
    return true;
  },
  update: async (rowIndex, data, oldData) => {
    if (oldData && oldData.itemCode === data.itemCode) {
      // Adjust stock for the difference
      const quantityDiff =
        parseFloat(data.quantity) - parseFloat(oldData.quantity);
      await updateStockQuantity(
        data.itemCode,
        Math.abs(quantityDiff),
        quantityDiff < 0
      );
    } else {
      // Reverse old entry and add new entry
      if (oldData) {
        await updateStockQuantity(oldData.itemCode, oldData.quantity, true);
      }
      await updateStockQuantity(data.itemCode, data.quantity, false);
    }
    return updateRow(GOOGLE_SHEETS_CONFIG.sheets.materialIssue, rowIndex, data);
  },
  delete: async (rowIndex, data) => {
    await updateStockQuantity(data.itemCode, data.quantity, true);
    return deleteRow(GOOGLE_SHEETS_CONFIG.sheets.materialIssue, rowIndex);
  },
};

// Stock functions
export const Stock = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.stock),
  add: async (data) => addRow(GOOGLE_SHEETS_CONFIG.sheets.stock, data),
  update: async (rowIndex, data) =>
    updateRow(GOOGLE_SHEETS_CONFIG.sheets.stock, rowIndex, data),
  delete: async (rowIndex) =>
    deleteRow(GOOGLE_SHEETS_CONFIG.sheets.stock, rowIndex),
  findByItemCode: async (itemCode) => findStockItem(itemCode),
};

// Other exports remain unchanged
export const BOM = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.bom),
  add: async (data) => addRow(GOOGLE_SHEETS_CONFIG.sheets.bom, data),
  update: async (rowIndex, data) =>
    updateRow(GOOGLE_SHEETS_CONFIG.sheets.bom, rowIndex, data),
  delete: async (rowIndex) =>
    deleteRow(GOOGLE_SHEETS_CONFIG.sheets.bom, rowIndex),
};

export const KittingSheet = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.kittingSheet),
  add: async (data) => addRow(GOOGLE_SHEETS_CONFIG.sheets.kittingSheet, data),
  update: async (rowIndex, data) =>
    updateRow(GOOGLE_SHEETS_CONFIG.sheets.kittingSheet, rowIndex, data),
  delete: async (rowIndex) =>
    deleteRow(GOOGLE_SHEETS_CONFIG.sheets.kittingSheet, rowIndex),
};

export const FinishedGoods = {
  getAll: async () => getAllRows(GOOGLE_SHEETS_CONFIG.sheets.finishedGoods),
  add: async (data) => addRow(GOOGLE_SHEETS_CONFIG.sheets.finishedGoods, data),
  update: async (rowIndex, data) =>
    updateRow(GOOGLE_SHEETS_CONFIG.sheets.finishedGoods, rowIndex, data),
  delete: async (rowIndex) =>
    deleteRow(GOOGLE_SHEETS_CONFIG.sheets.finishedGoods, rowIndex),
};
