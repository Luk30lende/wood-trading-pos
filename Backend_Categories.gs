function getCategories(token) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "categories", "view");

  return getSheetObjects(DB.CATEGORIES, COLUMNS.CATEGORIES);
}

function listCategories(token) {
  return handleServerRequest(() => {
    const categories = getCategories(token);

    return successResponse(categories, "Categories retrieved successfully.");
  });
}

function testGetCategories() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const response = listCategories(token);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Get categories failed.");
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Categories response is not an array.");
  }

  return successResponse(
    {
      categoryCount: response.data.length,
      categories: response.data,
    },
    "Get categories test passed.",
  );
}

function createCategory(token, data) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "categories", "create");

  if (!data || typeof data !== "object") {
    const error = new Error("Category data is required.");
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
  const description = data.DESCRIPTION ? String(data.DESCRIPTION).trim() : "";

  if (!name) {
    const error = new Error("Category name cannot be empty.");
    error.code = "INVALID_NAME";
    throw error;
  }

  const categories = getSheetObjects(DB.CATEGORIES, COLUMNS.CATEGORIES);

  const duplicate = categories.find(
    (category) =>
      String(category.NAME).trim().toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    const error = new Error("A category with this name already exists.");
    error.code = "CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  const timestamp = now();

  const category = {
    ID: generateId("CAT"),
    NAME: name,
    DESCRIPTION: description,
    STATUS: "active",
    CREATED_AT: timestamp,
    UPDATED_AT: timestamp,
  };

  insertRecord(DB.CATEGORIES, COLUMNS.CATEGORIES, category);

  return category;
}

function registerCategory(token, data) {
  return handleServerRequest(() => {
    const category = createCategory(token, data);

    return successResponse(category, "Category created successfully.");
  });
}

function testCreateCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const categoryName = `Test Category ${Date.now()}`;

  const response = registerCategory(token, {
    NAME: categoryName,
    DESCRIPTION: "Category creation test.",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Create category failed.");
  }

  if (!response.data.ID) {
    throw new Error("Category ID was not generated.");
  }

  if (response.data.NAME !== categoryName) {
    throw new Error("Category name does not match.");
  }

  if (response.data.STATUS !== "active") {
    throw new Error("New category is not active.");
  }

  return successResponse(
    {
      categoryCreated: true,
      category: response.data,
    },
    "Create category test passed.",
  );
}

function testCreateCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create a known category for the duplicate test
  const categoryName = `Validation Category ${Date.now()}`;

  const createResponse = registerCategory(token, {
    NAME: categoryName,
    DESCRIPTION: "Validation test category.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create validation test category.");
  }

  // Test duplicate name
  const duplicateResponse = registerCategory(token, {
    NAME: categoryName,
    DESCRIPTION: "Duplicate category test.",
  });

  console.log("Duplicate test:", JSON.stringify(duplicateResponse, null, 2));

  if (duplicateResponse.success) {
    throw new Error("Duplicate category was allowed.");
  }

  if (
    !duplicateResponse.error ||
    duplicateResponse.error.code !== "CATEGORY_ALREADY_EXISTS"
  ) {
    throw new Error("Unexpected duplicate category error.");
  }

  // Test missing name
  const missingNameResponse = registerCategory(token, {
    DESCRIPTION: "Missing name test.",
  });

  console.log(
    "Missing name test:",
    JSON.stringify(missingNameResponse, null, 2),
  );

  if (missingNameResponse.success) {
    throw new Error("Category without a name was allowed.");
  }

  if (
    !missingNameResponse.error ||
    missingNameResponse.error.code !== "VALIDATION_ERROR"
  ) {
    throw new Error("Unexpected missing-name error.");
  }

  return successResponse(
    {
      duplicateRejected: true,
      missingNameRejected: true,
    },
    "Category validation tests passed.",
  );
}

