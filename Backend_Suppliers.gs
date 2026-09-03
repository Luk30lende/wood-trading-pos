function getSuppliers(token) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "suppliers", "view");

  return getSheetObjects(DB.SUPPLIERS, COLUMNS.SUPPLIERS);
}

function listSuppliers(token) {
  return handleServerRequest(() => {
    const suppliers = getSuppliers(token);

    return successResponse(suppliers, "Suppliers retrieved successfully.");
  });
}

function testGetSuppliers() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const response = listSuppliers(token);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Get suppliers failed.");
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Suppliers response data is not an array.");
  }

  return successResponse(
    {
      suppliersRetrieved: true,
      count: response.data.length,
    },
    "Get suppliers test passed.",
  );
}

function createSupplier(token, data) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "suppliers", "create");

  if (!data || typeof data !== "object") {
    const error = new Error("Supplier data is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  if (
    data.NAME === undefined ||
    data.NAME === null ||
    String(data.NAME).trim() === ""
  ) {
    const error = new Error("Name is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const name = String(data.NAME).trim();

  const phone =
    data.PHONE !== undefined && data.PHONE !== null
      ? String(data.PHONE).trim()
      : "";

  const email =
    data.EMAIL !== undefined && data.EMAIL !== null
      ? String(data.EMAIL).trim().toLowerCase()
      : "";

  const address =
    data.ADDRESS !== undefined && data.ADDRESS !== null
      ? String(data.ADDRESS).trim()
      : "";

  // Basic email validation when an email is provided
  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      const error = new Error("Invalid email address.");
      error.code = "INVALID_EMAIL";
      throw error;
    }
  }

  const suppliers = getSheetObjects(DB.SUPPLIERS, COLUMNS.SUPPLIERS);

  // Prevent duplicate email
  if (email) {
    const duplicateEmail = suppliers.find(
      (supplier) => String(supplier.EMAIL).trim().toLowerCase() === email,
    );

    if (duplicateEmail) {
      const error = new Error("A supplier with this email already exists.");
      error.code = "EMAIL_ALREADY_EXISTS";
      throw error;
    }
  }

  // Prevent duplicate phone
  if (phone) {
    const normalizedPhone = phone.replace(/\D/g, "");

    const duplicatePhone = suppliers.find((supplier) => {
      const existingPhone = String(supplier.PHONE).replace(/\D/g, "");

      return (
        existingPhone === normalizedPhone ||
        existingPhone.replace(/^0+/, "") === normalizedPhone.replace(/^0+/, "")
      );
    });

    if (duplicatePhone) {
      const error = new Error(
        "A supplier with this phone number already exists.",
      );
      error.code = "PHONE_ALREADY_EXISTS";
      throw error;
    }
  }

  const timestamp = now();

  const supplier = {
    ID: generateId("SUP"),
    NAME: name,
    PHONE: phone,
    EMAIL: email,
    ADDRESS: address,
    BALANCE: 0,
    STATUS: "active",
    CREATED_AT: timestamp,
    UPDATED_AT: timestamp,
  };

  insertRecord(DB.SUPPLIERS, COLUMNS.SUPPLIERS, supplier);

  return supplier;
}

function registerSupplier(token, data) {
  return handleServerRequest(() => {
    const supplier = createSupplier(token, data);

    return successResponse(supplier, "Supplier created successfully.");
  });
}

function testCreateSupplier() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const response = registerSupplier(token, {
    NAME: `Test Supplier ${Date.now()}`,
    PHONE: `0712${Math.floor(100000 + Math.random() * 900000)}`,
    EMAIL: `supplier${Date.now()}@example.com`,
    ADDRESS: "Nairobi, Kenya",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Create supplier failed.");
  }

  if (!response.data.ID) {
    throw new Error("Supplier ID was not generated.");
  }

  if (!response.data.NAME) {
    throw new Error("Supplier name was not saved.");
  }

  if (response.data.BALANCE !== 0) {
    throw new Error("New supplier balance should start at 0.");
  }

  if (response.data.STATUS !== "active") {
    throw new Error("New supplier should be active.");
  }

  if (!response.data.CREATED_AT) {
    throw new Error("Created timestamp was not generated.");
  }

  if (!response.data.UPDATED_AT) {
    throw new Error("Updated timestamp was not generated.");
  }

  return successResponse(
    {
      supplierCreated: true,
      supplier: response.data,
    },
    "Create supplier test passed.",
  );
}

function testCreateSupplierValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // 1. Missing name
  const missingNameResponse = registerSupplier(token, {
    PHONE: "0712345678",
    EMAIL: `missingname${Date.now()}@example.com`,
  });

  console.log("Missing name:", JSON.stringify(missingNameResponse, null, 2));

  if (
    missingNameResponse.success ||
    missingNameResponse.error.code !== "VALIDATION_ERROR"
  ) {
    throw new Error("Missing name validation failed.");
  }

  // 2. Invalid email
  const invalidEmailResponse = registerSupplier(token, {
    NAME: `Invalid Email Supplier ${Date.now()}`,
    EMAIL: "invalid-email",
  });

  console.log("Invalid email:", JSON.stringify(invalidEmailResponse, null, 2));

  if (
    invalidEmailResponse.success ||
    invalidEmailResponse.error.code !== "INVALID_EMAIL"
  ) {
    throw new Error("Invalid email validation failed.");
  }

  // 3. Create a supplier for duplicate testing
  const email = `duplicate${Date.now()}@example.com`;
  const phone = `0722${Math.floor(100000 + Math.random() * 900000)}`;

  const firstSupplierResponse = registerSupplier(token, {
    NAME: `Duplicate Test Supplier ${Date.now()}`,
    PHONE: phone,
    EMAIL: email,
  });

  if (!firstSupplierResponse.success) {
    throw new Error("Failed to create duplicate test supplier.");
  }

  // 4. Duplicate email
  const duplicateEmailResponse = registerSupplier(token, {
    NAME: `Another Supplier ${Date.now()}`,
    PHONE: `0733${Math.floor(100000 + Math.random() * 900000)}`,
    EMAIL: email,
  });

  console.log(
    "Duplicate email:",
    JSON.stringify(duplicateEmailResponse, null, 2),
  );

  if (
    duplicateEmailResponse.success ||
    duplicateEmailResponse.error.code !== "EMAIL_ALREADY_EXISTS"
  ) {
    throw new Error("Duplicate email validation failed.");
  }

  // 5. Duplicate phone
  const duplicatePhoneResponse = registerSupplier(token, {
    NAME: `Phone Duplicate Supplier ${Date.now()}`,
    PHONE: phone,
    EMAIL: `phone${Date.now()}@example.com`,
  });

  console.log(
    "Duplicate phone:",
    JSON.stringify(duplicatePhoneResponse, null, 2),
  );

  if (
    duplicatePhoneResponse.success ||
    duplicatePhoneResponse.error.code !== "PHONE_ALREADY_EXISTS"
  ) {
    throw new Error("Duplicate phone validation failed.");
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Create supplier validation test passed.",
  );
}

