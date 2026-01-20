import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import apiClient from '../utils/apiClient';

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
}

/**
 * Custom hook untuk load reference data (sumber anggaran & satuan)
 * Includes caching untuk avoid redundant API calls
 */
export const useReferenceData = (token: string | null) => {
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sumberAnggaran: [],
    satuan: [],
  });
  const [loading, setLoading] = useState(false);

  const loadReferenceData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [sumberAnggaranRes, satuanRes] = await Promise.all([
        apiClient.get('/reference/sumber-anggaran'),
        apiClient.get('/reference/satuan'),
      ]);

      setReferenceData({
        sumberAnggaran: sumberAnggaranRes.data,
        satuan: satuanRes.data,
      });
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
