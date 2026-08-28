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

/**
 * Creates a new user.
 *
 * The caller must be authenticated and have
 * users.create permission.
 *
 * @param {string} token
 * @param {Object} data
 * @returns {Object}
 */
function createUser(token, data) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");

    error.code = "AUTHENTICATION_REQUIRED";

    throw error;
  }

  requirePermission(currentUser.ROLE, "users", "create");

  if (!data || typeof data !== "object") {
    const error = new Error("User data is required.");

    error.code = "VALIDATION_ERROR";

    throw error;
  }

  requireValue(data.EMAIL, "Email");
  requireValue(data.NAME, "Name");
  requireValue(data.ROLE, "Role");
  requireValue(data.PASSWORD, "Password");

  const email = String(data.EMAIL).trim().toLowerCase();

  const name = String(data.NAME).trim();

  const role = String(data.ROLE).trim().toLowerCase();

  const password = String(data.PASSWORD);

  const validRoles = ["admin", "manager", "cashier", "warehouse_staff"];

  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role "${role}".`);

    error.code = "INVALID_ROLE";

    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters.");

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    const error = new Error("A user with this email already exists.");

    error.code = "EMAIL_ALREADY_EXISTS";

    throw error;
  }

  const timestamp = now();

  const user = {
    ID: generateId("USR"),
    EMAIL: email,
    PASSWORD_HASH: hashPassword(password),
    NAME: name,
    ROLE: role,
    PHONE: data.PHONE ? String(data.PHONE).trim() : "",
    AVATAR_URL: data.AVATAR_URL ? String(data.AVATAR_URL).trim() : "",
    STATUS: "active",
    OTP: "",
    OTP_EXPIRY: "",
    CREATED_AT: timestamp,
    UPDATED_AT: timestamp,
  };

  insertRecord(DB.USERS, COLUMNS.USERS, user);

  return sanitizeUser(user);
}

/**
 * Public server endpoint for creating users.
 */
function registerUser(token, data) {
  return handleServerRequest(() => {
    const user = createUser(token, data);

    return successResponse(user, "User created successfully.");
  });
}

function testCreateUser() {
  setupUsersTestAdmin();

  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const email = `create-test-${Date.now()}@test.com`;

  const response = registerUser(token, {
    EMAIL: email,
    PASSWORD: "CreateTest123!",
    NAME: "Create User Test",
    ROLE: "cashier",
    PHONE: "",
    AVATAR_URL: "",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("User creation failed.");
  }

  if (!response.data) {
    throw new Error("Created user was not returned.");
  }

  if (response.data.EMAIL !== email) {
    throw new Error("Created user email does not match.");
  }

  if (response.data.ROLE !== "cashier") {
    throw new Error("Created user role does not match.");
  }

  if (response.data.PASSWORD_HASH !== undefined) {
    throw new Error("Password hash was exposed.");
  }

  if (response.data.OTP !== undefined) {
    throw new Error("OTP was exposed.");
  }

  if (response.data.OTP_EXPIRY !== undefined) {
    throw new Error("OTP expiry was exposed.");
  }

  return successResponse(
    {
      email: email,
      created: true,
      sensitiveFieldsHidden: true,
    },
    "Create user test passed.",
  );
}

function testCreateUserValidation() {
  setupUsersTestAdmin();

  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // 1. Duplicate email
  const duplicateResponse = registerUser(token, {
    EMAIL: "admin@test.com",
    PASSWORD: "TestPassword123!",
    NAME: "Duplicate User",
    ROLE: "cashier",
  });

  console.log("Duplicate email:", JSON.stringify(duplicateResponse, null, 2));

  const duplicateRejected =
    !duplicateResponse.success &&
    duplicateResponse.error &&
    duplicateResponse.error.code === "EMAIL_ALREADY_EXISTS";

  if (!duplicateRejected) {
    throw new Error("Duplicate email was not rejected.");
  }

  // 2. Invalid role
  const invalidRoleResponse = registerUser(token, {
    EMAIL: `invalid-role-${Date.now()}@test.com`,
    PASSWORD: "TestPassword123!",
    NAME: "Invalid Role User",
    ROLE: "superuser",
  });

  console.log("Invalid role:", JSON.stringify(invalidRoleResponse, null, 2));

  const invalidRoleRejected =
    !invalidRoleResponse.success &&
    invalidRoleResponse.error &&
    invalidRoleResponse.error.code === "INVALID_ROLE";

  if (!invalidRoleRejected) {
    throw new Error("Invalid role was not rejected.");
  }

  // 3. Weak password
  const weakPasswordResponse = registerUser(token, {
    EMAIL: `weak-password-${Date.now()}@test.com`,
    PASSWORD: "123",
    NAME: "Weak Password User",
    ROLE: "cashier",
  });

  console.log("Weak password:", JSON.stringify(weakPasswordResponse, null, 2));

  const weakPasswordRejected =
    !weakPasswordResponse.success &&
    weakPasswordResponse.error &&
    weakPasswordResponse.error.code === "INVALID_PASSWORD";

  if (!weakPasswordRejected) {
    throw new Error("Weak password was not rejected.");
  }

  return successResponse(
    {
      duplicateEmailRejected: duplicateRejected,

      invalidRoleRejected: invalidRoleRejected,

      weakPasswordRejected: weakPasswordRejected,
    },
    "Create user validation tests passed.",
  );
}

function testCreateUserPermission() {
  setupPasswordResetTestUser();

  const loginResponse = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!loginResponse.success) {
    throw new Error("Cashier login failed.");
  }

  const token = loginResponse.data.token;

  const response = registerUser(token, {
    EMAIL: `unauthorized-${Date.now()}@test.com`,
    PASSWORD: "TestPassword123!",
    NAME: "Unauthorized User",
    ROLE: "cashier",
  });

  console.log(JSON.stringify(response, null, 2));

  const permissionDenied =
    !response.success &&
    response.error &&
    response.error.code === "PERMISSION_DENIED";

  if (!permissionDenied) {
    throw new Error("Cashier was able to create a user.");
  }

  return successResponse(
    {
      permissionDenied: true,
    },
    "Create user permission test passed.",
  );
}

/**
 * Updates an existing user.
 *
 * Password changes are intentionally handled separately.
 *
 * @param {string} token
 * @param {string} userId
 * @param {Object} updates
 * @returns {Object}
 */
function updateUser(token, userId, updates) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");

    error.code = "AUTHENTICATION_REQUIRED";

    throw error;
  }

  requirePermission(currentUser.ROLE, "users", "update");

  requireValue(userId, "User ID");

  if (!updates || typeof updates !== "object") {
    const error = new Error("Update data is required.");

    error.code = "VALIDATION_ERROR";

    throw error;
  }

  const existingUser = findRecordById(DB.USERS, COLUMNS.USERS, userId);

  if (!existingUser) {
    const error = new Error("User not found.");

    error.code = "USER_NOT_FOUND";

    throw error;
  }

  const allowedFields = [
    "NAME",
    "EMAIL",
    "PHONE",
    "AVATAR_URL",
    "ROLE",
    "STATUS",
  ];

  const updateData = {};

  Object.keys(updates).forEach((key) => {
    if (!allowedFields.includes(key)) {
      const error = new Error(
        `Field "${key}" cannot be updated through this function.`,
      );

      error.code = "INVALID_UPDATE_FIELD";

      throw error;
    }

    updateData[key] = updates[key];
  });

  if (Object.keys(updateData).length === 0) {
    const error = new Error("No valid fields were provided for update.");

    error.code = "VALIDATION_ERROR";

    throw error;
  }

  // Validate email if it is being changed.
  if (updateData.EMAIL !== undefined) {
    const email = String(updateData.EMAIL).trim().toLowerCase();

    if (!email) {
      const error = new Error("Email cannot be empty.");

      error.code = "INVALID_EMAIL";

      throw error;
    }

    const emailUser = findUserByEmail(email);

    if (emailUser && String(emailUser.ID) !== String(userId)) {
      const error = new Error("A user with this email already exists.");

      error.code = "EMAIL_ALREADY_EXISTS";

      throw error;
    }

    updateData.EMAIL = email;
  }

  // Validate name.
  if (updateData.NAME !== undefined) {
    updateData.NAME = String(updateData.NAME).trim();

    if (!updateData.NAME) {
      const error = new Error("Name cannot be empty.");

      error.code = "INVALID_NAME";

      throw error;
    }
  }

  // Validate role.
  if (updateData.ROLE !== undefined) {
    const validRoles = ["admin", "manager", "cashier", "warehouse_staff"];

    updateData.ROLE = String(updateData.ROLE).trim().toLowerCase();

    if (!validRoles.includes(updateData.ROLE)) {
      const error = new Error(`Invalid role "${updateData.ROLE}".`);

      error.code = "INVALID_ROLE";

      throw error;
    }
  }

  // Validate status.
  if (updateData.STATUS !== undefined) {
    const validStatuses = ["active", "inactive"];

    updateData.STATUS = String(updateData.STATUS).trim().toLowerCase();

    if (!validStatuses.includes(updateData.STATUS)) {
      const error = new Error(`Invalid status "${updateData.STATUS}".`);

      error.code = "INVALID_STATUS";

      throw error;
    }
  }

  updateData.UPDATED_AT = now();

  const updatedUser = updateRecordById(
    DB.USERS,
    COLUMNS.USERS,
    userId,
    updateData,
  );

  if (!updatedUser) {
    const error = new Error("User not found.");

    error.code = "USER_NOT_FOUND";

    throw error;
  }

  return sanitizeUser(updatedUser);
}

/**
 * Public server endpoint for updating users.
 */
function editUser(token, userId, updates) {
  return handleServerRequest(() => {
    const user = updateUser(token, userId, updates);

    return successResponse(user, "User updated successfully.");
  });
}

function testUpdateUser() {
  setupUsersTestAdmin();

  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const usersResponse = listUsers(token);

  if (!usersResponse.success || usersResponse.data.length === 0) {
    throw new Error("Could not retrieve users.");
  }

  const testUser = usersResponse.data.find(
    (user) => user.EMAIL === "password-reset-test@test.com",
  );

  if (!testUser) {
    throw new Error("Test user could not be found.");
  }

  const response = editUser(token, testUser.ID, {
    NAME: "Updated Test User",
    PHONE: "0712345678",
    ROLE: "cashier",
    STATUS: "active",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("User update failed.");
  }

  if (response.data.NAME !== "Updated Test User") {
    throw new Error("Name was not updated.");
  }

  if (response.data.PHONE !== "0712345678") {
    throw new Error("Phone was not updated.");
  }

  if (response.data.ROLE !== "cashier") {
    throw new Error("Role was not updated.");
  }

  if (response.data.PASSWORD_HASH !== undefined) {
    throw new Error("Password hash was exposed.");
  }

  return successResponse(
    {
      updated: true,
      userId: response.data.ID,
    },
    "Update user test passed.",
  );
}

function testUpdateUserValidation() {
  setupUsersTestAdmin();

  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const usersResponse = listUsers(token);

  if (!usersResponse.success || usersResponse.data.length < 2) {
    throw new Error("Could not retrieve users.");
  }

  const testUser = usersResponse.data.find(
    (user) => user.EMAIL === "password-reset-test@test.com",
  );

  if (!testUser) {
    throw new Error("Test user could not be found.");
  }

  // 1. Duplicate email
  const duplicateEmailResponse = editUser(token, testUser.ID, {
    EMAIL: "admin@test.com",
  });

  console.log(
    "Duplicate email:",
    JSON.stringify(duplicateEmailResponse, null, 2),
  );

  if (
    duplicateEmailResponse.success ||
    duplicateEmailResponse.error.code !== "EMAIL_ALREADY_EXISTS"
  ) {
    throw new Error("Duplicate email was not rejected.");
  }

  // 2. Invalid role
  const invalidRoleResponse = editUser(token, testUser.ID, {
    ROLE: "superuser",
  });

  console.log("Invalid role:", JSON.stringify(invalidRoleResponse, null, 2));

  if (
    invalidRoleResponse.success ||
    invalidRoleResponse.error.code !== "INVALID_ROLE"
  ) {
    throw new Error("Invalid role was not rejected.");
  }

  // 3. Invalid status
  const invalidStatusResponse = editUser(token, testUser.ID, {
    STATUS: "deleted",
  });

  console.log(
    "Invalid status:",
    JSON.stringify(invalidStatusResponse, null, 2),
  );

  if (
    invalidStatusResponse.success ||
    invalidStatusResponse.error.code !== "INVALID_STATUS"
  ) {
    throw new Error("Invalid status was not rejected.");
  }

  // 4. Non-existent user
  const missingUserResponse = editUser(token, "USR-NONEXISTENT-123", {
    NAME: "Should Not Exist",
  });

  console.log("Missing user:", JSON.stringify(missingUserResponse, null, 2));

  if (
    missingUserResponse.success ||
    missingUserResponse.error.code !== "USER_NOT_FOUND"
  ) {
    throw new Error("Non-existent user was not rejected.");
  }

  // 5. Protected field
  const protectedFieldResponse = editUser(token, testUser.ID, {
    PASSWORD_HASH: "fake-hash",
  });

  console.log(
    "Protected field:",
    JSON.stringify(protectedFieldResponse, null, 2),
  );

  if (
    protectedFieldResponse.success ||
    protectedFieldResponse.error.code !== "INVALID_UPDATE_FIELD"
  ) {
    throw new Error("Protected field update was not rejected.");
  }

  return successResponse(
    {
      duplicateEmailRejected: true,
      invalidRoleRejected: true,
      invalidStatusRejected: true,
      missingUserRejected: true,
      protectedFieldRejected: true,
    },
    "Update user validation tests passed.",
  );
}

function testUpdateUserPermission() {
  const loginResponse = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!loginResponse.success) {
    throw new Error("Cashier login failed.");
  }

  const token = loginResponse.data.token;

  const targetUserId = "USR-1786553888236-409179";

  const response = editUser(token, targetUserId, {
    NAME: "Unauthorized Update",
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success || response.error.code !== "PERMISSION_DENIED") {
    throw new Error("Cashier was able to update a user.");
  }

  return successResponse(
    {
      permissionDenied: true,
    },
    "Update user permission test passed.",
  );
}