function testCreateCategoryPermission() {
  const loginResponse = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  console.log(JSON.stringify(loginResponse, null, 2));

  if (!loginResponse.success) {
    throw new Error("Cashier login failed.");
  }

  const token = loginResponse.data.token;

  const response = registerCategory(token, {
    NAME: `Permission Test Category ${Date.now()}`,
    DESCRIPTION: "Permission test.",
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier was able to create a category.");
  }

  if (!response.error || response.error.code !== "PERMISSION_DENIED") {
    throw new Error("Unexpected permission error.");
  }

  return successResponse(
    { permissionDenied: true },
    "Create category permission test passed.",
  );
}

function updateCategory(token, categoryId, updates) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "categories", "update");
  requireValue(categoryId, "Category ID");

  if (!updates || typeof updates !== "object") {
    const error = new Error("Update data is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const existingCategory = findRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
  );

  if (!existingCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  const allowedFields = ["NAME", "DESCRIPTION", "STATUS"];

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

  if (updateData.NAME !== undefined) {
    const name = String(updateData.NAME).trim();

    if (!name) {
      const error = new Error("Name cannot be empty.");
      error.code = "INVALID_NAME";
      throw error;
    }

    const categories = getSheetObjects(DB.CATEGORIES, COLUMNS.CATEGORIES);

    const duplicate = categories.find(
      (category) =>
        String(category.NAME).trim().toLowerCase() === name.toLowerCase() &&
        String(category.ID) !== String(categoryId),
    );

    if (duplicate) {
      const error = new Error("A category with this name already exists.");
      error.code = "CATEGORY_ALREADY_EXISTS";
      throw error;
    }

    updateData.NAME = name;
  }

  if (updateData.DESCRIPTION !== undefined) {
    updateData.DESCRIPTION = String(updateData.DESCRIPTION).trim();
  }

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

  const updatedCategory = updateRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
    updateData,
  );

  if (!updatedCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedCategory;
}

function editCategory(token, categoryId, updates) {
  return handleServerRequest(() => {
    const category = updateCategory(token, categoryId, updates);

    return successResponse(category, "Category updated successfully.");
  });
}

function testUpdateCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const createResponse = registerCategory(token, {
    NAME: `Update Test Category ${Date.now()}`,
    DESCRIPTION: "Original description.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create update test category.");
  }

  const categoryId = createResponse.data.ID;

  const newName = `Updated Category ${Date.now()}`;

  const response = editCategory(token, categoryId, {
    NAME: newName,
    DESCRIPTION: "Updated description.",
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Update category failed.");
  }

  if (response.data.ID !== categoryId) {
    throw new Error("Category ID changed during update.");
  }

  if (response.data.NAME !== newName) {
    throw new Error("Category name was not updated.");
  }

  if (response.data.DESCRIPTION !== "Updated description.") {
    throw new Error("Category description was not updated.");
  }

  if (response.data.STATUS !== "active") {
    throw new Error("Category status changed unexpectedly.");
  }

  return successResponse(
    { categoryUpdated: true },
    "Update category test passed.",
  );
}

function testUpdateCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create two categories
  const firstResponse = registerCategory(token, {
    NAME: `Validation Category A ${Date.now()}`,
    DESCRIPTION: "Validation test A.",
  });

  if (!firstResponse.success) {
    throw new Error("Failed to create first test category.");
  }

  const secondResponse = registerCategory(token, {
    NAME: `Validation Category B ${Date.now()}`,
    DESCRIPTION: "Validation test B.",
  });

  if (!secondResponse.success) {
    throw new Error("Failed to create second test category.");
  }

  const categoryA = firstResponse.data;
  const categoryB = secondResponse.data;

  // Duplicate name
  const duplicateResponse = editCategory(token, categoryB.ID, {
    NAME: categoryA.NAME,
  });

  console.log("Duplicate test:", JSON.stringify(duplicateResponse, null, 2));

  if (duplicateResponse.success) {
    throw new Error("Duplicate category name was allowed.");
  }

  if (
    !duplicateResponse.error ||
    duplicateResponse.error.code !== "CATEGORY_ALREADY_EXISTS"
  ) {
    throw new Error("Unexpected duplicate-name error.");
  }

  // Invalid status
  const invalidStatusResponse = editCategory(token, categoryB.ID, {
    STATUS: "deleted",
  });

  console.log(
    "Invalid status test:",
    JSON.stringify(invalidStatusResponse, null, 2),
  );

  if (invalidStatusResponse.success) {
    throw new Error("Invalid category status was allowed.");
  }

  if (
    !invalidStatusResponse.error ||
    invalidStatusResponse.error.code !== "INVALID_STATUS"
  ) {
    throw new Error("Unexpected invalid-status error.");
  }

  // Protected field
  const protectedFieldResponse = editCategory(token, categoryB.ID, {
    ID: "CAT-MODIFIED",
  });

  console.log(
    "Protected field test:",
    JSON.stringify(protectedFieldResponse, null, 2),
  );

  if (protectedFieldResponse.success) {
    throw new Error("Protected category field was allowed.");
  }

  if (
    !protectedFieldResponse.error ||
    protectedFieldResponse.error.code !== "INVALID_UPDATE_FIELD"
  ) {
    throw new Error("Unexpected protected-field error.");
  }

  // Missing category
  const missingResponse = editCategory(token, "CAT-NONEXISTENT-123", {
    NAME: "Missing Category Test",
  });

  console.log(
    "Missing category test:",
    JSON.stringify(missingResponse, null, 2),
  );

  if (missingResponse.success) {
    throw new Error("Missing category was allowed to update.");
  }

  if (
    !missingResponse.error ||
    missingResponse.error.code !== "CATEGORY_NOT_FOUND"
  ) {
    throw new Error("Unexpected missing-category error.");
  }

  return successResponse(
    {
      duplicateRejected: true,
      invalidStatusRejected: true,
      protectedFieldRejected: true,
      missingCategoryRejected: true,
    },
    "Category update validation tests passed.",
  );
}

function testUpdateCategoryPermission() {
  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  const createResponse = registerCategory(adminToken, {
    NAME: `Permission Update Category ${Date.now()}`,
    DESCRIPTION: "Permission test.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create permission test category.");
  }

  const categoryId = createResponse.data.ID;

  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const response = editCategory(cashierToken, categoryId, {
    NAME: `Unauthorized Update ${Date.now()}`,
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier was able to update a category.");
  }

  if (!response.error || response.error.code !== "PERMISSION_DENIED") {
    throw new Error("Unexpected permission error.");
  }

  return successResponse(
    { permissionDenied: true },
    "Update category permission test passed.",
  );
}

function deactivateCategory(token, categoryId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "categories", "delete");
  requireValue(categoryId, "Category ID");

  const existingCategory = findRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
  );

  if (!existingCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(existingCategory.STATUS).toLowerCase() === "inactive") {
    const error = new Error("Category is already inactive.");
    error.code = "CATEGORY_ALREADY_INACTIVE";
    throw error;
  }

  const updatedCategory = updateRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
    {
      STATUS: "inactive",
      UPDATED_AT: now(),
    },
  );

  if (!updatedCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedCategory;
}

function deactivateCategoryAccount(token, categoryId) {
  return handleServerRequest(() => {
    const category = deactivateCategory(token, categoryId);

    return successResponse(category, "Category deactivated successfully.");
  });
}

function testDeactivateCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const createResponse = registerCategory(token, {
    NAME: `Deactivate Test Category ${Date.now()}`,
    DESCRIPTION: "Deactivation test.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create test category.");
  }

  const categoryId = createResponse.data.ID;

  const response = deactivateCategoryAccount(token, categoryId);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Category deactivation failed.");
  }

  if (response.data.STATUS !== "inactive") {
    throw new Error("Category was not deactivated.");
  }

  return successResponse(
    { deactivated: true },
    "Category deactivation test passed.",
  );
}

function testDeactivateCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const createResponse = registerCategory(token, {
    NAME: `Deactivate Validation ${Date.now()}`,
    DESCRIPTION: "Deactivation validation test.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create test category.");
  }

  const categoryId = createResponse.data.ID;

  // First deactivation
  const firstResponse = deactivateCategoryAccount(token, categoryId);

  if (!firstResponse.success) {
    throw new Error("Initial category deactivation failed.");
  }

  // Attempt to deactivate again
  const secondResponse = deactivateCategoryAccount(token, categoryId);

  console.log(
    "Already inactive test:",
    JSON.stringify(secondResponse, null, 2),
  );

  if (secondResponse.success) {
    throw new Error("Already inactive category was deactivated again.");
  }

  if (
    !secondResponse.error ||
    secondResponse.error.code !== "CATEGORY_ALREADY_INACTIVE"
  ) {
    throw new Error("Unexpected already-inactive error.");
  }

  // Non-admin permission test
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const permissionResponse = deactivateCategoryAccount(
    cashierToken,
    categoryId,
  );

  console.log("Permission test:", JSON.stringify(permissionResponse, null, 2));

  if (permissionResponse.success) {
    throw new Error("Cashier was able to deactivate a category.");
  }

  if (
    !permissionResponse.error ||
    permissionResponse.error.code !== "PERMISSION_DENIED"
  ) {
    throw new Error("Unexpected permission error.");
  }

  return successResponse(
    {
      alreadyInactiveRejected: true,
      permissionDenied: true,
    },
    "Category deactivation validation tests passed.",
  );
}

function reactivateCategory(token, categoryId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "categories", "update");
  requireValue(categoryId, "Category ID");

  const existingCategory = findRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
  );

  if (!existingCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(existingCategory.STATUS).toLowerCase() === "active") {
    const error = new Error("Category is already active.");
    error.code = "CATEGORY_ALREADY_ACTIVE";
    throw error;
  }

  const updatedCategory = updateRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
    {
      STATUS: "active",
      UPDATED_AT: now(),
    },
  );

  if (!updatedCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedCategory;
}

function reactivateCategoryAccount(token, categoryId) {
  return handleServerRequest(() => {
    const category = reactivateCategory(token, categoryId);

    return successResponse(category, "Category reactivated successfully.");
  });
}

function testReactivateCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const createResponse = registerCategory(token, {
    NAME: `Reactivate Test Category ${Date.now()}`,
    DESCRIPTION: "Reactivation test.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create test category.");
  }

  const categoryId = createResponse.data.ID;

  const deactivateResponse = deactivateCategoryAccount(token, categoryId);

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate test category.");
  }

  const response = reactivateCategoryAccount(token, categoryId);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Category reactivation failed.");
  }

  if (response.data.STATUS !== "active") {
    throw new Error("Category was not reactivated.");
  }

  return successResponse(
    { reactivated: true },
    "Category reactivation test passed.",
  );
}

function testReactivateCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = loginResponse.data.token;

  const createResponse = registerCategory(adminToken, {
    NAME: `Reactivate Validation ${Date.now()}`,
    DESCRIPTION: "Reactivation validation test.",
  });

  if (!createResponse.success) {
    throw new Error("Failed to create test category.");
  }

  const categoryId = createResponse.data.ID;

  // Already active
  const activeResponse = reactivateCategoryAccount(adminToken, categoryId);

  console.log("Already active test:", JSON.stringify(activeResponse, null, 2));

  if (activeResponse.success) {
    throw new Error("Already active category was reactivated.");
  }

  if (
    !activeResponse.error ||
    activeResponse.error.code !== "CATEGORY_ALREADY_ACTIVE"
  ) {
    throw new Error("Unexpected already-active error.");
  }

  // Deactivate so we can test permission enforcement
  const deactivateResponse = deactivateCategoryAccount(adminToken, categoryId);

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate test category.");
  }

  // Cashier attempts reactivation
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const permissionResponse = reactivateCategoryAccount(
    cashierToken,
    categoryId,
  );

  console.log("Permission test:", JSON.stringify(permissionResponse, null, 2));

  if (permissionResponse.success) {
    throw new Error("Cashier was able to reactivate a category.");
  }

  if (
    !permissionResponse.error ||
    permissionResponse.error.code !== "PERMISSION_DENIED"
  ) {
    throw new Error("Unexpected permission error.");
  }

  return successResponse(
    {
      alreadyActiveRejected: true,
      permissionDenied: true,
    },
    "Category reactivation validation tests passed.",
  );
}

function getSubCategories(token) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "sub_categories", "view");

  return getSheetObjects(DB.SUB_CATEGORIES, COLUMNS.SUB_CATEGORIES);
}

function listSubCategories(token) {
  return handleServerRequest(() => {
    const subCategories = getSubCategories(token);

    return successResponse(
      subCategories,
      "Sub-categories retrieved successfully.",
    );
  });
}

function testGetSubCategories() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const response = listSubCategories(token);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Get sub-categories failed.");
  }

  if (!Array.isArray(response.data)) {
    throw new Error("Sub-categories response is not an array.");
  }

  return successResponse(
    {
      subCategoryCount: response.data.length,
      subCategories: response.data,
    },
    "Get sub-categories test passed.",
  );
}

