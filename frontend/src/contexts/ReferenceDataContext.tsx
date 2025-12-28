/**
 * ReferenceDataContext - Shared cache for reference data
 * Purpose: Prevent redundant API calls for satuan, sumber anggaran, etc.
 * Cache TTL: 1 hour (configurable)
 * Storage: localStorage for persistence across page reloads
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

interface Satuan {
  id: number;
  nama: string;
}

interface SumberAnggaran {
  id: number;
  nama: string;
}

interface Kegiatan {
  id: number;
  kode: string;
  nama: string;
}

interface SubKegiatan {
  id: number;
  id_kegiatan: number;
  kode_sub: string;
  nama: string;
  satuan_id?: number;
  satuan?: Satuan;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface ReferenceData {
  satuan: Satuan[];
  sumberAnggaran: SumberAnggaran[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
}

interface ReferenceDataContextType {
  referenceData: ReferenceData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

const ReferenceDataContext = createContext<ReferenceDataContextType | undefined>(undefined);

const CACHE_KEY = 'e-evkin-reference-data';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export const ReferenceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    satuan: [],
    sumberAnggaran: [],
    kegiatan: [],
    subKegiatan: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage cache
  const loadFromCache = useCallback((): ReferenceData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: CachedData<ReferenceData> = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_TTL) {
        // Cache expired
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to load cache:', err);
      return null;
    }
  }, []);

  // Save to localStorage cache
  const saveToCache = useCallback((data: ReferenceData) => {
    try {
      const cached: CachedData<ReferenceData> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (err) {
      console.error('Failed to save cache:', err);
    }
  }, []);

  // Fetch reference data from API
  const fetchReferenceData = useCallback(async (force = false) => {
    // Try cache first unless forced refresh
    if (!force) {
      const cached = loadFromCache();
      if (cached) {
        console.log('✅ Using cached reference data');
        setReferenceData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching reference data from API...');

      // Parallel fetch all reference data
      const [satuanRes, sumberRes, kegiatanRes, subKegiatanRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reference/satuan`),
        axios.get(`${API_BASE_URL}/reference/sumber-anggaran`),
        axios.get(`${API_BASE_URL}/masterdata/kegiatan`),
        axios.get(`${API_BASE_URL}/masterdata/sub-kegiatan`),
      ]);

      const data: ReferenceData = {
        satuan: satuanRes.data,
        sumberAnggaran: sumberRes.data,
        kegiatan: kegiatanRes.data,
        subKegiatan: subKegiatanRes.data,
      };

      setReferenceData(data);
      saveToCache(data);
      console.log('✅ Reference data loaded and cached');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load reference data';
      setError(errorMsg);
      console.error('❌ Failed to fetch reference data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  // Clear cache and refetch
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Reference data cache cleared');
    fetchReferenceData(true);
  }, [fetchReferenceData]);

  // Refetch (force refresh)
  const refetch = useCallback(async () => {
    await fetchReferenceData(true);
  }, [fetchReferenceData]);

  // Initial load on mount
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  return (
    <ReferenceDataContext.Provider value={{ referenceData, loading, error, refetch, clearCache }}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

// Custom hook for using reference data
export const useReferenceDataContext = () => {
  const context = useContext(ReferenceDataContext);
  if (context === undefined) {
    throw new Error('useReferenceDataContext must be used within ReferenceDataProvider');
  }
  return context;
};

// Individual hooks for specific reference data types
export const useSatuan = () => {
  const { referenceData, loading, error } = useReferenceDataContext();
  return { satuan: referenceData.satuan, loading, error };
};

export const useSumberAnggaran = () => {
  const { referenceData, loading, error } = useReferenceDataContext();
  return { sumberAnggaran: referenceData.sumberAnggaran, loading, error };
};

export const useKegiatan = () => {
  const { referenceData, loading, error } = useReferenceDataContext();
  return { kegiatan: referenceData.kegiatan, loading, error };
};

export const useSubKegiatan = () => {
  const { referenceData, loading, error } = useReferenceDataContext();
  return { subKegiatan: referenceData.subKegiatan, loading, error };
};