function testCreateSupplierPermission() {
  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  // Login as cashier
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  // Cashier attempts to create supplier
  const response = registerSupplier(cashierToken, {
    NAME: `Unauthorized Supplier ${Date.now()}`,
    PHONE: "0799999999",
    EMAIL: `unauthorized${Date.now()}@example.com`,
    ADDRESS: "Nairobi, Kenya",
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to create suppliers.");
  }

  if (response.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${response.error.code}.`,
    );
  }

  return successResponse(
    {
      permissionEnforced: true,
    },
    "Create supplier permission test passed.",
  );
}

function updateSupplier(token, supplierId, updates) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "suppliers", "update");

  if (!supplierId) {
    const error = new Error("Supplier ID is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  if (!updates || typeof updates !== "object") {
    const error = new Error("Supplier updates are required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const suppliers = getSheetObjects(DB.SUPPLIERS, COLUMNS.SUPPLIERS);

  const supplier = suppliers.find(
    (item) => String(item.ID) === String(supplierId),
  );

  if (!supplier) {
    const error = new Error("Supplier not found.");
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  const allowedFields = ["NAME", "PHONE", "EMAIL", "ADDRESS", "STATUS"];

  const updateFields = Object.keys(updates);

  if (updateFields.length === 0) {
    const error = new Error("At least one field is required for update.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const invalidField = updateFields.find(
    (field) => !allowedFields.includes(field),
  );

  if (invalidField) {
    const error = new Error(`Field ${invalidField} cannot be updated.`);
    error.code = "INVALID_UPDATE_FIELD";
    throw error;
  }

  // NAME
  if (updates.NAME !== undefined) {
    const name = String(updates.NAME).trim();

    if (!name) {
      const error = new Error("Name cannot be empty.");
      error.code = "INVALID_NAME";
      throw error;
    }

    supplier.NAME = name;
  }

  // PHONE
  if (updates.PHONE !== undefined) {
    const phone = updates.PHONE !== null ? String(updates.PHONE).trim() : "";

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "");

      const duplicatePhone = suppliers.find((item) => {
        if (String(item.ID) === String(supplierId)) {
          return false;
        }

        const existingPhone = String(item.PHONE || "").replace(/\D/g, "");

        return (
          existingPhone === normalizedPhone ||
          existingPhone.replace(/^0+/, "") ===
            normalizedPhone.replace(/^0+/, "")
        );
      });

      if (duplicatePhone) {
        const error = new Error(
          "A supplier with this phone number already exists.",
        );
        error.code = "PHONE_ALREADY_EXISTS";
        throw error;
      }
    }

    supplier.PHONE = phone;
  }

  // EMAIL
  if (updates.EMAIL !== undefined) {
    const email =
      updates.EMAIL !== null ? String(updates.EMAIL).trim().toLowerCase() : "";

    if (email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        const error = new Error("Invalid email address.");
        error.code = "INVALID_EMAIL";
        throw error;
      }

      const duplicateEmail = suppliers.find((item) => {
        if (String(item.ID) === String(supplierId)) {
          return false;
        }

        return (
          String(item.EMAIL || "")
            .trim()
            .toLowerCase() === email
        );
      });

      if (duplicateEmail) {
        const error = new Error("A supplier with this email already exists.");
        error.code = "EMAIL_ALREADY_EXISTS";
        throw error;
      }
    }

    supplier.EMAIL = email;
  }

  // ADDRESS
  if (updates.ADDRESS !== undefined) {
    supplier.ADDRESS =
      updates.ADDRESS !== null ? String(updates.ADDRESS).trim() : "";
  }

  // STATUS
  if (updates.STATUS !== undefined) {
    const status = String(updates.STATUS).trim().toLowerCase();

    if (!["active", "inactive"].includes(status)) {
      const error = new Error("Status must be active or inactive.");
      error.code = "INVALID_STATUS";
      throw error;
    }

    supplier.STATUS = status;
  }

  supplier.UPDATED_AT = now();

  updateRecordById(DB.SUPPLIERS, COLUMNS.SUPPLIERS, supplierId, supplier);

  return supplier;
}

function editSupplier(token, supplierId, updates) {
  return handleServerRequest(() => {
    const supplier = updateSupplier(token, supplierId, updates);

    return successResponse(supplier, "Supplier updated successfully.");
  });
}

function testUpdateSupplier() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const suppliers = suppliersResponse.data;

  if (!suppliers.length) {
    throw new Error("No suppliers found. Create a supplier first.");
  }

  const supplier = suppliers[0];

  const response = editSupplier(token, supplier.ID, {
    NAME: `Updated Supplier ${Date.now()}`,
    PHONE: "0723456789",
    EMAIL: `updated${Date.now()}@example.com`,
    ADDRESS: "Westlands, Nairobi",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error(`Supplier update failed: ${response.error.message}`);
  }

  if (response.data.NAME.indexOf("Updated Supplier") !== 0) {
    throw new Error("Supplier name was not updated.");
  }

  if (response.data.ADDRESS !== "Westlands, Nairobi") {
    throw new Error("Supplier address was not updated.");
  }

  if (response.data.STATUS !== "active") {
    throw new Error("Supplier status should remain active.");
  }

  if (response.data.BALANCE !== 0) {
    throw new Error("Supplier balance should not be modified.");
  }

  return successResponse(
    {
      updated: true,
      supplierId: response.data.ID,
    },
    "Supplier update test passed.",
  );
}

function testUpdateSupplierValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const suppliers = suppliersResponse.data;

  if (suppliers.length < 1) {
    throw new Error("At least one supplier is required for validation tests.");
  }

  const supplier = suppliers[0];

  // 1. Supplier not found
  let response = editSupplier(token, "SUP-NON-EXISTENT-999", {
    NAME: "Test",
  });

  if (response.success || response.error.code !== "SUPPLIER_NOT_FOUND") {
    throw new Error(
      `Expected SUPPLIER_NOT_FOUND but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 2. Empty name
  response = editSupplier(token, supplier.ID, {
    NAME: "   ",
  });

  if (response.success || response.error.code !== "INVALID_NAME") {
    throw new Error(
      `Expected INVALID_NAME but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 3. Invalid email
  response = editSupplier(token, supplier.ID, {
    EMAIL: "invalid-email",
  });

  if (response.success || response.error.code !== "INVALID_EMAIL") {
    throw new Error(
      `Expected INVALID_EMAIL but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 4. Invalid status
  response = editSupplier(token, supplier.ID, {
    STATUS: "pending",
  });

  if (response.success || response.error.code !== "INVALID_STATUS") {
    throw new Error(
      `Expected INVALID_STATUS but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 5. Protected ID field
  response = editSupplier(token, supplier.ID, {
    ID: "SUP-CHANGED",
  });

  if (response.success || response.error.code !== "INVALID_UPDATE_FIELD") {
    throw new Error(
      `Expected INVALID_UPDATE_FIELD for ID but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 6. Protected balance field
  response = editSupplier(token, supplier.ID, {
    BALANCE: 5000,
  });

  if (response.success || response.error.code !== "INVALID_UPDATE_FIELD") {
    throw new Error(
      `Expected INVALID_UPDATE_FIELD for BALANCE but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // 7. No fields supplied
  response = editSupplier(token, supplier.ID, {});

  if (response.success || response.error.code !== "VALIDATION_ERROR") {
    throw new Error(
      `Expected VALIDATION_ERROR but received ${
        response.error && response.error.code
      }.`,
    );
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Supplier update validation tests passed.",
  );
}

function testUpdateSupplierDuplicates() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const suppliers = suppliersResponse.data;

  if (suppliers.length < 2) {
    throw new Error("At least two suppliers are required for duplicate tests.");
  }

  const supplierOne = suppliers[0];
  const supplierTwo = suppliers[1];

  // Duplicate email
  if (!supplierTwo.EMAIL) {
    throw new Error("Supplier two does not have an email address.");
  }

  let response = editSupplier(token, supplierOne.ID, {
    EMAIL: supplierTwo.EMAIL,
  });

  if (response.success || response.error.code !== "EMAIL_ALREADY_EXISTS") {
    throw new Error(
      `Expected EMAIL_ALREADY_EXISTS but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // Duplicate phone
  if (!supplierTwo.PHONE) {
    throw new Error("Supplier two does not have a phone number.");
  }

  response = editSupplier(token, supplierOne.ID, {
    PHONE: supplierTwo.PHONE,
  });

  if (response.success || response.error.code !== "PHONE_ALREADY_EXISTS") {
    throw new Error(
      `Expected PHONE_ALREADY_EXISTS but received ${
        response.error && response.error.code
      }.`,
    );
  }

  return successResponse(
    {
      duplicateEmailBlocked: true,
      duplicatePhoneBlocked: true,
    },
    "Supplier duplicate validation tests passed.",
  );
}

function testUpdateSupplierPermission() {
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  const suppliersResponse = listSuppliers(adminToken);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  if (suppliersResponse.data.length === 0) {
    throw new Error("No suppliers found. Create a supplier first.");
  }

  const supplier = suppliersResponse.data[0];

  const response = editSupplier(cashierToken, supplier.ID, {
    NAME: `Unauthorized Update ${Date.now()}`,
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to update suppliers.");
  }

  if (response.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${response.error.code}.`,
    );
  }

  return successResponse(
    {
      permissionEnforced: true,
    },
    "Update supplier permission test passed.",
  );
}

function deactivateSupplier(token, supplierId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "suppliers", "delete");

  if (!supplierId) {
    const error = new Error("Supplier ID is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const suppliers = getSheetObjects(DB.SUPPLIERS, COLUMNS.SUPPLIERS);

  const supplier = suppliers.find(
    (item) => String(item.ID) === String(supplierId),
  );

  if (!supplier) {
    const error = new Error("Supplier not found.");
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  if (String(supplier.STATUS).toLowerCase() === "inactive") {
    const error = new Error("Supplier is already inactive.");
    error.code = "SUPPLIER_ALREADY_INACTIVE";
    throw error;
  }

  supplier.STATUS = "inactive";
  supplier.UPDATED_AT = now();

  updateRecordById(DB.SUPPLIERS, COLUMNS.SUPPLIERS, supplierId, supplier);

  return supplier;
}

function deactivateSupplierAccount(token, supplierId) {
  return handleServerRequest(() => {
    const supplier = deactivateSupplier(token, supplierId);

    return successResponse(supplier, "Supplier deactivated successfully.");
  });
}

function testDeactivateSupplier() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  if (suppliersResponse.data.length === 0) {
    throw new Error("No suppliers found. Create a supplier first.");
  }

  const supplier = suppliersResponse.data[0];

  // Make sure the supplier starts active.
  if (String(supplier.STATUS).toLowerCase() !== "active") {
    throw new Error("Test supplier must be active before deactivation.");
  }

  const response = deactivateSupplierAccount(token, supplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error(`Supplier deactivation failed: ${response.error.message}`);
  }

  if (response.data.STATUS !== "inactive") {
    throw new Error("Supplier status was not changed to inactive.");
  }

  return successResponse(
    {
      deactivated: true,
      supplierId: response.data.ID,
    },
    "Supplier deactivation test passed.",
  );
}

function testDeactivateSupplierValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const inactiveSupplier = suppliersResponse.data.find(
    (supplier) => String(supplier.STATUS).toLowerCase() === "inactive",
  );

  if (!inactiveSupplier) {
    throw new Error(
      "No inactive supplier found. Run testDeactivateSupplier() first.",
    );
  }

  // Already inactive
  let response = deactivateSupplierAccount(token, inactiveSupplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (response.success || response.error.code !== "SUPPLIER_ALREADY_INACTIVE") {
    throw new Error(
      `Expected SUPPLIER_ALREADY_INACTIVE but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // Supplier not found
  response = deactivateSupplierAccount(token, "SUP-NON-EXISTENT-999");

  if (response.success || response.error.code !== "SUPPLIER_NOT_FOUND") {
    throw new Error(
      `Expected SUPPLIER_NOT_FOUND but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // Missing supplier ID
  response = deactivateSupplierAccount(token, "");

  if (response.success || response.error.code !== "VALIDATION_ERROR") {
    throw new Error(
      `Expected VALIDATION_ERROR but received ${
        response.error && response.error.code
      }.`,
    );
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Supplier deactivation validation tests passed.",
  );
}

function testDeactivateSupplierPermission() {
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  const suppliersResponse = listSuppliers(adminToken);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  if (suppliersResponse.data.length === 0) {
    throw new Error("No suppliers found. Create a supplier first.");
  }

  const supplier = suppliersResponse.data[0];

  // Ensure the supplier is active so the request
  // reaches the permission check rather than
  // the already-inactive validation.
  if (String(supplier.STATUS).toLowerCase() === "inactive") {
    throw new Error(
      "Test supplier is inactive. Use an active supplier for this permission test.",
    );
  }

  const response = deactivateSupplierAccount(cashierToken, supplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to deactivate suppliers.");
  }

  if (response.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${response.error.code}.`,
    );
  }

  return successResponse(
    {
      permissionEnforced: true,
    },
    "Deactivate supplier permission test passed.",
  );
}

function reactivateSupplier(token, supplierId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "suppliers", "update");

  if (!supplierId) {
    const error = new Error("Supplier ID is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const suppliers = getSheetObjects(DB.SUPPLIERS, COLUMNS.SUPPLIERS);

  const supplier = suppliers.find(
    (item) => String(item.ID) === String(supplierId),
  );

  if (!supplier) {
    const error = new Error("Supplier not found.");
    error.code = "SUPPLIER_NOT_FOUND";
    throw error;
  }

  if (String(supplier.STATUS).toLowerCase() === "active") {
    const error = new Error("Supplier is already active.");
    error.code = "SUPPLIER_ALREADY_ACTIVE";
    throw error;
  }

  supplier.STATUS = "active";
  supplier.UPDATED_AT = now();

  updateRecordById(DB.SUPPLIERS, COLUMNS.SUPPLIERS, supplierId, supplier);

  return supplier;
}

function reactivateSupplierAccount(token, supplierId) {
  return handleServerRequest(() => {
    const supplier = reactivateSupplier(token, supplierId);

    return successResponse(supplier, "Supplier reactivated successfully.");
  });
}

function testReactivateSupplier() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const inactiveSupplier = suppliersResponse.data.find(
    (supplier) => String(supplier.STATUS).toLowerCase() === "inactive",
  );

  if (!inactiveSupplier) {
    throw new Error("No inactive supplier found. Deactivate a supplier first.");
  }

  const response = reactivateSupplierAccount(token, inactiveSupplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error(`Supplier reactivation failed: ${response.error.message}`);
  }

  if (response.data.STATUS !== "active") {
    throw new Error("Supplier status was not changed to active.");
  }

  return successResponse(
    {
      reactivated: true,
      supplierId: response.data.ID,
    },
    "Supplier reactivation test passed.",
  );
}

function testReactivateSupplierValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const suppliersResponse = listSuppliers(token);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const activeSupplier = suppliersResponse.data.find(
    (supplier) => String(supplier.STATUS).toLowerCase() === "active",
  );

  if (!activeSupplier) {
    throw new Error("No active supplier found.");
  }

  // Already active
  let response = reactivateSupplierAccount(token, activeSupplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (response.success || response.error.code !== "SUPPLIER_ALREADY_ACTIVE") {
    throw new Error(
      `Expected SUPPLIER_ALREADY_ACTIVE but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // Supplier not found
  response = reactivateSupplierAccount(token, "SUP-NON-EXISTENT-999");

  if (response.success || response.error.code !== "SUPPLIER_NOT_FOUND") {
    throw new Error(
      `Expected SUPPLIER_NOT_FOUND but received ${
        response.error && response.error.code
      }.`,
    );
  }

  // Missing supplier ID
  response = reactivateSupplierAccount(token, "");

  if (response.success || response.error.code !== "VALIDATION_ERROR") {
    throw new Error(
      `Expected VALIDATION_ERROR but received ${
        response.error && response.error.code
      }.`,
    );
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Supplier reactivation validation tests passed.",
  );
}

function testReactivateSupplierPermission() {
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  const suppliersResponse = listSuppliers(adminToken);

  if (!suppliersResponse.success) {
    throw new Error("Failed to retrieve suppliers.");
  }

  const inactiveSupplier = suppliersResponse.data.find(
    (supplier) => String(supplier.STATUS).toLowerCase() === "inactive",
  );

  if (!inactiveSupplier) {
    throw new Error("No inactive supplier found. Deactivate a supplier first.");
  }

  const response = reactivateSupplierAccount(cashierToken, inactiveSupplier.ID);

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to reactivate suppliers.");
  }

  if (response.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${response.error.code}.`,
    );
  }

  return successResponse(
    {
      permissionEnforced: true,
    },
    "Reactivate supplier permission test passed.",
  );
}
