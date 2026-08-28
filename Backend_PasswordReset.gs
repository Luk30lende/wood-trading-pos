/**
 * =====================================================
 * PASSWORD RESET / OTP
 * =====================================================
 */

const OTP_EXPIRY_MINUTES = 10;

const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 10;

const PASSWORD_RESET_EMAIL = {
  SUBJECT: "Wood Trading POS — Password Reset Code",
  APP_NAME: "Wood Trading POS",
};

// Generate OTP
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function testOtpGeneration() {
  const otp = generateOtp();

  console.log("Generated OTP:", otp);

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must contain exactly 6 digits.");
  }

  return successResponse(
    {
      otp: otp,
      length: otp.length,
    },
    "OTP generation test passed.",
  );
}

// Create OTP expiry
function generateOtpExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function testOtpExpiry() {
  const before = new Date();

  const expiry = generateOtpExpiry();

  const after = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  console.log("Before:", before);

  console.log("Expiry:", expiry);

  if (expiry <= before) {
    throw new Error("OTP expiry must be in the future.");
  }

  if (expiry > after) {
    throw new Error("OTP expiry exceeds configured duration.");
  }

  return successResponse(
    {
      expiry: expiry,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    },
    "OTP expiry test passed.",
  );
}

// Store the OTP against a user
function setUserOtp(userId, otp, expiry) {
  requireValue(userId, "User ID");

  requireValue(otp, "OTP");

  requireValue(expiry, "OTP expiry");

  updateRecordById(DB.USERS, COLUMNS.USERS, userId, {
    OTP: otp,
    OTP_EXPIRY: expiry,
    UPDATED_AT: now(),
  });
}

// Create a password reset request
function createPasswordResetRequest(email) {
  requireValue(email, "Email");

  const user = findUserByEmail(email);

  /*
   * Deliberately return the same response
   * whether the account exists or not.
   */
  if (!user) {
    return {
      requested: true,
    };
  }

  if (String(user.STATUS).toLowerCase() !== "active") {
    return {
      requested: true,
    };
  }

  const otp = generateOtp();

  const expiry = generateOtpExpiry();

  setUserOtp(user.ID, otp, expiry);

  sendPasswordResetOtp(user, otp);

  return {
    requested: true,
  };
}

function testPasswordResetRequest() {
  const result = createPasswordResetRequest("admin@test.com");

  console.log(JSON.stringify(result, null, 2));

  if (!result.requested) {
    throw new Error("Password reset request failed.");
  }

  if (!result.otp || !/^\d{6}$/.test(result.otp)) {
    throw new Error("Invalid OTP generated.");
  }

  if (!result.expiry) {
    throw new Error("OTP expiry was not generated.");
  }

  return successResponse(
    {
      requested: true,
      otp: result.otp,
      expiry: result.expiry,
    },
    "Password reset request test passed.",
  );
}

function testUnknownPasswordResetRequest() {
  const response = requestPasswordReset("does-not-exist@test.com");

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Unknown email request failed.");
  }

  if (!response.data || !response.data.requested) {
    throw new Error("Generic reset response was not returned.");
  }

  return response;
}

