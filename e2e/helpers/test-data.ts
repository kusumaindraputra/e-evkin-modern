export const ADMIN = {
  username: process.env.TEST_ADMIN_USERNAME ?? 'dinkes',
  password: process.env.TEST_ADMIN_PASSWORD ?? 'dinkes123',
};

export const PUSKESMAS = {
  username: process.env.TEST_PUSK_USERNAME ?? 'leuwiliang',
  password: process.env.TEST_PUSK_PASSWORD ?? '',
  // prod user ID — used in admin API calls with ?user_id=
  id: 'd9164087-0ee2-4cc7-8982-9e5d30a7958d',
};

export const TEST_BULAN = 'Maret';
export const TEST_TAHUN = 2026;

// API base (no trailing slash)
export const API = (process.env.TEST_BASE_URL ?? 'https://192.168.102.123') + '/api';
