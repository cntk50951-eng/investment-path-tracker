// ==========================================
// 數據獲取 Hook
// ==========================================

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useDebugStore } from '../store/useDebugStore';
import { validateInvestmentData } from '../utils/validators';
import type { InvestmentData } from '../types';

export function useInvestmentData() {
  const { setData, setLoading, setError, investmentData } = useDataStore();
  const { useMockData, mockApiLatency, mockApiError } = useDebugStore();

  // 從 JSON 文件加載數據
  const fetchFromJSON = useCallback(async (): Promise<InvestmentData> => {
    const response = await fetch('/data/latest.json');
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  }, []);

  // 模擬 API 調用（用於測試）
  const fetchFromAPI = useCallback(async (): Promise<InvestmentData> => {
    // 模擬延遲
    await new Promise(resolve => setTimeout(resolve, mockApiLatency));
    
    // 模擬錯誤
    if (mockApiError) {
      throw new Error('Mock API error');
    }

    return fetchFromJSON();
  }, [mockApiLatency, mockApiError, fetchFromJSON]);

  // 獲取數據
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = useMockData ? await fetchFromAPI() : await fetchFromJSON();
      
      // 驗證數據
      const validation = validateInvestmentData(data);
      if (!validation.isValid) {
        console.error('數據驗證失敗:', validation.errors);
      }

      setData(data);
    } catch (error: any) {
      setError(error.message || '數據加載失敗');
    } finally {
      setLoading(false);
    }
  }, [useMockData, setLoading, setError, setData, fetchFromJSON, fetchFromAPI]);

  // 初始化時獲取數據
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
