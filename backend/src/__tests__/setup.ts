// Mock pdfjs-dist to prevent canvas dependency issues
jest.mock('pdfjs-dist/legacy/build/pdf.js', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({ items: [] })),
      })),
    }),
  })),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'evkin_db'; // Match .env configuration
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
