/**
 * API Configuration
 * Dynamically determines the base URL based on environment
 */

const API_BASE_URL = (() => {
  // In production, use relative path to current host
  if (window.location.hostname !== 'localhost') {
    return '/api';
  }
  // In development, use localhost:5000
  return 'http://localhost:5000/api';
})();

export default API_BASE_URL;