function createSubCategory(token, data) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "sub_categories", "create");

  if (!data || typeof data !== "object") {
    const error = new Error("Sub-category data is required.");
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

  if (
    data.CATEGORY_ID === undefined ||
    data.CATEGORY_ID === null ||
    String(data.CATEGORY_ID).trim() === ""
  ) {
    const error = new Error("Category ID is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const name = String(data.NAME).trim();
  const categoryId = String(data.CATEGORY_ID).trim();

  const description = data.DESCRIPTION ? String(data.DESCRIPTION).trim() : "";

  const parentCategory = findRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    categoryId,
  );

  if (!parentCategory) {
    const error = new Error("Parent category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(parentCategory.STATUS).toLowerCase() !== "active") {
    const error = new Error(
      "Sub-category cannot be created under an inactive category.",
    );
    error.code = "CATEGORY_INACTIVE";
    throw error;
  }

  const subCategories = getSheetObjects(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
  );

  const duplicate = subCategories.find(
    (subCategory) =>
      String(subCategory.NAME).trim().toLowerCase() === name.toLowerCase() &&
      String(subCategory.CATEGORY_ID) === categoryId,
  );

  if (duplicate) {
    const error = new Error(
      "A sub-category with this name already exists in this category.",
    );
    error.code = "SUB_CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  const timestamp = now();

  const subCategory = {
    ID: generateId("SUBCAT"),
    NAME: name,
    CATEGORY_ID: categoryId,
    DESCRIPTION: description,
    STATUS: "active",
    CREATED_AT: timestamp,
    UPDATED_AT: timestamp,
  };

  insertRecord(DB.SUB_CATEGORIES, COLUMNS.SUB_CATEGORIES, subCategory);

  return subCategory;
}

function registerSubCategory(token, data) {
  return handleServerRequest(() => {
    const subCategory = createSubCategory(token, data);

    return successResponse(subCategory, "Sub-category created successfully.");
  });
}

function testCreateSubCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  const categoryResponse = registerCategory(token, {
    NAME: `Sub-Category Test Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for sub-category test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Test Sub-Category ${Date.now()}`,
    CATEGORY_ID: categoryId,
    DESCRIPTION: "Sub-category creation test.",
  });

  console.log(JSON.stringify(subCategoryResponse, null, 2));

  if (!subCategoryResponse.success) {
    throw new Error("Create sub-category failed.");
  }

  if (!subCategoryResponse.data.ID) {
    throw new Error("Sub-category ID was not generated.");
  }

  if (subCategoryResponse.data.CATEGORY_ID !== categoryId) {
    throw new Error("Sub-category was assigned to the wrong category.");
  }

  if (subCategoryResponse.data.STATUS !== "active") {
    throw new Error("New sub-category is not active.");
  }

  return successResponse(
    {
      subCategoryCreated: true,
      subCategory: subCategoryResponse.data,
    },
    "Create sub-category test passed.",
  );
}

function testCreateSubCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create an active parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Validation Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for validation tests.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  // 1. Missing name
  const missingNameResponse = registerSubCategory(token, {
    CATEGORY_ID: categoryId,
  });

  console.log("Missing name:", JSON.stringify(missingNameResponse, null, 2));

  if (
    missingNameResponse.success ||
    missingNameResponse.error.code !== "VALIDATION_ERROR"
  ) {
    throw new Error("Missing name validation failed.");
  }

  // 2. Missing category ID
  const missingCategoryResponse = registerSubCategory(token, {
    NAME: `Missing Category ${Date.now()}`,
  });

  console.log(
    "Missing category:",
    JSON.stringify(missingCategoryResponse, null, 2),
  );

  if (
    missingCategoryResponse.success ||
    missingCategoryResponse.error.code !== "VALIDATION_ERROR"
  ) {
    throw new Error("Missing category validation failed.");
  }

  // 3. Non-existent parent category
  const invalidParentResponse = registerSubCategory(token, {
    NAME: `Invalid Parent ${Date.now()}`,
    CATEGORY_ID: "CAT-NONEXISTENT",
  });

  console.log(
    "Invalid parent:",
    JSON.stringify(invalidParentResponse, null, 2),
  );

  if (
    invalidParentResponse.success ||
    invalidParentResponse.error.code !== "CATEGORY_NOT_FOUND"
  ) {
    throw new Error("Non-existent parent validation failed.");
  }

  // 4. Create a second active category
  const secondCategoryResponse = registerCategory(token, {
    NAME: `Duplicate Scope Category ${Date.now()}`,
    DESCRIPTION: "Second category for duplicate test.",
  });

  if (!secondCategoryResponse.success) {
    throw new Error("Failed to create second category.");
  }

  const secondCategoryId = secondCategoryResponse.data.ID;

  // 5. Create first sub-category
  const firstSubCategoryResponse = registerSubCategory(token, {
    NAME: "Shared Sub-Category",
    CATEGORY_ID: categoryId,
    DESCRIPTION: "First sub-category.",
  });

  if (!firstSubCategoryResponse.success) {
    throw new Error("Failed to create first sub-category.");
  }

  // 6. Duplicate in SAME category should fail
  const duplicateResponse = registerSubCategory(token, {
    NAME: "Shared Sub-Category",
    CATEGORY_ID: categoryId,
    DESCRIPTION: "Duplicate sub-category.",
  });

  console.log("Duplicate:", JSON.stringify(duplicateResponse, null, 2));

  if (
    duplicateResponse.success ||
    duplicateResponse.error.code !== "SUB_CATEGORY_ALREADY_EXISTS"
  ) {
    throw new Error("Duplicate sub-category validation failed.");
  }

  // 7. Same name in DIFFERENT category should succeed
  const differentCategoryResponse = registerSubCategory(token, {
    NAME: "Shared Sub-Category",
    CATEGORY_ID: secondCategoryId,
    DESCRIPTION: "Same name, different parent category.",
  });

  console.log(
    "Different category:",
    JSON.stringify(differentCategoryResponse, null, 2),
  );

  if (!differentCategoryResponse.success) {
    throw new Error(
      "Same sub-category name should be allowed under a different category.",
    );
  }

  // 8. Deactivate parent category
  const deactivateResponse = deactivateCategoryAccount(token, categoryId);

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate parent category.");
  }

  // 9. Creating under inactive category should fail
  const inactiveParentResponse = registerSubCategory(token, {
    NAME: `Inactive Parent Test ${Date.now()}`,
    CATEGORY_ID: categoryId,
  });

  console.log(
    "Inactive parent:",
    JSON.stringify(inactiveParentResponse, null, 2),
  );

  if (
    inactiveParentResponse.success ||
    inactiveParentResponse.error.code !== "CATEGORY_INACTIVE"
  ) {
    throw new Error("Inactive parent validation failed.");
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Create sub-category validation test passed.",
  );
}

