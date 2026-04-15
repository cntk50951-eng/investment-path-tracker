// ==========================================
// 數據獲取 Hook（增量加載模式）
// ==========================================

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useMarketStore } from '../store/useMarketStore';
import { useDebugStore } from '../store/useDebugStore';
import { validateInvestmentData } from '../utils/validators';
import { checkCompliance, reportViolations } from '../utils/complianceChecker';

export function useInvestmentData() {
  const { 
    nodes, switches, alert, thresholdAlert, macros, news,
    loadingModules, error,
    setNodes, setSwitches, setAlert, setThresholdAlert,
    setMacros, setNews,
    setLoadingModule
  } = useDataStore();
  const { currentMarket } = useMarketStore();
  const { isDebugMode } = useDebugStore();

  const fetchPaths = useCallback(async (market?: string) => {
    const m = market || currentMarket;
    const timestamp = Date.now();
    try {
      const res = await fetch(`/api/v1/paths?market=${m}&t=${timestamp}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`/api/v1/paths failed: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      
      setNodes(data.data?.nodes || {});
      setSwitches(data.data?.switches || {});
      setAlert(data.data?.alert || null);
      setThresholdAlert(data.data?.thresholdAlert || null);
      
      setLoadingModule('paths', false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '路徑數據加載失敗';
      console.error('❌ Paths API failed:', msg);
      setLoadingModule('paths', false);
    }
  }, [currentMarket, setNodes, setSwitches, setAlert, setThresholdAlert, setLoadingModule]);

  const fetchNews = useCallback(async (market?: string, append = false) => {
    const m = market || currentMarket;
    const timestamp = Date.now();
    const offset = append ? (news?.length || 0) : 0;
    const limit = 20;
    
    try {
      const res = await fetch(`/api/v1/news?market=${m}&limit=${limit}&offset=${offset}&t=${timestamp}`);
      console.log('News API Response:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('News API error:', res.status, errorText);
        throw new Error(`/api/v1/news failed: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log('News data received:', data.data?.news?.length || 0, 'items, offset:', offset);
      
      if (append && news) {
        setNews([...news, ...(data.data?.news || [])]);
      } else {
        setNews(data.data?.news || []);
      }
      setLoadingModule('news', false);
      
      return data.data?.hasMore ?? false;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '新聞數據加載失敗';
      console.error('❌ News API failed:', msg);
      setLoadingModule('news', false);
      return false;
    }
  }, [currentMarket, news, setNews, setLoadingModule]);

  const fetchMacros = useCallback(async (market?: string) => {
    const m = market || currentMarket;
    const timestamp = Date.now();
    try {
      const res = await fetch(`/api/v1/macros?market=${m}&t=${timestamp}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`/api/v1/macros failed: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      
      setMacros(data.data?.macros || []);
      setLoadingModule('macros', false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '宏觀數據加載失敗';
      console.error('❌ Macros API failed:', msg);
      setLoadingModule('macros', false);
    }
  }, [currentMarket, setMacros, setLoadingModule]);

  // 並行加載所有模塊
  useEffect(() => {
    setLoadingModule('paths', true);
    setLoadingModule('news', true);
    setLoadingModule('macros', true);
    fetchPaths();
    fetchNews();
    fetchMacros();
  }, [currentMarket]);

  // 數據加載完成後進行驗證和合規審查
  useEffect(() => {
    if (!loadingModules.paths && !loadingModules.news && !loadingModules.macros) {
      const allLoaded = nodes && news && macros;
      if (allLoaded && switches) {
        const data = {
          meta: { version: '3.0.0', lastUpdated: new Date().toISOString(), dataSource: 'PostgreSQL' },
          nodes, switches, alert, thresholdAlert, macros, news
        } as any;
        const validation = validateInvestmentData(data);
        if (!validation.isValid) {
          console.error('數據驗證失敗:', validation.errors);
        }
        const complianceResult = checkCompliance(data);
        reportViolations(complianceResult, isDebugMode);
      }
    }
  }, [loadingModules, nodes, switches, alert, thresholdAlert, macros, news, isDebugMode]);

return {
    nodes,
    switches,
    alert,
    thresholdAlert,
    macros,
    news,
    loadingModules,
    error,
    isAllLoaded: !loadingModules.paths && !loadingModules.news && !loadingModules.macros,
    refresh: () => {
      setLoadingModule('paths', true);
      setLoadingModule('news', true);
      setLoadingModule('macros', true);
      fetchPaths();
      fetchNews();
      fetchMacros();
    },
    loadMoreNews: () => fetchNews(currentMarket, true),
  };
}
