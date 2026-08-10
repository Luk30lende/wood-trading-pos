/**
 * =====================================================
 * GENERAL BACKEND UTILITIES
 * =====================================================
 */

/**
 * Generates a unique application ID.
 *
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix = "ID") {
  const timestamp = Date.now();

  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * Returns the current date/time.
 *
 * @returns {Date}
 */
function now() {
  return new Date();
}

/**
 * Converts a date into an ISO string.
 *
 * @param {Date|string} date
 * @returns {string}
 */
function toISOString(date) {
  return new Date(date).toISOString();
}

/**
 * Converts a spreadsheet row into an object using
 * a column definition.
 *
 * @param {Array} row
 * @param {Object} columnDefinition
 * @returns {Object}
 */
function rowToObject(row, columnDefinition) {
  const object = {};

  Object.keys(columnDefinition).forEach((key) => {
    const index = columnDefinition[key];

    object[key] = row[index];
  });

  return object;
}
