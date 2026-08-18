/**
 * =====================================================
 * DATABASE CONFIGURATION
 * =====================================================
 */

const DB = {
  USERS: "Users",

  CATEGORIES: "Categories",

  SUB_CATEGORIES: "Sub_Categories",

  SHIPMENTS: "Shipments",

  SUPPLIERS: "Suppliers",

  PURCHASES: "Purchases",

  WOOD_STOCKS: "Wood_Stocks",

  CUSTOMERS: "Customers",

  SALES: "Sales",

  SALE_ITEMS: "Sale_Items",

  PAYMENTS: "Payments",

  EXPENSES: "Expenses",

  IMPORT_LOGS: "Import_Logs",

  SETTINGS: "Settings",

  ACTIVITY_LOGS: "Activity_Logs",

  SESSIONS: "Sessions",
};

/**
 * =====================================================
 * DATABASE COLUMN DEFINITIONS
 * =====================================================
 *
 * Column indexes are zero-based.
 *
 */

const COLUMNS = {
  USERS: {
    ID: 0,
    EMAIL: 1,
    PASSWORD_HASH: 2,
    NAME: 3,
    ROLE: 4,
    PHONE: 5,
    AVATAR_URL: 6,
    STATUS: 7,
    OTP: 8,
    OTP_EXPIRY: 9,
    CREATED_AT: 10,
    UPDATED_AT: 11,
  },

  CATEGORIES: {
    ID: 0,
    NAME: 1,
    DESCRIPTION: 2,
    STATUS: 3,
    CREATED_AT: 4,
    UPDATED_AT: 5,
  },

  SUB_CATEGORIES: {
    ID: 0,
    NAME: 1,
    CATEGORY_ID: 2,
    DESCRIPTION: 3,
    STATUS: 4,
    CREATED_AT: 5,
    UPDATED_AT: 6,
  },

  SHIPMENTS: {
    ID: 0,
    SHIPMENT_NUMBER: 1,
    SUPPLIER_ID: 2,
    DRIVER_NAME: 3,
    DRIVER_PHONE: 4,
    VEHICLE_NUMBER: 5,
    ARRIVAL_DATE: 6,
    TOTAL_CFT: 7,
    TOTAL_COST: 8,
    PAID_AMOUNT: 9,
    BALANCE: 10,
    STATUS: 11,
    NOTES: 12,
    CREATED_BY: 13,
    CREATED_AT: 14,
    UPDATED_AT: 15,
  },

  SUPPLIERS: {
    ID: 0,
    NAME: 1,
    PHONE: 2,
    EMAIL: 3,
    ADDRESS: 4,
    BALANCE: 5,
    STATUS: 6,
    CREATED_AT: 7,
    UPDATED_AT: 8,
  },

  PURCHASES: {
    ID: 0,
    PURCHASE_NUMBER: 1,
    SHIPMENT_ID: 2,
    SUPPLIER_ID: 3,
    TOTAL_AMOUNT: 4,
    PAID_AMOUNT: 5,
    BALANCE: 6,
    STATUS: 7,
    PURCHASE_DATE: 8,
    NOTES: 9,
    CREATED_BY: 10,
    CREATED_AT: 11,
    UPDATED_AT: 12,
  },

  WOOD_STOCKS: {
    ID: 0,
    SERIAL_NUMBER: 1,
    SHIPMENT_ID: 2,
    CATEGORY_ID: 3,
    SUB_CATEGORY_ID: 4,
    WIDTH: 5,
    LENGTH: 6,
    QUANTITY: 7,
    CFT: 8,
    BUY_RATE: 9,
    BUY_PRICE: 10,
    SELL_RATE: 11,
    SELL_PRICE: 12,
    STATUS: 13,
    PURCHASE_DATE: 14,
    SOLD_DATE: 15,
    IMAGE_URL: 16,
    NOTES: 17,
    CREATED_AT: 18,
    UPDATED_AT: 19,
  },

  CUSTOMERS: {
    ID: 0,
    NAME: 1,
    PHONE: 2,
    EMAIL: 3,
    ADDRESS: 4,
    BALANCE: 5,
    STATUS: 6,
    CREATED_AT: 7,
    UPDATED_AT: 8,
  },

  SALES: {
    ID: 0,
    INVOICE_NUMBER: 1,
    CUSTOMER_ID: 2,
    SUBTOTAL: 3,
    DISCOUNT: 4,
    TOTAL_AMOUNT: 5,
    PAID_AMOUNT: 6,
    BALANCE: 7,
    STATUS: 8,
    SALE_DATE: 9,
    CREATED_BY: 10,
    NOTES: 11,
    CREATED_AT: 12,
    UPDATED_AT: 13,
  },

  SALE_ITEMS: {
    ID: 0,
    SALE_ID: 1,
    WOOD_STOCK_ID: 2,
    SERIAL_NUMBER: 3,
    QUANTITY: 4,
    CFT: 5,
    SELL_RATE: 6,
    UNIT_PRICE: 7,
    TOTAL_PRICE: 8,
    CREATED_AT: 9,
  },

  PAYMENTS: {
    ID: 0,
    PAYMENT_NUMBER: 1,
    TYPE: 2,
    REFERENCE_ID: 3,
    CUSTOMER_ID: 4,
    SUPPLIER_ID: 5,
    AMOUNT: 6,
    PAYMENT_METHOD: 7,
    REFERENCE_NUMBER: 8,
    PAYMENT_DATE: 9,
    NOTES: 10,
    CREATED_BY: 11,
    STATUS: 12,
    CREATED_AT: 13,
    UPDATED_AT: 14,
  },

  EXPENSES: {
    ID: 0,
    CATEGORY: 1,
    DESCRIPTION: 2,
    AMOUNT: 3,
    EXPENSE_DATE: 4,
    PAYMENT_METHOD: 5,
    CREATED_BY: 6,
    STATUS: 7,
    CREATED_AT: 8,
    UPDATED_AT: 9,
  },

  IMPORT_LOGS: {
    ID: 0,
    FILE_NAME: 1,
    TOTAL_ROWS: 2,
    SUCCESSFUL_ROWS: 3,
    FAILED_ROWS: 4,
    ERROR_DETAILS: 5,
    IMPORTED_BY: 6,
    IMPORT_DATE: 7,
  },

  SETTINGS: {
    KEY: 0,
    VALUE: 1,
    DESCRIPTION: 2,
    UPDATED_AT: 3,
  },

  ACTIVITY_LOGS: {
    ID: 0,
    USER_ID: 1,
    ACTION: 2,
    ENTITY: 3,
    ENTITY_ID: 4,
    DETAILS: 5,
    CREATED_AT: 6,
  },

  SESSIONS: {
    ID: 0,
    USER_ID: 1,
    TOKEN: 2,
    CREATED_AT: 3,
    EXPIRES_AT: 4,
    STATUS: 5,
  },
};

