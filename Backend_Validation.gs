/**
 * =====================================================
 * VALIDATION UTILITIES
 * =====================================================
 */

/**
 * Ensures a required value exists.
 *
 * @param {*} value
 * @param {string} fieldName
 */
function requireValue(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }
}

/**
 * Ensures a value is numeric.
 *
 * @param {*} value
 * @param {string} fieldName
 */
function requireNumber(value, fieldName) {
  requireValue(value, fieldName);

  if (isNaN(Number(value))) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
}

/**
 * Ensures a value is a positive number.
 *
 * @param {*} value
 * @param {string} fieldName
 */
function requirePositiveNumber(value, fieldName) {
  requireNumber(value, fieldName);

  if (Number(value) <= 0) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
}

/**
 * Ensures a value is one of the allowed values.
 *
 * @param {*} value
 * @param {Array} allowedValues
 * @param {string} fieldName
 */
function requireEnum(value, allowedValues, fieldName) {
  requireValue(value, fieldName);

  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ` + allowedValues.join(", "));
  }
}
