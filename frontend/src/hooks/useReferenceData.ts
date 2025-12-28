/**
 * Custom hook untuk load reference data (sumber anggaran & satuan)
 * OPTIMIZED: Now uses centralized ReferenceDataContext with caching
 * 
 * @deprecated Use individual hooks from ReferenceDataContext:
 * - useSatuan()
 * - useSumberAnggaran()
 * - useKegiatan()
 * - useSubKegiatan()
 */

import { useMemo } from 'react';
import { useReferenceDataContext } from '../contexts/ReferenceDataContext';

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
}

export const useReferenceData = (_token: string | null) => {
  // Use centralized context instead of individual API calls
  const { referenceData, loading, refetch } = useReferenceDataContext();

  // Transform to match old format for backward compatibility
  const transformedData: ReferenceData = useMemo(() => ({
    sumberAnggaran: referenceData.sumberAnggaran.map(item => ({
      value: item.id,
      label: item.nama,
    })),
    satuan: referenceData.satuan.map(item => ({
      value: item.id,
      label: item.nama,
    })),
  }), [referenceData]);

  return { 
    referenceData: transformedData, 
    loading, 
    reload: refetch 
  };
};

