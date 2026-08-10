/**
 * =====================================================
 * SERVER RESPONSE UTILITIES
 * =====================================================
 */

/**
 * Creates a successful server response.
 *
 * @param {*} data
 * @param {string} message
 * @returns {Object}
 */
function successResponse(data = null, message = "") {
  return {
    success: true,

    data: data,

    message: message,

    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a failed server response.
 *
 * @param {string} message
 * @param {string} code
 * @param {*} details
 * @returns {Object}
 */
function errorResponse(
  message = "An unexpected error occurred.",
  code = "SERVER_ERROR",
  details = null,
) {
  return {
    success: false,

    error: {
      code: code,

      message: message,

      details: details,
    },

    timestamp: new Date().toISOString(),
  };
}

/**
 * Executes a server operation safely and converts
 * exceptions into a standardized response.
 *
 * @param {Function} callback
 * @returns {Object}
 */
function handleServerRequest(callback) {
  try {
    return callback();
  } catch (error) {
    console.error(error);

    return errorResponse(
      error.message || "An unexpected error occurred.",
      "SERVER_ERROR",
    );
  }
}
