/**
 * =====================================================
 * AUTHENTICATION
 * =====================================================
 */

/**
 * Hashes a password using SHA-256.
 *
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  requireValue(password, "Password");

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8,
  );

  return digest
    .map(function (byte) {
      const value = byte < 0 ? byte + 256 : byte;

      return value.toString(16).padStart(2, "0");
    })
    .join("");
}

/**
 * Verifies a password against a stored hash.
 *
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  return hashPassword(password) === storedHash;
}

/**
 * Finds a user by email address.
 *
 * @param {string} email
 * @returns {Object|null}
 */
function findUserByEmail(email) {
  requireValue(email, "Email");

  const normalizedEmail = String(email).trim().toLowerCase();

  const users = findRecords(DB.USERS, COLUMNS.USERS);

  const user = users.find(function (candidate) {
    return String(candidate.EMAIL).trim().toLowerCase() === normalizedEmail;
  });

  return user || null;
}

/**
 * Authenticates a user using email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object}
 */
function login(email, password) {
  return handleServerRequest(() => {
    requireValue(email, "Email");
    requireValue(password, "Password");

    const user = findUserByEmail(email);

    if (!user) {
      const error = new Error("Invalid email or password.");

      error.code = "INVALID_CREDENTIALS";

      throw error;
    }

    if (String(user.STATUS).toLowerCase() !== "active") {
      const error = new Error("This account is not active.");

      error.code = "ACCOUNT_INACTIVE";

      throw error;
    }

    const validPassword = verifyPassword(password, user.PASSWORD_HASH);

    if (!validPassword) {
      const error = new Error("Invalid email or password.");

      error.code = "INVALID_CREDENTIALS";

      throw error;
    }

    const session = createSession(user.ID);

    return successResponse(
      {
        token: session.TOKEN,

        expiresAt: session.EXPIRES_AT,

        user: sanitizeUser(user),
      },
      "Login successful.",
    );
  });
}

/**
 * Removes sensitive authentication fields from
 * a user object before returning it to the client.
 *
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ID: user.ID,

    EMAIL: user.EMAIL,

    NAME: user.NAME,

    ROLE: user.ROLE,

    PHONE: user.PHONE,

    AVATAR_URL: user.AVATAR_URL,

    STATUS: user.STATUS,

    CREATED_AT: user.CREATED_AT,

    UPDATED_AT: user.UPDATED_AT,
  };
}

/**
 * Creates a development administrator account.
 *
 * This is a temporary development helper.
 * Do not expose this function to the frontend.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Object}
 */
function createDevelopmentAdmin(email, password, name) {
  requireValue(email, "Email");
  requireValue(password, "Password");
  requireValue(name, "Name");

  const existing = findUserByEmail(email);

  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const nowValue = now();

  const user = {
    ID: generateId("USR"),

    EMAIL: String(email).trim().toLowerCase(),

    PASSWORD_HASH: hashPassword(password),

    NAME: name,

    ROLE: ROLES.ADMIN,

    PHONE: "",

    AVATAR_URL: "",

    STATUS: "active",

    OTP: "",

    OTP_EXPIRY: "",

    CREATED_AT: nowValue,

    UPDATED_AT: nowValue,
  };

  insertRecord(DB.USERS, COLUMNS.USERS, user);

  return successResponse(
    {
      user: sanitizeUser(user),
    },
    "Development administrator created.",
  );
}

function testPasswordHashing() {
  return handleServerRequest(() => {
    const password = "TestPassword123!";

    const hash = hashPassword(password);

    const verified = verifyPassword(password, hash);

    const incorrectPassword = verifyPassword("WrongPassword123!", hash);

    const result = {
      hashGenerated: Boolean(hash),

      hashLength: hash.length,

      correctPassword: verified,

      incorrectPassword: incorrectPassword,
    };

    console.log(JSON.stringify(result, null, 2));

    return successResponse(result, "Password hashing test completed.");
  });
}

/**
 * Creates a test administrator for authentication testing.
 *
 * Development only.
 */
function testCreateDevelopmentAdmin() {
  const response = handleServerRequest(() => {
    return createDevelopmentAdmin(
      "admin@test.com",
      "Admin123!",
      "System Administrator",
    );
  });

  console.log(JSON.stringify(response, null, 2));

  return response;
}

/**
 * Tests finding a user by email.
 */
function testFindUserByEmail() {
  const response = handleServerRequest(() => {
    const user = findUserByEmail("admin@test.com");

    if (!user) {
      throw new Error("Test administrator was not found.");
    }

    return successResponse(
      {
        found: true,
        user: sanitizeUser(user),
      },
      "User lookup test passed.",
    );
  });

  console.log(JSON.stringify(response, null, 2));

  return response;
}

/**
 * Tests successful authentication.
 */
function testSuccessfulLogin() {
  const response = login("admin@test.com", "Admin123!");

  console.log(JSON.stringify(response, null, 2));

  return response;
}

/**
 * Tests failed authentication.
 */
function testFailedLogin() {
  const response = login("admin@test.com", "WrongPassword123!");

  console.log(JSON.stringify(response, null, 2));

  return response;
}
