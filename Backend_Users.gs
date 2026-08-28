/**
 * =====================================================
 * USERS & ROLES
 * =====================================================
 */

/**
 * Returns all users.
 *
 * This function intentionally does not return
 * password hashes or OTP information.
 *
 * @returns {Array<Object>}
 */
function getUsers(token) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");

    error.code = "AUTHENTICATION_REQUIRED";

    throw error;
  }

  requirePermission(currentUser.ROLE, "users", "view");

  const users = getSheetObjects(DB.USERS, COLUMNS.USERS);

  return users.map((user) => {
    return sanitizeUser(user);
  });
}

/**
 * Returns a single user by ID.
 *
 * @param {string} userId
 * @returns {Object|null}
 */
function getUser(token, userId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");

    error.code = "AUTHENTICATION_REQUIRED";

    throw error;
  }

  requirePermission(currentUser.ROLE, "users", "view");

  requireValue(userId, "User ID");

  const user = findRecordById(DB.USERS, COLUMNS.USERS, userId);

  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

/**
 * Removes sensitive authentication fields
 * from a user object.
 *
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const sanitized = {
    ...user,
  };

  delete sanitized.PASSWORD_HASH;
  delete sanitized.OTP;
  delete sanitized.OTP_EXPIRY;

  return sanitized;
}

/**
 * Public endpoint for retrieving users.
 */
function listUsers(token) {
  return handleServerRequest(() => {
    const users = getUsers(token);

    return successResponse(users, "Users retrieved successfully.");
  });
}

/**
 * Public endpoint for retrieving one user.
 */
function fetchUser(token, userId) {
  return handleServerRequest(() => {
    const user = getUser(token, userId);

    if (!user) {
      const error = new Error("User not found.");

      error.code = "USER_NOT_FOUND";

      throw error;
    }

    return successResponse(user, "User retrieved successfully.");
  });
}

function testGetUsers() {
  setupUsersTestAdmin();

  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  const response = listUsers(token);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Could not retrieve users.");
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Users response is not an array.");
  }

  response.data.forEach((user) => {
    if (user.PASSWORD_HASH !== undefined) {
      throw new Error("Password hash was exposed.");
    }

    if (user.OTP !== undefined) {
      throw new Error("OTP was exposed.");
    }

    if (user.OTP_EXPIRY !== undefined) {
      throw new Error("OTP expiry was exposed.");
    }
  });

  return successResponse(
    {
      userCount: response.data.length,
      sensitiveFieldsHidden: true,
    },
    "Users retrieval test passed.",
  );
}

function testUsersAuthentication() {
  setupPasswordResetTestUser();

  const loginResponse = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  console.log("LOGIN RESPONSE:", JSON.stringify(loginResponse, null, 2));

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  console.log("TOKEN:", token);

  const user = getAuthenticatedUser(token);

  console.log("AUTHENTICATED USER:", JSON.stringify(user, null, 2));

  if (!user) {
    throw new Error("Authenticated user could not be resolved.");
  }

  return successResponse(
    {
      tokenGenerated: Boolean(token),
      userId: user.ID,
      email: user.EMAIL,
      role: user.ROLE,
    },
    "Users authentication test passed.",
  );
}

function setupUsersTestAdmin() {
  const email = "users-test-admin@test.com";

  const password = "TestAdmin123!";

  let user = findUserByEmail(email);

  const timestamp = now();

  const passwordHash = hashPassword(password);

  if (!user) {
    const userId = generateId("USR");

    insertRecord(DB.USERS, COLUMNS.USERS, {
      ID: userId,
      EMAIL: email,
      PASSWORD_HASH: passwordHash,
      NAME: "Users Test Admin",
      ROLE: "admin",
      PHONE: "",
      AVATAR_URL: "",
      STATUS: "active",
      OTP: "",
      OTP_EXPIRY: "",
      CREATED_AT: timestamp,
      UPDATED_AT: timestamp,
    });
  } else {
    updateRecordById(DB.USERS, COLUMNS.USERS, user.ID, {
      PASSWORD_HASH: passwordHash,
      ROLE: "admin",
      STATUS: "active",
      OTP: "",
      OTP_EXPIRY: "",
      UPDATED_AT: timestamp,
    });
  }

  return successResponse(
    {
      email: email,
      role: "admin",
    },
    "Users test admin is ready.",
  );
}
