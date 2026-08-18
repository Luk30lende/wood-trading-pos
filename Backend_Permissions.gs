/**
 * =====================================================
 * PERMISSION ENGINE
 * =====================================================
 */

/**
 * Application roles.
 */
const ROLES = {
  ADMIN: "admin",

  MANAGER: "manager",

  CASHIER: "cashier",

  WAREHOUSE_STAFF: "warehouse_staff",
};

/**
 * Permission actions.
 */
const PERMISSION_ACTIONS = {
  VIEW: "view",

  CREATE: "create",

  UPDATE: "update",

  DELETE: "delete",
};

/**
 * Permission resources.
 */
const PERMISSION_RESOURCES = {
  USERS: "users",

  CATEGORIES: "categories",

  SUB_CATEGORIES: "sub_categories",

  SHIPMENTS: "shipments",

  SUPPLIERS: "suppliers",

  PURCHASES: "purchases",

  WOOD_STOCKS: "wood_stocks",

  CUSTOMERS: "customers",

  SALES: "sales",

  SALE_ITEMS: "sale_items",

  PAYMENTS: "payments",

  EXPENSES: "expenses",

  IMPORT_LOGS: "import_logs",

  SETTINGS: "settings",

  ACTIVITY_LOGS: "activity_logs",

  REPORTS: "reports",
};

/**
 * Defines what each role can do.
 *
 * true  = allowed
 * false = denied
 */
const PERMISSIONS = {
  admin: {
    users: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    categories: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    sub_categories: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    shipments: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    suppliers: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    purchases: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    wood_stocks: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    customers: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    sales: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    sale_items: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    payments: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    expenses: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    import_logs: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    settings: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    activity_logs: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    reports: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
  },

  manager: {
    users: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    categories: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    sub_categories: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    shipments: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    suppliers: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    purchases: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    wood_stocks: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    customers: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    sales: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    sale_items: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    payments: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    expenses: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    import_logs: {
      view: true,
      create: true,
      update: false,
      delete: false,
    },

    settings: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    activity_logs: {
      view: true,
      create: true,
      update: false,
      delete: false,
    },

    reports: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
  },

  cashier: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    categories: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    sub_categories: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    shipments: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    suppliers: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    purchases: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    wood_stocks: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    customers: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    sales: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    sale_items: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    payments: {
      view: true,
      create: true,
      update: false,
      delete: false,
    },

    expenses: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    import_logs: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    settings: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    activity_logs: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    reports: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },
  },

  warehouse_staff: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    categories: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    sub_categories: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    shipments: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    suppliers: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    purchases: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },

    wood_stocks: {
      view: true,
      create: true,
      update: true,
      delete: false,
    },

    customers: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    sales: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    sale_items: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    payments: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    expenses: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    import_logs: {
      view: true,
      create: true,
      update: false,
      delete: false,
    },

    settings: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },

    activity_logs: {
      view: false,
      create: true,
      update: false,
      delete: false,
    },

    reports: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },
  },
};

/**
 * Checks whether a role has permission to perform
 * an action on a resource.
 *
 * @param {string} role
 * @param {string} resource
 * @param {string} action
 * @returns {boolean}
 */
function hasPermission(role, resource, action) {
  if (!role) {
    return false;
  }

  if (!PERMISSIONS[role]) {
    return false;
  }

  if (!PERMISSIONS[role][resource]) {
    return false;
  }

  return Boolean(PERMISSIONS[role][resource][action]);
}

/**
 * Requires a role to have a specific permission.
 *
 * Throws an error when permission is denied.
 *
 * @param {string} role
 * @param {string} resource
 * @param {string} action
 */
function requirePermission(role, resource, action) {
  if (!hasPermission(role, resource, action)) {
    const error = new Error(
      `You do not have permission to ${action} ${resource}.`,
    );

    error.code = "PERMISSION_DENIED";

    throw error;
  }
}

/**
 * Tests the permission engine using all four roles.
 */
function testPermissionEngine() {
  return handleServerRequest(() => {
    const results = {
      admin: {
        createSale: hasPermission(
          ROLES.ADMIN,
          PERMISSION_RESOURCES.SALES,
          PERMISSION_ACTIONS.CREATE,
        ),

        deleteUser: hasPermission(
          ROLES.ADMIN,
          PERMISSION_RESOURCES.USERS,
          PERMISSION_ACTIONS.DELETE,
        ),
      },

      manager: {
        createSale: hasPermission(
          ROLES.MANAGER,
          PERMISSION_RESOURCES.SALES,
          PERMISSION_ACTIONS.CREATE,
        ),

        deletePurchase: hasPermission(
          ROLES.MANAGER,
          PERMISSION_RESOURCES.PURCHASES,
          PERMISSION_ACTIONS.DELETE,
        ),
      },

      cashier: {
        createSale: hasPermission(
          ROLES.CASHIER,
          PERMISSION_RESOURCES.SALES,
          PERMISSION_ACTIONS.CREATE,
        ),

        deleteSale: hasPermission(
          ROLES.CASHIER,
          PERMISSION_RESOURCES.SALES,
          PERMISSION_ACTIONS.DELETE,
        ),
      },

      warehouse_staff: {
        createStock: hasPermission(
          ROLES.WAREHOUSE_STAFF,
          PERMISSION_RESOURCES.WOOD_STOCKS,
          PERMISSION_ACTIONS.CREATE,
        ),

        createSale: hasPermission(
          ROLES.WAREHOUSE_STAFF,
          PERMISSION_RESOURCES.SALES,
          PERMISSION_ACTIONS.CREATE,
        ),
      },
    };

    console.log(JSON.stringify(results, null, 2));

    return successResponse(results, "Permission engine test completed.");
  });
}

/**
 * Tests server-side permission enforcement.
 */
function testPermissionEnforcement() {
  const response = handleServerRequest(() => {
    requirePermission(
      ROLES.CASHIER,
      PERMISSION_RESOURCES.SALES,
      PERMISSION_ACTIONS.DELETE,
    );

    return successResponse(null, "This should never be reached.");
  });

  console.log(JSON.stringify(response, null, 2));

  return response;
}

/**
 * Requires an authenticated user to have
 * permission for a resource/action.
 *
 * The role is obtained from the server-side
 * authenticated user, never from the client.
 *
 * @param {string} token
 * @param {string} resource
 * @param {string} action
 * @returns {Object} authenticated user
 */
function requireAuthenticatedPermission(token, resource, action) {
  const user = requireAuthentication(token);

  requirePermission(user.ROLE, resource, action);

  return user;
}

function testAuthenticatedPermission() {
  const loginResponse = login("admin@test.com", "Admin123!");

  if (!loginResponse.success) {
    throw new Error("Login failed.");
  }

  const token = loginResponse.data.token;

  const user = requireAuthenticatedPermission(
    token,
    PERMISSION_RESOURCES.SALES,
    PERMISSION_ACTIONS.CREATE,
  );

  console.log(
    JSON.stringify(
      {
        user: sanitizeUser(user),
        permission: "sales.create",
      },
      null,
      2,
    ),
  );

  return successResponse(
    {
      user: sanitizeUser(user),
      permission: "sales.create",
      allowed: true,
    },
    "Authenticated permission test passed.",
  );
}
