// ==========================================
// 數據獲取 Hook（含合規審查）
// ==========================================

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useDebugStore } from '../store/useDebugStore';
import { validateInvestmentData } from '../utils/validators';
import { checkCompliance, reportViolations } from '../utils/complianceChecker';
import type { InvestmentData } from '../types';

export function useInvestmentData() {
  const { setData, setLoading, setError, investmentData } = useDataStore();
  const { useMockData, mockApiLatency, mockApiError, isDebugMode } = useDebugStore();

  const fetchFromJSON = useCallback(async (): Promise<InvestmentData> => {
    const response = await fetch('/data/latest.json');
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }, []);

  const fetchFromAPI = useCallback(async (): Promise<InvestmentData> => {
    await new Promise(resolve => setTimeout(resolve, mockApiLatency));
    if (mockApiError) throw new Error('Mock API error');
    return fetchFromJSON();
  }, [mockApiLatency, mockApiError, fetchFromJSON]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = useMockData ? await fetchFromAPI() : await fetchFromJSON();

      // 數據結構驗證
      const validation = validateInvestmentData(data);
      if (!validation.isValid) {
        console.error('數據驗證失敗:', validation.errors);
      }

      // 合規審查（數據寫入流程中必須調用）
      const complianceResult = checkCompliance(data);
      reportViolations(complianceResult, isDebugMode);

      setData(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '數據加載失敗';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [useMockData, isDebugMode, setLoading, setError, setData, fetchFromJSON, fetchFromAPI]);

  useEffect(() => {
    if (!investmentData) {
      fetchData();
    }
  }, []);

  return {
    data: investmentData,
    isLoading: useDataStore.getState().isLoading,
    error: useDataStore.getState().error,
    refresh: fetchData,
  };
}