/**
 * =====================================================
 * DATABASE HEADERS
 * =====================================================
 */

const HEADERS = {
  Users: [
    "ID",
    "Email",
    "Password_Hash",
    "Name",
    "Role",
    "Phone",
    "Avatar_URL",
    "Status",
    "OTP",
    "OTP_Expiry",
    "Created_At",
    "Updated_At",
  ],

  Categories: [
    "ID",
    "Name",
    "Description",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Sub_Categories: [
    "ID",
    "Name",
    "Category_ID",
    "Description",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Shipments: [
    "ID",
    "Shipment_Number",
    "Supplier_ID",
    "Driver_Name",
    "Driver_Phone",
    "Vehicle_Number",
    "Arrival_Date",
    "Total_CFT",
    "Total_Cost",
    "Paid_Amount",
    "Balance",
    "Status",
    "Notes",
    "Created_By",
    "Created_At",
    "Updated_At",
  ],

  Suppliers: [
    "ID",
    "Name",
    "Phone",
    "Email",
    "Address",
    "Balance",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Purchases: [
    "ID",
    "Purchase_Number",
    "Shipment_ID",
    "Supplier_ID",
    "Total_Amount",
    "Paid_Amount",
    "Balance",
    "Status",
    "Purchase_Date",
    "Notes",
    "Created_By",
    "Created_At",
    "Updated_At",
  ],

  Wood_Stocks: [
    "ID",
    "Serial_Number",
    "Shipment_ID",
    "Category_ID",
    "Sub_Category_ID",
    "Width",
    "Length",
    "Quantity",
    "CFT",
    "Buy_Rate",
    "Buy_Price",
    "Sell_Rate",
    "Sell_Price",
    "Status",
    "Purchase_Date",
    "Sold_Date",
    "Image_URL",
    "Notes",
    "Created_At",
    "Updated_At",
  ],

  Customers: [
    "ID",
    "Name",
    "Phone",
    "Email",
    "Address",
    "Balance",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Sales: [
    "ID",
    "Invoice_Number",
    "Customer_ID",
    "Subtotal",
    "Discount",
    "Total_Amount",
    "Paid_Amount",
    "Balance",
    "Status",
    "Sale_Date",
    "Created_By",
    "Notes",
    "Created_At",
    "Updated_At",
  ],

  Sale_Items: [
    "ID",
    "Sale_ID",
    "Wood_Stock_ID",
    "Serial_Number",
    "Quantity",
    "CFT",
    "Sell_Rate",
    "Unit_Price",
    "Total_Price",
    "Created_At",
  ],

  Payments: [
    "ID",
    "Payment_Number",
    "Type",
    "Reference_ID",
    "Customer_ID",
    "Supplier_ID",
    "Amount",
    "Payment_Method",
    "Reference_Number",
    "Payment_Date",
    "Notes",
    "Created_By",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Expenses: [
    "ID",
    "Category",
    "Description",
    "Amount",
    "Expense_Date",
    "Payment_Method",
    "Created_By",
    "Status",
    "Created_At",
    "Updated_At",
  ],

  Import_Logs: [
    "ID",
    "File_Name",
    "Total_Rows",
    "Successful_Rows",
    "Failed_Rows",
    "Error_Details",
    "Imported_By",
    "Import_Date",
  ],

  Settings: ["Key", "Value", "Description", "Updated_At"],

  Activity_Logs: [
    "ID",
    "User_ID",
    "Action",
    "Entity",
    "Entity_ID",
    "Details",
    "Created_At",
  ],

  Sessions: ["ID", "User_ID", "Token", "Created_At", "Expires_At", "Status"],
};