function testCreateSubCategoryPermission() {
  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  // Create a parent category as admin
  const categoryResponse = registerCategory(adminToken, {
    NAME: `Permission Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for permission test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  // Login as cashier
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  // Cashier attempts to create sub-category
  const response = registerSubCategory(cashierToken, {
    NAME: `Cashier Sub-Category ${Date.now()}`,
    CATEGORY_ID: categoryId,
    DESCRIPTION: "Should not be created.",
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to create sub-categories.");
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
    "Create sub-category permission test passed.",
  );
}

function updateSubCategory(token, subCategoryId, updates) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "sub_categories", "update");

  requireValue(subCategoryId, "Sub-category ID");

  if (!updates || typeof updates !== "object") {
    const error = new Error("Update data is required.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const existingSubCategory = findRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
  );

  if (!existingSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  const allowedFields = ["NAME", "CATEGORY_ID", "DESCRIPTION", "STATUS"];

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

  // Validate NAME
  if (updateData.NAME !== undefined) {
    const name = String(updateData.NAME).trim();

    if (!name) {
      const error = new Error("Name cannot be empty.");
      error.code = "INVALID_NAME";
      throw error;
    }

    updateData.NAME = name;
  }

  // Validate CATEGORY_ID
  if (updateData.CATEGORY_ID !== undefined) {
    const categoryId = String(updateData.CATEGORY_ID).trim();

    if (!categoryId) {
      const error = new Error("Category ID cannot be empty.");
      error.code = "INVALID_CATEGORY_ID";
      throw error;
    }

    const parentCategory = findRecordById(
      DB.CATEGORIES,
      COLUMNS.CATEGORIES,
      categoryId,
    );

    if (!parentCategory) {
      const error = new Error("Parent category not found.");
      error.code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    if (String(parentCategory.STATUS).toLowerCase() !== "active") {
      const error = new Error(
        "Sub-category cannot be assigned to an inactive category.",
      );
      error.code = "CATEGORY_INACTIVE";
      throw error;
    }

    updateData.CATEGORY_ID = categoryId;
  }

  // Determine the category that will own the sub-category
  const finalCategoryId =
    updateData.CATEGORY_ID !== undefined
      ? updateData.CATEGORY_ID
      : String(existingSubCategory.CATEGORY_ID);

  // Determine the final name
  const finalName =
    updateData.NAME !== undefined
      ? updateData.NAME
      : String(existingSubCategory.NAME).trim();

  // Prevent duplicate name within the same category
  const subCategories = getSheetObjects(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
  );

  const duplicate = subCategories.find(
    (subCategory) =>
      String(subCategory.ID) !== String(subCategoryId) &&
      String(subCategory.NAME).trim().toLowerCase() ===
        finalName.toLowerCase() &&
      String(subCategory.CATEGORY_ID) === finalCategoryId,
  );

  if (duplicate) {
    const error = new Error(
      "A sub-category with this name already exists in this category.",
    );
    error.code = "SUB_CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  // Validate STATUS
  if (updateData.STATUS !== undefined) {
    const status = String(updateData.STATUS).trim().toLowerCase();

    const validStatuses = ["active", "inactive"];

    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status "${status}".`);
      error.code = "INVALID_STATUS";
      throw error;
    }

    updateData.STATUS = status;
  }

  // Normalize DESCRIPTION
  if (updateData.DESCRIPTION !== undefined) {
    updateData.DESCRIPTION = String(updateData.DESCRIPTION).trim();
  }

  updateData.UPDATED_AT = now();

  const updatedSubCategory = updateRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
    updateData,
  );

  if (!updatedSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedSubCategory;
}

function editSubCategory(token, subCategoryId, updates) {
  return handleServerRequest(() => {
    const subCategory = updateSubCategory(token, subCategoryId, updates);

    return successResponse(subCategory, "Sub-category updated successfully.");
  });
}

function testUpdateSubCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Update Sub Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for update test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  // Create sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Original Sub-Category ${Date.now()}`,
    CATEGORY_ID: categoryId,
    DESCRIPTION: "Original description.",
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // Update sub-category
  const updateResponse = editSubCategory(token, subCategoryId, {
    NAME: "Updated Sub-Category",
    DESCRIPTION: "Updated description.",
  });

  console.log(JSON.stringify(updateResponse, null, 2));

  if (!updateResponse.success) {
    throw new Error("Update sub-category failed.");
  }

  if (updateResponse.data.NAME !== "Updated Sub-Category") {
    throw new Error("Sub-category name was not updated.");
  }

  if (updateResponse.data.DESCRIPTION !== "Updated description.") {
    throw new Error("Sub-category description was not updated.");
  }

  if (String(updateResponse.data.CATEGORY_ID) !== String(categoryId)) {
    throw new Error("Sub-category category assignment changed unexpectedly.");
  }

  return successResponse(
    {
      subCategoryUpdated: true,
      subCategory: updateResponse.data,
    },
    "Update sub-category test passed.",
  );
}

function testUpdateSubCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create two active parent categories
  const categoryOneResponse = registerCategory(token, {
    NAME: `Update Validation Category One ${Date.now()}`,
    DESCRIPTION: "First parent category.",
  });

  if (!categoryOneResponse.success) {
    throw new Error("Failed to create first category.");
  }

  const categoryOneId = categoryOneResponse.data.ID;

  const categoryTwoResponse = registerCategory(token, {
    NAME: `Update Validation Category Two ${Date.now()}`,
    DESCRIPTION: "Second parent category.",
  });

  if (!categoryTwoResponse.success) {
    throw new Error("Failed to create second category.");
  }

  const categoryTwoId = categoryTwoResponse.data.ID;

  // Create the sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: "Validation Sub-Category",
    CATEGORY_ID: categoryOneId,
    DESCRIPTION: "Original sub-category.",
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // Create another sub-category in category two
  const duplicateTargetResponse = registerSubCategory(token, {
    NAME: "Existing Target Sub-Category",
    CATEGORY_ID: categoryTwoId,
  });

  if (!duplicateTargetResponse.success) {
    throw new Error("Failed to create target sub-category.");
  }

  // 1. Missing/empty name
  const emptyNameResponse = editSubCategory(token, subCategoryId, {
    NAME: "   ",
  });

  console.log("Empty name:", JSON.stringify(emptyNameResponse, null, 2));

  if (
    emptyNameResponse.success ||
    emptyNameResponse.error.code !== "INVALID_NAME"
  ) {
    throw new Error("Empty name validation failed.");
  }

  // 2. Non-existent category
  const invalidCategoryResponse = editSubCategory(token, subCategoryId, {
    CATEGORY_ID: "CAT-NONEXISTENT",
  });

  console.log(
    "Invalid category:",
    JSON.stringify(invalidCategoryResponse, null, 2),
  );

  if (
    invalidCategoryResponse.success ||
    invalidCategoryResponse.error.code !== "CATEGORY_NOT_FOUND"
  ) {
    throw new Error("Non-existent category validation failed.");
  }

  // 3. Create an inactive category
  const inactiveCategoryResponse = registerCategory(token, {
    NAME: `Inactive Update Category ${Date.now()}`,
    DESCRIPTION: "Will be deactivated.",
  });

  if (!inactiveCategoryResponse.success) {
    throw new Error("Failed to create inactive test category.");
  }

  const inactiveCategoryId = inactiveCategoryResponse.data.ID;

  const deactivateResponse = deactivateCategoryAccount(
    token,
    inactiveCategoryId,
  );

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate test category.");
  }

  // 4. Assign sub-category to inactive category
  const inactiveParentResponse = editSubCategory(token, subCategoryId, {
    CATEGORY_ID: inactiveCategoryId,
  });

  console.log(
    "Inactive category:",
    JSON.stringify(inactiveParentResponse, null, 2),
  );

  if (
    inactiveParentResponse.success ||
    inactiveParentResponse.error.code !== "CATEGORY_INACTIVE"
  ) {
    throw new Error("Inactive category validation failed.");
  }

  // 5. Invalid status
  const invalidStatusResponse = editSubCategory(token, subCategoryId, {
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
    throw new Error("Invalid status validation failed.");
  }

  // 6. Invalid update field
  const invalidFieldResponse = editSubCategory(token, subCategoryId, {
    ID: "SHOULD-NOT-CHANGE",
  });

  console.log("Invalid field:", JSON.stringify(invalidFieldResponse, null, 2));

  if (
    invalidFieldResponse.success ||
    invalidFieldResponse.error.code !== "INVALID_UPDATE_FIELD"
  ) {
    throw new Error("Invalid update field validation failed.");
  }

  // 7. Duplicate name within the SAME category
  const duplicateResponse = editSubCategory(token, subCategoryId, {
    NAME: "Existing Target Sub-Category",
    CATEGORY_ID: categoryTwoId,
  });

  console.log("Duplicate:", JSON.stringify(duplicateResponse, null, 2));

  if (
    duplicateResponse.success ||
    duplicateResponse.error.code !== "SUB_CATEGORY_ALREADY_EXISTS"
  ) {
    throw new Error("Duplicate sub-category validation failed.");
  }

  // 8. Move to another category with a unique name
  const moveResponse = editSubCategory(token, subCategoryId, {
    CATEGORY_ID: categoryTwoId,
    NAME: "Moved Sub-Category",
  });

  console.log("Move:", JSON.stringify(moveResponse, null, 2));

  if (!moveResponse.success) {
    throw new Error("Moving sub-category to another active category failed.");
  }

  if (String(moveResponse.data.CATEGORY_ID) !== String(categoryTwoId)) {
    throw new Error("Sub-category was not moved to the new category.");
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Update sub-category validation test passed.",
  );
}

