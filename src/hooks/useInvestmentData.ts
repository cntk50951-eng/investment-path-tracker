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
    // 從 Vercel API 讀取（後端連接 DB）- 無緩存
    const timestamp = Date.now();
    const [pathsRes, newsRes, macrosRes] = await Promise.all([
      fetch(`/api/v1/paths?t=${timestamp}`),
      fetch(`/api/v1/news?limit=50&t=${timestamp}`),
      fetch(`/api/v1/macros?t=${timestamp}`),
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
      // 強制從 API 讀取（DB）- 無回退
      const data = await fetchFromAPI();

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
      const msg = error instanceof Error ? error.message : '數據加載失敗 - 請檢查 API 是否正常';
      console.error('❌ API 讀取失敗:', msg);
      setError(msg + '\n\nAPI: /api/v1/paths\n請確認 Vercel 已配置 POSTGRES_URL 環境變量');
      setLoading(false);
      throw error; // 向上拋出錯誤，不使用舊數據
    }
  }, [isDebugMode, setLoading, setError, setData, fetchFromAPI]);

  useEffect(() => {
    // 每次都從 API 讀取最新數據（無緩存）
    fetchData();
  }, []);

  return {
    data: investmentData,
    isLoading: useDataStore.getState().isLoading,
    error: useDataStore.getState().error,
    refresh: fetchData,
  };
}
