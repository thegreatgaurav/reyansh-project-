import config from "../config/config";

const SPREADSHEET_ID = config.googleSheets.spreadsheetId;

export const fetchSheetData = async (sheetName, range) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?key=${config.googleSheets.apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch sheet data");
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
};

export const updateSheetData = async (sheetName, range, values) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?valueInputOption=USER_ENTERED&key=${config.googleSheets.apiKey}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: values,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update sheet data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating sheet data:", error);
    throw error;
  }
};