function testUpdateSubCategoryPermission() {
  const adminLogin = login("users-test-admin@test.com", "TestAdmin123!");

  if (!adminLogin.success) {
    throw new Error("Admin login failed.");
  }

  const adminToken = adminLogin.data.token;

  // Create parent category
  const categoryResponse = registerCategory(adminToken, {
    NAME: `Update Permission Category ${Date.now()}`,
    DESCRIPTION: "Parent category for permission test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  // Create sub-category
  const subCategoryResponse = registerSubCategory(adminToken, {
    NAME: `Permission Sub-Category ${Date.now()}`,
    CATEGORY_ID: categoryResponse.data.ID,
    DESCRIPTION: "Sub-category permission test.",
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // Login as cashier
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  // Attempt to update
  const response = editSubCategory(cashierToken, subCategoryId, {
    NAME: "Unauthorized Update",
  });

  console.log(JSON.stringify(response, null, 2));

  if (response.success) {
    throw new Error("Cashier should not be allowed to update sub-categories.");
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
    "Update sub-category permission test passed.",
  );
}

function deactivateSubCategory(token, subCategoryId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "sub_categories", "delete");

  requireValue(subCategoryId, "Sub-category ID");

  const existingSubCategory = findRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
  );

  if (!existingSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(existingSubCategory.STATUS).toLowerCase() === "inactive") {
    const error = new Error("Sub-category is already inactive.");
    error.code = "SUB_CATEGORY_ALREADY_INACTIVE";
    throw error;
  }

  const updatedSubCategory = updateRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
    {
      STATUS: "inactive",
      UPDATED_AT: now(),
    },
  );

  if (!updatedSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedSubCategory;
}

function deactivateSubCategoryAccount(token, subCategoryId) {
  return handleServerRequest(() => {
    const subCategory = deactivateSubCategory(token, subCategoryId);

    return successResponse(
      subCategory,
      "Sub-category deactivated successfully.",
    );
  });
}

function testDeactivateSubCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Deactivate Sub Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for deactivation test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  // Create sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Deactivate Test Sub ${Date.now()}`,
    CATEGORY_ID: categoryResponse.data.ID,
    DESCRIPTION: "Sub-category deactivation test.",
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // Deactivate
  const response = deactivateSubCategoryAccount(token, subCategoryId);

  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    throw new Error("Deactivate sub-category failed.");
  }

  if (response.data.STATUS !== "inactive") {
    throw new Error("Sub-category status was not changed to inactive.");
  }

  if (!response.data.UPDATED_AT) {
    throw new Error("UPDATED_AT was not updated.");
  }

  return successResponse(
    {
      subCategoryDeactivated: true,
      subCategory: response.data,
    },
    "Deactivate sub-category test passed.",
  );
}

function testDeactivateSubCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Deactivate Validation Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for validation test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  // Create sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Deactivate Validation Sub ${Date.now()}`,
    CATEGORY_ID: categoryResponse.data.ID,
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // 1. Deactivate successfully
  const firstResponse = deactivateSubCategoryAccount(token, subCategoryId);

  if (!firstResponse.success) {
    throw new Error("Initial sub-category deactivation failed.");
  }

  // 2. Attempt to deactivate again
  const alreadyInactiveResponse = deactivateSubCategoryAccount(
    token,
    subCategoryId,
  );

  console.log(
    "Already inactive:",
    JSON.stringify(alreadyInactiveResponse, null, 2),
  );

  if (
    alreadyInactiveResponse.success ||
    alreadyInactiveResponse.error.code !== "SUB_CATEGORY_ALREADY_INACTIVE"
  ) {
    throw new Error("Already-inactive validation failed.");
  }

  // 3. Non-existent sub-category
  const notFoundResponse = deactivateSubCategoryAccount(
    token,
    "SUBCAT-NONEXISTENT",
  );

  console.log("Not found:", JSON.stringify(notFoundResponse, null, 2));

  if (
    notFoundResponse.success ||
    notFoundResponse.error.code !== "SUB_CATEGORY_NOT_FOUND"
  ) {
    throw new Error("Non-existent sub-category validation failed.");
  }

  // 4. Cashier permission
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const permissionResponse = deactivateSubCategoryAccount(
    cashierToken,
    subCategoryId,
  );

  console.log(
    "Cashier permission:",
    JSON.stringify(permissionResponse, null, 2),
  );

  if (permissionResponse.success) {
    throw new Error(
      "Cashier should not be allowed to deactivate sub-categories.",
    );
  }

  if (permissionResponse.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${permissionResponse.error.code}.`,
    );
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Deactivate sub-category validation test passed.",
  );
}

function reactivateSubCategory(token, subCategoryId) {
  const currentUser = getAuthenticatedUser(token);

  if (!currentUser) {
    const error = new Error("Authentication required.");
    error.code = "AUTHENTICATION_REQUIRED";
    throw error;
  }

  requirePermission(currentUser.ROLE, "sub_categories", "update");

  requireValue(subCategoryId, "Sub-category ID");

  const existingSubCategory = findRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
  );

  if (!existingSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(existingSubCategory.STATUS).toLowerCase() === "active") {
    const error = new Error("Sub-category is already active.");
    error.code = "SUB_CATEGORY_ALREADY_ACTIVE";
    throw error;
  }

  // Make sure the parent category still exists
  // and is active before reactivating.
  const parentCategory = findRecordById(
    DB.CATEGORIES,
    COLUMNS.CATEGORIES,
    existingSubCategory.CATEGORY_ID,
  );

  if (!parentCategory) {
    const error = new Error("Parent category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  if (String(parentCategory.STATUS).toLowerCase() !== "active") {
    const error = new Error(
      "Sub-category cannot be reactivated under an inactive category.",
    );
    error.code = "CATEGORY_INACTIVE";
    throw error;
  }

  const updatedSubCategory = updateRecordById(
    DB.SUB_CATEGORIES,
    COLUMNS.SUB_CATEGORIES,
    subCategoryId,
    {
      STATUS: "active",
      UPDATED_AT: now(),
    },
  );

  if (!updatedSubCategory) {
    const error = new Error("Sub-category not found.");
    error.code = "SUB_CATEGORY_NOT_FOUND";
    throw error;
  }

  return updatedSubCategory;
}

function reactivateSubCategoryAccount(token, subCategoryId) {
  return handleServerRequest(() => {
    const subCategory = reactivateSubCategory(token, subCategoryId);

    return successResponse(
      subCategory,
      "Sub-category reactivated successfully.",
    );
  });
}

function testReactivateSubCategory() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Reactivate Sub Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for reactivation test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  // Create sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Reactivate Test Sub ${Date.now()}`,
    CATEGORY_ID: categoryId,
    DESCRIPTION: "Sub-category reactivation test.",
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // Deactivate first
  const deactivateResponse = deactivateSubCategoryAccount(token, subCategoryId);

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate sub-category.");
  }

  // Reactivate
  const reactivateResponse = reactivateSubCategoryAccount(token, subCategoryId);

  console.log(JSON.stringify(reactivateResponse, null, 2));

  if (!reactivateResponse.success) {
    throw new Error("Reactivate sub-category failed.");
  }

  if (reactivateResponse.data.STATUS !== "active") {
    throw new Error("Sub-category status was not changed to active.");
  }

  if (!reactivateResponse.data.UPDATED_AT) {
    throw new Error("UPDATED_AT was not updated.");
  }

  return successResponse(
    {
      subCategoryReactivated: true,
      subCategory: reactivateResponse.data,
    },
    "Reactivate sub-category test passed.",
  );
}