// Create the email template
function buildOtpEmailHtml(name, otp) {
  const safeName = String(name || "User");

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
        </head>

        <body style="
            margin:0;
            padding:0;
            background:#f4f7fa;
            font-family:Arial,Helvetica,sans-serif;
            color:#1f2937;
        ">

            <div style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 4px 15px rgba(0,0,0,0.08);
            ">

                <div style="
                    background:#001f3f;
                    padding:24px;
                    text-align:center;
                ">

                    <h1 style="
                        margin:0;
                        color:#ffffff;
                        font-size:24px;
                    ">
                        Wood Trading POS
                    </h1>

                </div>

                <div style="padding:32px;">

                    <h2 style="
                        margin-top:0;
                        color:#001f3f;
                    ">
                        Password Reset
                    </h2>

                    <p>
                        Hello ${safeName},
                    </p>

                    <p>
                        We received a request to reset the password
                        for your Wood Trading POS account.
                    </p>

                    <p>
                        Your verification code is:
                    </p>

                    <div style="
                        margin:28px 0;
                        text-align:center;
                    ">

                        <span style="
                            display:inline-block;
                            padding:16px 28px;
                            background:#f0f4f8;
                            border-radius:8px;
                            color:#001f3f;
                            font-size:32px;
                            font-weight:bold;
                            letter-spacing:8px;
                        ">
                            ${otp}
                        </span>

                    </div>

                    <p>
                        This code will expire in
                        <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
                    </p>

                    <p style="
                        color:#6b7280;
                        font-size:14px;
                    ">
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                </div>

                <div style="
                    padding:18px 32px;
                    background:#f8fafc;
                    color:#6b7280;
                    font-size:12px;
                    text-align:center;
                ">

                    Wood Trading POS<br>
                    Automated message — please do not reply.

                </div>

            </div>

        </body>
        </html>
    `;
}

// Add the email sender
function sendPasswordResetOtp(user, otp) {
  requireValue(user.EMAIL, "User email");

  requireValue(otp, "OTP");

  const htmlBody = buildOtpEmailHtml(user.NAME, otp);

  MailApp.sendEmail({
    to: user.EMAIL,
    subject: PASSWORD_RESET_EMAIL.SUBJECT,
    htmlBody: htmlBody,
    body:
      "Your Wood Trading POS password reset code is: " +
      otp +
      ". It expires in " +
      OTP_EXPIRY_MINUTES +
      " minutes.",
  });
}

// Add the public request function
function requestPasswordReset(email) {
  return handleServerRequest(() => {
    createPasswordResetRequest(email);

    return successResponse(
      {
        requested: true,
      },
      "If an account exists for this email, " +
        "a password reset code has been sent.",
    );
  });
}

function testPasswordResetRequest() {
  const response = requestPasswordReset("admin@test.com");

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Password reset request failed.");
  }

  if (response.data.otp || response.data.userId) {
    throw new Error("Sensitive OTP information was returned.");
  }

  return response;
}

// Verify Password Reset
function verifyPasswordResetOtp(email, otp) {
  requireValue(email, "Email");

  requireValue(otp, "OTP");

  const user = findUserByEmail(email);

  if (!user) {
    const error = new Error("Invalid or expired verification code.");

    error.code = "INVALID_OTP";

    throw error;
  }

  const storedOtp = String(user.OTP || "").trim();

  const submittedOtp = String(otp).trim();

  if (!storedOtp || storedOtp !== submittedOtp) {
    const error = new Error("Invalid or expired verification code.");

    error.code = "INVALID_OTP";

    throw error;
  }

  const expiry = new Date(user.OTP_EXPIRY);

  if (isNaN(expiry.getTime()) || expiry <= new Date()) {
    const error = new Error("Invalid or expired verification code.");

    error.code = "OTP_EXPIRED";

    throw error;
  }

  return {
    valid: true,
    userId: user.ID,
  };
}

// Verify OTP
function verifyOtp(email, otp) {
  return handleServerRequest(() => {
    const result = verifyPasswordResetOtp(email, otp);

    const resetToken = createPasswordResetToken(result.userId);

    return successResponse(
      {
        valid: true,
        resetToken: resetToken.token,
        expiresAt: resetToken.expiresAt,
      },
      "Verification code is valid.",
    );
  });
}

function testValidOtpVerification() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const user = findUserByEmail(email);

  if (!user || !user.OTP) {
    throw new Error("OTP was not generated.");
  }

  const response = verifyOtp(email, user.OTP);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success || !response.data.valid) {
    throw new Error("Valid OTP was rejected.");
  }

  return response;
}

function testInvalidOtpVerification() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const response = verifyOtp(email, "000000");

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Invalid OTP was accepted.");
  }

  if (response.error.code !== "INVALID_OTP") {
    throw new Error("Unexpected error code.");
  }

  return response;
}

function testExpiredOtpVerification() {
  const email = "admin@test.com";

  const user = findUserByEmail(email);

  if (!user) {
    throw new Error("Test administrator was not found.");
  }

  setUserOtp(user.ID, "123456", new Date(Date.now() - 60 * 1000));

  const response = verifyOtp(email, "123456");

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Expired OTP was accepted.");
  }

  if (response.error.code !== "OTP_EXPIRED") {
    throw new Error("Unexpected error code.");
  }

  return response;
}

// Create Reset Token
function generatePasswordResetToken() {
  return generateSessionToken();
}

// Reset Token Creatiom
function createPasswordResetToken(userId) {
  requireValue(userId, "User ID");

  const token = generatePasswordResetToken();

  const createdAt = new Date();

  const expiresAt = new Date(
    createdAt.getTime() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  const record = {
    ID: generateId("PRT"),
    USER_ID: userId,
    TOKEN: token,
    EXPIRES_AT: expiresAt,
    USED_AT: "",
    CREATED_AT: createdAt,
  };

  insertRecord(DB.PASSWORD_RESET_TOKENS, COLUMNS.PASSWORD_RESET_TOKENS, record);

  return {
    token: token,
    expiresAt: expiresAt,
  };
}

// Validate Reset Token
function getValidPasswordResetToken(token) {
  if (!token) {
    return null;
  }

  const records = findRecords(
    DB.PASSWORD_RESET_TOKENS,
    COLUMNS.PASSWORD_RESET_TOKENS,
    {
      TOKEN: token,
    },
  );

  if (records.length === 0) {
    return null;
  }

  const record = records[0];

  // Already used.
  if (record.USED_AT) {
    return null;
  }

  const expiresAt = new Date(record.EXPIRES_AT);

  // Invalid or expired.
  if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return null;
  }

  return record;
}

// Mark the reset token as used
function consumePasswordResetToken(token) {
  const record = getValidPasswordResetToken(token);

  if (!record) {
    const error = new Error("Invalid or expired password reset token.");

    error.code = "INVALID_RESET_TOKEN";

    throw error;
  }

  updateRecordById(
    DB.PASSWORD_RESET_TOKENS,
    COLUMNS.PASSWORD_RESET_TOKENS,
    record.ID,
    {
      USED_AT: now(),
    },
  );

  return true;
}

function testPasswordResetTokenCreation() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const user = findUserByEmail(email);

  if (!user || !user.OTP) {
    throw new Error("OTP was not generated.");
  }

  const response = verifyOtp(email, user.OTP);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success || !response.data.valid || !response.data.resetToken) {
    throw new Error("Password reset token was not created.");
  }

  const token = response.data.resetToken;

  const stored = getValidPasswordResetToken(token);

  if (!stored) {
    throw new Error("Created reset token could not be validated.");
  }

  if (stored.USER_ID !== user.ID) {
    throw new Error("Reset token is linked to the wrong user.");
  }

  return successResponse(
    {
      valid: true,
      tokenCreated: true,
    },
    "Password reset token test passed.",
  );
}

function testInvalidPasswordResetToken() {
  const token = "invalid-reset-token";

  const result = getValidPasswordResetToken(token);

  if (result !== null) {
    throw new Error("Invalid reset token was accepted.");
  }

  return successResponse(
    {
      valid: false,
    },
    "Invalid reset token correctly rejected.",
  );
}

function testResetTokenConsumption() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const user = findUserByEmail(email);

  const verification = verifyOtp(email, user.OTP);

  if (!verification.success) {
    throw new Error("OTP verification failed.");
  }

  const token = verification.data.resetToken;

  consumePasswordResetToken(token);

  const result = getValidPasswordResetToken(token);

  if (result !== null) {
    throw new Error("Consumed reset token was accepted.");
  }

  return successResponse(
    {
      consumed: true,
      reusable: false,
    },
    "Reset token single-use test passed.",
  );
}

// Reset Password
function resetPassword(resetToken, newPassword) {
  requireValue(resetToken, "Reset token");

  requireValue(newPassword, "New password");

  if (String(newPassword).length < 8) {
    const error = new Error("Password must be at least 8 characters long.");

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  const resetRecord = getValidPasswordResetToken(resetToken);

  if (!resetRecord) {
    const error = new Error("Invalid or expired password reset token.");

    error.code = "INVALID_RESET_TOKEN";

    throw error;
  }

  const user = findRecordById(DB.USERS, COLUMNS.USERS, resetRecord.USER_ID);

  if (!user) {
    const error = new Error("User account could not be found.");

    error.code = "USER_NOT_FOUND";

    throw error;
  }

  const passwordHash = hashPassword(newPassword);

  updateRecordById(DB.USERS, COLUMNS.USERS, user.ID, {
    PASSWORD_HASH: passwordHash,
    OTP: "",
    OTP_EXPIRY: "",
    UPDATED_AT: now(),
  });

  consumePasswordResetToken(resetToken);

  revokeAllUserSessions(user.ID);

  return {
    success: true,
  };
}

// session revocation for a user
function revokeAllUserSessions(userId) {
  requireValue(userId, "User ID");

  const sessions = getSheetObjects(DB.SESSIONS, COLUMNS.SESSIONS);

  let revokedCount = 0;

  sessions.forEach((session) => {
    if (
      String(session.USER_ID) === String(userId) &&
      String(session.STATUS).toLowerCase() === "active"
    ) {
      updateRecordById(DB.SESSIONS, COLUMNS.SESSIONS, session.ID, {
        STATUS: "revoked",
      });

      revokedCount++;
    }
  });

  return revokedCount;
}

// Public reset
function changePassword(resetToken, newPassword) {
  return handleServerRequest(() => {
    resetPassword(resetToken, newPassword);

    return successResponse(
      null,
      "Password reset successfully. " + "Please log in with your new password.",
    );
  });
}

function testPasswordReset() {
  const testEmail = "password-reset-test@test.com";

  const oldPassword = "TestPassword123!";

  const newPassword = "ResetPassword456!";

  // --------------------------------------------------
  // 1. Reset the test user's initial state
  // --------------------------------------------------

  const setup = setupPasswordResetTestUser();

  if (!setup.success) {
    throw new Error("Could not prepare password reset test user.");
  }

  // --------------------------------------------------
  // 2. Request OTP
  // --------------------------------------------------

  createPasswordResetRequest(testEmail);

  // --------------------------------------------------
  // 3. Retrieve OTP server-side
  // --------------------------------------------------

  const userBefore = findUserByEmail(testEmail);

  if (!userBefore || !userBefore.OTP) {
    throw new Error("OTP was not generated.");
  }

  // --------------------------------------------------
  // 4. Verify OTP
  // --------------------------------------------------

  const verification = verifyOtp(testEmail, userBefore.OTP);

  if (!verification.success || !verification.data.resetToken) {
    throw new Error("OTP verification failed.");
  }

  const resetToken = verification.data.resetToken;

  // --------------------------------------------------
  // 5. Reset password
  // --------------------------------------------------

  const resetResponse = changePassword(resetToken, newPassword);

  console.log(JSON.stringify(resetResponse, null, 2));

  if (!resetResponse.success) {
    throw new Error("Password reset failed.");
  }

  // --------------------------------------------------
  // 6. Verify new password
  // --------------------------------------------------

  const newLogin = login(testEmail, newPassword);

  if (!newLogin.success) {
    throw new Error("Login with new password failed.");
  }

  // --------------------------------------------------
  // 7. Verify old password is rejected
  // --------------------------------------------------

  let oldPasswordRejected = false;

  try {
    const oldLogin = login(testEmail, oldPassword);

    // login() may return a failed response
    // instead of throwing the error.
    if (oldLogin && oldLogin.success === false) {
      oldPasswordRejected = true;
    }
  } catch (error) {
    // login() may also throw depending on
    // the authentication layer.

    if (error && error.code === "INVALID_CREDENTIALS") {
      oldPasswordRejected = true;
    } else {
      throw error;
    }
  }

  if (!oldPasswordRejected) {
    throw new Error("Old password is still valid.");
  }

  // --------------------------------------------------
  // 8. Verify OTP was consumed
  // --------------------------------------------------

  const userAfter = findUserByEmail(testEmail);

  if (userAfter.OTP || userAfter.OTP_EXPIRY) {
    throw new Error("OTP was not cleared after password reset.");
  }

  // --------------------------------------------------
  // 9. Final result
  // --------------------------------------------------

  return successResponse(
    {
      passwordChanged: true,
      newPasswordWorks: true,
      oldPasswordRejected: true,
      otpConsumed: true,
    },
    "Complete password reset test passed.",
  );
}

function testInvalidPasswordReset() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const user = findUserByEmail(email);

  const verification = verifyOtp(email, user.OTP);

  const response = changePassword(verification.data.resetToken, "123");

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Invalid password was accepted.");
  }

  if (response.error.code !== "INVALID_PASSWORD") {
    throw new Error("Unexpected error code.");
  }

  return response;
}

function testResetTokenCannotBeReused() {
  const email = "admin@test.com";

  createPasswordResetRequest(email);

  const user = findUserByEmail(email);

  const verification = verifyOtp(email, user.OTP);

  const token = verification.data.resetToken;

  const firstReset = changePassword(token, "Temporary123!");

  if (!firstReset.success) {
    throw new Error("Initial password reset failed.");
  }

  const secondReset = changePassword(token, "AnotherPassword123!");

  if (secondReset.success) {
    throw new Error("Reset token was reused.");
  }

  if (secondReset.error.code !== "INVALID_RESET_TOKEN") {
    throw new Error("Unexpected error code.");
  }

  return successResponse(
    {
      firstResetSuccessful: true,
      secondResetRejected: true,
    },
    "Reset token reuse test passed.",
  );
}

function setupPasswordResetTestUser() {
  const email = "password-reset-test@test.com";

  const password = "TestPassword123!";

  let user = findUserByEmail(email);

  const timestamp = now();

  const passwordHash = hashPassword(password);

  if (!user) {
    const userId = generateId("USR");

    insertRecord(DB.USERS, COLUMNS.USERS, {
      ID: userId,
      EMAIL: email,
      PASSWORD_HASH: passwordHash,
      NAME: "Password Reset Test User",
      ROLE: "cashier",
      PHONE: "",
      AVATAR_URL: "",
      STATUS: "active",
      OTP: "",
      OTP_EXPIRY: "",
      CREATED_AT: timestamp,
      UPDATED_AT: timestamp,
    });

    user = findUserByEmail(email);
  } else {
    updateRecordById(DB.USERS, COLUMNS.USERS, user.ID, {
      PASSWORD_HASH: passwordHash,
      STATUS: "active",
      OTP: "",
      OTP_EXPIRY: "",
      UPDATED_AT: timestamp,
    });

    user = findUserByEmail(email);
  }

  return successResponse(
    {
      email: email,
      password: password,
      userId: user.ID,
    },
    "Password reset test user is ready.",
  );
}
