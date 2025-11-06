"use strict";
// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'e_evkin_modern'; // Use consistent database name
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'admin'; // Correct password from .env
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
// Suppress console logs during tests (optional)
// Uncomment if you want to suppress logs
/*
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  // Keep error for debugging
};
*/
//# sourceMappingURL=setup.js.map