/**
 * =====================================================
 * DATABASE UTILITIES
 * =====================================================
 */

/**
 * Returns the spreadsheet used as the application database.
 *
 * For a standalone Apps Script project, the script must
 * be bound to the database spreadsheet through the
 * DATABASE_SPREADSHEET_ID Script Property.
 *
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getDatabaseSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();

  const spreadsheetId = properties.getProperty("DATABASE_SPREADSHEET_ID");

  if (!spreadsheetId) {
    throw new Error("DATABASE_SPREADSHEET_ID has not been configured.");
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  return spreadsheet;
}

/**
 * Returns a database sheet by its configured name.
 *
 * @param {string} sheetName
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(sheetName) {
  if (!sheetName) {
    throw new Error("Sheet name is required.");
  }

  const spreadsheet = getDatabaseSpreadsheet();

  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Database sheet "${sheetName}" does not exist.`);
  }

  return sheet;
}

/**
 * Returns a sheet if it exists, otherwise creates it.
 *
 * @param {string} sheetName
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureSheet(sheetName) {
  if (!sheetName) {
    throw new Error("Sheet name is required.");
  }

  const spreadsheet = getDatabaseSpreadsheet();

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

/**
 * Ensures that a database sheet exists and has the
 * expected headers.
 *
 * IMPORTANT:
 * This function does not automatically overwrite
 * existing headers. It reports a schema mismatch
 * instead, preventing accidental data destruction.
 *
 * @param {string} sheetName
 * @param {Array<string>} headers
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureSheetHeaders(sheetName, headers) {
  if (!sheetName) {
    throw new Error("Sheet name is required.");
  }

  if (!headers || headers.length === 0) {
    throw new Error(`No headers provided for "${sheetName}".`);
  }

  const sheet = ensureSheet(sheetName);

  const lastColumn = sheet.getLastColumn();

  // Completely empty sheet
  if (lastColumn === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    return sheet;
  }

  const existingHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((value) => String(value).trim());

  const expectedHeaders = headers.map((value) => String(value).trim());

  const headersMatch =
    existingHeaders.length === expectedHeaders.length &&
    existingHeaders.every((header, index) => header === expectedHeaders[index]);

  if (!headersMatch) {
    throw new Error(
      `Schema mismatch detected in "${sheetName}". ` +
        `Existing headers: ${existingHeaders.join(", ")} | ` +
        `Expected headers: ${expectedHeaders.join(", ")}`,
    );
  }

  return sheet;
}

/**
 * Applies basic formatting to a database sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function formatDatabaseSheet(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, lastColumn);

  headerRange
    .setFontWeight("bold")
    .setBackground("#001f3f")
    .setFontColor("#ffffff");

  sheet.setFrozenRows(1);

  sheet.autoResizeColumns(1, lastColumn);
}

/**
 * Creates and validates all configured database sheets.
 *
 * Existing sheets are never overwritten.
 *
 * @returns {Object}
 */
function initializeDatabase() {
  const sheetNames = Object.values(DB);

  const initializedSheets = [];

  sheetNames.forEach((sheetName) => {
    const headers = HEADERS[sheetName];

    if (!headers) {
      throw new Error(`No headers configured for "${sheetName}".`);
    }

    const sheet = ensureSheetHeaders(sheetName, headers);

    formatDatabaseSheet(sheet);

    initializedSheets.push({
      name: sheetName,
      columns: headers.length,
    });
  });

  return {
    success: true,
    message: "Database initialized and validated successfully.",
    sheetCount: initializedSheets.length,
    sheets: initializedSheets,
  };
}

/**
 * Validates the complete database schema.
 *
 * @returns {Object}
 */
function validateDatabaseSchema() {
  const spreadsheet = getDatabaseSpreadsheet();

  const results = [];

  Object.values(DB).forEach((sheetName) => {
    const expectedHeaders = HEADERS[sheetName];

    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      results.push({
        sheet: sheetName,
        status: "MISSING",
        columns: 0,
      });

      return;
    }

    const lastColumn = sheet.getLastColumn();

    const actualHeaders =
      lastColumn > 0
        ? sheet
            .getRange(1, 1, 1, lastColumn)
            .getValues()[0]
            .map((value) => String(value).trim())
        : [];

    const matches =
      actualHeaders.length === expectedHeaders.length &&
      actualHeaders.every((header, index) => header === expectedHeaders[index]);

    results.push({
      sheet: sheetName,
      status: matches ? "OK" : "SCHEMA_MISMATCH",
      columns: actualHeaders.length,
    });
  });

  const failed = results.filter((result) => result.status !== "OK");

  return {
    success: failed.length === 0,

    spreadsheetId: spreadsheet.getId(),

    sheetCount: results.length,

    valid: results.filter((result) => result.status === "OK").length,

    invalid: failed.length,

    results,
  };
}

/**
 * Simple backend connectivity test.
 */
function testDatabaseSheetLookup() {
  const sheet = getSheet(DB.SETTINGS);

  const result = {
    success: true,
    sheetName: sheet.getName(),
    rowCount: sheet.getLastRow(),
    columnCount: sheet.getLastColumn(),
  };

  console.log(result);

  return result;
}

/**
 * Returns all data rows from a sheet.
 *
 * The header row is excluded.
 *
 * @param {string} sheetName
 * @returns {Array<Array>}
 */
function getSheetRows(sheetName) {
  const sheet = getSheet(sheetName);

  const lastRow = sheet.getLastRow();

  const lastColumn = sheet.getLastColumn();

  if (lastRow <= 1 || lastColumn === 0) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
}

/**
 * Returns all records from a sheet as objects.
 *
 * @param {string} sheetName
 * @param {Object} columnDefinition
 * @returns {Array<Object>}
 */
function getSheetObjects(sheetName, columnDefinition) {
  const rows = getSheetRows(sheetName);

  return rows.map((row) => rowToObject(row, columnDefinition));
}

/**
 * Tests the standardized backend response system.
 */
function testBackendFoundation() {
  const response = handleServerRequest(() => {
    const spreadsheet = getDatabaseSpreadsheet();

    const schema = validateDatabaseSchema();

    return successResponse(
      {
        spreadsheetName: spreadsheet.getName(),

        spreadsheetId: spreadsheet.getId(),

        schema: schema,
      },
      "Backend foundation is working correctly.",
    );
  });

  console.log(JSON.stringify(response, null, 2));

  return response;
}
