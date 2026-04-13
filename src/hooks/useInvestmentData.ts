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
  const { useMockData, isDebugMode } = useDebugStore();

  const fetchFromAPI = useCallback(async (): Promise<InvestmentData> => {
    // 從 Vercel API 讀取（後端連接 DB）
    const [pathsRes, newsRes, macrosRes] = await Promise.all([
      fetch('/api/v1/paths'),
      fetch('/api/v1/news?limit=50'),
      fetch('/api/v1/macros'),
    ]);
    
    if (!pathsRes.ok || !newsRes.ok || !macrosRes.ok) {
      throw new Error('Failed to fetch from API');
    }
    
    const [pathsData, newsData, macrosData] = await Promise.all([
      pathsRes.json(),
      newsRes.json(),
      macrosRes.json(),
    ]);
    
    // 組裝完整數據
    const data: InvestmentData = {
      meta: {
        version: pathsData.meta.version || '3.0.0',
        lastUpdated: new Date().toISOString(),
        dataSource: 'PostgreSQL',
      },
      nodes: pathsData.data.nodes,
      switches: pathsData.data.switches,
      alert: pathsData.data.alert,
      thresholdAlert: pathsData.data.thresholdAlert,
      macros: macrosData.data.macros,
      news: newsData.data.news,
    };
    
    return data;
  }, []);

  const fetchFromJSON = useCallback(async (): Promise<InvestmentData> => {
    // 回退方案：從 JSON 文件讀取
    const response = await fetch('/data/latest.json');
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 優先從 API 讀取（DB），失敗則回退到 JSON
      let data: InvestmentData;
      
      if (useMockData) {
        // Mock 模式：從 JSON 讀取
        data = await fetchFromJSON();
      } else {
        // 生產模式：從 API 讀取（DB）
        try {
          data = await fetchFromAPI();
        } catch (apiError) {
          console.warn('API 讀取失敗，回退到 JSON:', apiError);
          data = await fetchFromJSON();
        }
      }

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
