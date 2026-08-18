/**
 * =====================================================
 * SESSION MANAGEMENT
 * =====================================================
 */

const SESSION_DURATION_HOURS = 8;

function generateSessionToken() {
  const randomBytes =
    Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    randomBytes,
    Utilities.Charset.UTF_8,
  );

  return digest
    .map(function (byte) {
      const value = byte < 0 ? byte + 256 : byte;

      return value.toString(16).padStart(2, "0");
    })
    .join("");
}

function createSession(userId) {
  requireValue(userId, "User ID");

  const nowDate = new Date();

  const expiresDate = new Date(
    nowDate.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
  );

  const session = {
    ID: generateId("SES"),

    USER_ID: userId,

    TOKEN: generateSessionToken(),

    CREATED_AT: nowDate,

    EXPIRES_AT: expiresDate,

    STATUS: "active",
  };

  insertRecord(DB.SESSIONS, COLUMNS.SESSIONS, session);

  return session;
}

function getValidSession(token) {
  if (!token) {
    return null;
  }

  const sessions = findRecords(DB.SESSIONS, COLUMNS.SESSIONS, {
    TOKEN: token,
    STATUS: "active",
  });

  if (sessions.length === 0) {
    return null;
  }

  const session = sessions[0];

  const expiresAt = new Date(session.EXPIRES_AT);

  if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    updateRecordById(DB.SESSIONS, COLUMNS.SESSIONS, session.ID, {
      STATUS: "expired",
    });

    return null;
  }

  return session;
}

function getAuthenticatedUser(token) {
  const session = getValidSession(token);

  if (!session) {
    return null;
  }

  const user = findRecordById(DB.USERS, COLUMNS.USERS, session.USER_ID);

  if (!user) {
    return null;
  }

  if (String(user.STATUS).toLowerCase() !== "active") {
    return null;
  }

  return user;
}

function requireAuthentication(token) {
  const user = getAuthenticatedUser(token);

  if (!user) {
    const error = new Error("Your session is invalid or has expired.");

    error.code = "AUTHENTICATION_REQUIRED";

    throw error;
  }

  return user;
}

function testSessionCreation() {
  const response = login("admin@test.com", "Admin123!");

  console.log(JSON.stringify(response, null, 2));

  if (!response.success || !response.data || !response.data.token) {
    throw new Error("Session token was not created.");
  }

  return response;
}

function testAuthenticatedUser() {
  const loginResponse = login("admin@test.com", "Admin123!");

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  const user = getAuthenticatedUser(token);

  if (!user) {
    throw new Error("Authenticated user could not be resolved.");
  }

  const sanitized = sanitizeUser(user);

  console.log(JSON.stringify(sanitized, null, 2));

  return successResponse(sanitized, "Authenticated user test passed.");
}

function testInvalidSession() {
  const response = handleServerRequest(() => {
    requireAuthentication("this-is-not-a-valid-token");

    return successResponse(null, "This should never execute.");
  });

  console.log(JSON.stringify(response, null, 2));

  return response;
}

/**
 * Revokes an active session.
 *
 * @param {string} token
 * @returns {boolean}
 */
function revokeSession(token) {
  requireValue(token, "Session token");

  const sessions = findRecords(DB.SESSIONS, COLUMNS.SESSIONS, {
    TOKEN: token,
  });

  if (sessions.length === 0) {
    return false;
  }

  const session = sessions[0];

  if (String(session.STATUS).toLowerCase() !== "active") {
    return false;
  }

  updateRecordById(DB.SESSIONS, COLUMNS.SESSIONS, session.ID, {
    STATUS: "revoked",
  });

  return true;
}

/**
 * Logs the current user out by revoking
 * their server-side session.
 *
 * @param {string} token
 * @returns {Object}
 */
function logout(token) {
  return handleServerRequest(() => {
    requireValue(token, "Session token");

    const session = getValidSession(token);

    if (!session) {
      const error = new Error(
        "Your session is invalid or has already expired.",
      );

      error.code = "AUTHENTICATION_REQUIRED";

      throw error;
    }

    revokeSession(token);

    return successResponse(null, "Logout successful.");
  });
}

function testLogout() {
  const loginResponse = login("admin@test.com", "Admin123!");

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  const logoutResponse = logout(token);

  console.log(JSON.stringify(logoutResponse, null, 2));

  if (!logoutResponse.success) {
    throw new Error("Logout failed.");
  }

  return logoutResponse;
}

function testRevokedSession() {
  const loginResponse = login("admin@test.com", "Admin123!");

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  const logoutResponse = logout(token);

  if (!logoutResponse.success) {
    throw new Error("Logout failed.");
  }

  const user = getAuthenticatedUser(token);

  console.log(
    JSON.stringify(
      {
        authenticatedUser: user,
      },
      null,
      2,
    ),
  );

  if (user !== null) {
    throw new Error("Revoked session was still accepted.");
  }

  return successResponse(
    {
      authenticated: false,
    },
    "Revoked session correctly rejected.",
  );
}