function testReactivateSubCategoryValidation() {
  const loginResponse = login("users-test-admin@test.com", "TestAdmin123!");

  if (!loginResponse.success) {
    throw new Error("Admin login failed.");
  }

  const token = loginResponse.data.token;

  // Create parent category
  const categoryResponse = registerCategory(token, {
    NAME: `Reactivate Validation Parent ${Date.now()}`,
    DESCRIPTION: "Parent category for validation test.",
  });

  if (!categoryResponse.success) {
    throw new Error("Failed to create parent category.");
  }

  const categoryId = categoryResponse.data.ID;

  // Create sub-category
  const subCategoryResponse = registerSubCategory(token, {
    NAME: `Reactivate Validation Sub ${Date.now()}`,
    CATEGORY_ID: categoryId,
  });

  if (!subCategoryResponse.success) {
    throw new Error("Failed to create sub-category.");
  }

  const subCategoryId = subCategoryResponse.data.ID;

  // 1. Already active
  const alreadyActiveResponse = reactivateSubCategoryAccount(
    token,
    subCategoryId,
  );

  console.log(
    "Already active:",
    JSON.stringify(alreadyActiveResponse, null, 2),
  );

  if (
    alreadyActiveResponse.success ||
    alreadyActiveResponse.error.code !== "SUB_CATEGORY_ALREADY_ACTIVE"
  ) {
    throw new Error("Already-active validation failed.");
  }

  // 2. Non-existent sub-category
  const notFoundResponse = reactivateSubCategoryAccount(
    token,
    "SUBCAT-NONEXISTENT",
  );

  console.log("Not found:", JSON.stringify(notFoundResponse, null, 2));

  if (
    notFoundResponse.success ||
    notFoundResponse.error.code !== "SUB_CATEGORY_NOT_FOUND"
  ) {
    throw new Error("Non-existent sub-category validation failed.");
  }

  // 3. Deactivate sub-category
  const deactivateResponse = deactivateSubCategoryAccount(token, subCategoryId);

  if (!deactivateResponse.success) {
    throw new Error("Failed to deactivate sub-category.");
  }

  // 4. Deactivate parent category
  const deactivateCategoryResponse = deactivateCategoryAccount(
    token,
    categoryId,
  );

  if (!deactivateCategoryResponse.success) {
    throw new Error("Failed to deactivate parent category.");
  }

  // 5. Attempt reactivation while parent is inactive
  const inactiveParentResponse = reactivateSubCategoryAccount(
    token,
    subCategoryId,
  );

  console.log(
    "Inactive parent:",
    JSON.stringify(inactiveParentResponse, null, 2),
  );

  if (
    inactiveParentResponse.success ||
    inactiveParentResponse.error.code !== "CATEGORY_INACTIVE"
  ) {
    throw new Error("Inactive parent validation failed.");
  }

  // Reactivate parent so the permission test
  // operates against a valid inactive sub-category.
  const reactivateCategoryResponse = reactivateCategoryAccount(
    token,
    categoryId,
  );

  if (!reactivateCategoryResponse.success) {
    throw new Error("Failed to reactivate parent category.");
  }

  // 6. Cashier permission
  const cashierLogin = login(
    "password-reset-test@test.com",
    "TestPassword123!",
  );

  if (!cashierLogin.success) {
    throw new Error("Cashier login failed.");
  }

  const cashierToken = cashierLogin.data.token;

  const permissionResponse = reactivateSubCategoryAccount(
    cashierToken,
    subCategoryId,
  );

  console.log(
    "Cashier permission:",
    JSON.stringify(permissionResponse, null, 2),
  );

  if (permissionResponse.success) {
    throw new Error(
      "Cashier should not be allowed to reactivate sub-categories.",
    );
  }

  if (permissionResponse.error.code !== "PERMISSION_DENIED") {
    throw new Error(
      `Expected PERMISSION_DENIED but received ${permissionResponse.error.code}.`,
    );
  }

  return successResponse(
    {
      validationPassed: true,
    },
    "Reactivate sub-category validation test passed.",
  );
}
