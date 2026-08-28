/**
 * =====================================================
 * DATABASE MIGRATIONS
 * =====================================================
 */

/**
 * Renames the legacy Car_ID column in Purchases
 * to Shipment_ID.
 *
 * This migration is safe to run once.
 */
function migratePurchasesCarToShipment() {
  const spreadsheet = getDatabaseSpreadsheet();

  const sheet = spreadsheet.getSheetByName(DB.PURCHASES);

  if (!sheet) {
    throw new Error(`Sheet "${DB.PURCHASES}" does not exist.`);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const oldHeaderIndex = headers.indexOf("Car_ID");

  const newHeaderIndex = headers.indexOf("Shipment_ID");

  // Already migrated.
  if (oldHeaderIndex === -1 && newHeaderIndex !== -1) {
    return successResponse(null, "Purchases schema is already migrated.");
  }

  // Expected legacy state.
  if (oldHeaderIndex === -1) {
    throw new Error('Legacy "Car_ID" column was not found.');
  }

  // Prevent accidental duplicate columns.
  if (newHeaderIndex !== -1) {
    throw new Error(
      'Both "Car_ID" and "Shipment_ID" already exist. ' +
        "Manual review is required.",
    );
  }

  sheet.getRange(1, oldHeaderIndex + 1).setValue("Shipment_ID");

  return successResponse(
    null,
    'Purchases "Car_ID" column renamed to "Shipment_ID".',
  );
}

/**
 * Renames the legacy Car_ID column in Wood_Stocks
 * to Shipment_ID.
 *
 * This migration is safe to run once.
 */
function migrateWoodStocksCarToShipment() {
  const spreadsheet = getDatabaseSpreadsheet();

  const sheet = spreadsheet.getSheetByName(DB.WOOD_STOCKS);

  if (!sheet) {
    throw new Error(`Sheet "${DB.WOOD_STOCKS}" does not exist.`);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const oldHeaderIndex = headers.indexOf("Car_ID");

  const newHeaderIndex = headers.indexOf("Shipment_ID");

  // Already migrated.
  if (oldHeaderIndex === -1 && newHeaderIndex !== -1) {
    return successResponse(null, "Wood_Stocks schema is already migrated.");
  }

  // Legacy column not found.
  if (oldHeaderIndex === -1) {
    throw new Error('Legacy "Car_ID" column was not found in Wood_Stocks.');
  }

  // Prevent duplicate columns.
  if (newHeaderIndex !== -1) {
    throw new Error(
      'Both "Car_ID" and "Shipment_ID" already exist in Wood_Stocks. ' +
        "Manual review is required.",
    );
  }

  sheet.getRange(1, oldHeaderIndex + 1).setValue("Shipment_ID");

  return successResponse(
    null,
    'Wood_Stocks "Car_ID" column renamed to "Shipment_ID".',
  );
}

function migratePasswordResetTokensSheet() {
  const spreadsheet = getDatabaseSpreadsheet();

  const sheetName = DB.PASSWORD_RESET_TOKENS;

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (sheet) {
    return successResponse(null, "Password reset tokens sheet already exists.");
  }

  sheet = spreadsheet.insertSheet(sheetName);

  const headers = HEADERS.Password_Reset_Tokens;

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.setFrozenRows(1);

  return successResponse(null, "Password reset tokens sheet created.");
}
