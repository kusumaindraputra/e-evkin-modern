import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import apiClient from '../utils/apiClient';

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
}

const CACHE_KEY = 'ref_data';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — matches backend TTL

interface CachedRef {
  data: ReferenceData;
  ts: number;
}

function readCache(): ReferenceData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRef = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: ReferenceData): void {
  try {
    const entry: CachedRef = { data, ts: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

/**
 * Custom hook untuk load reference data (sumber anggaran & satuan)
 * Caches in sessionStorage to avoid redundant API calls across page navigations
 */
export const useReferenceData = (token: string | null) => {
  const [referenceData, setReferenceData] = useState<ReferenceData>(() => {
    return readCache() || { sumberAnggaran: [], satuan: [] };
  });
  const [loading, setLoading] = useState(false);

  const loadReferenceData = useCallback(async () => {
    if (!token) return;

    // Use cached data if available
    const cached = readCache();
    if (cached && cached.sumberAnggaran.length > 0) {
      setReferenceData(cached);
      return;
    }

    setLoading(true);
    try {
      const [sumberAnggaranRes, satuanRes] = await Promise.all([
        apiClient.get('/reference/sumber-anggaran'),
        apiClient.get('/reference/satuan'),
      ]);

      const data: ReferenceData = {
        sumberAnggaran: sumberAnggaranRes.data,
        satuan: satuanRes.data,
      };

      setReferenceData(data);
      writeCache(data);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      message.error('Gagal memuat data referensi');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return { referenceData, loading, reload: loadReferenceData };
};
