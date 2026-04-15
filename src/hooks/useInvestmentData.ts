import { useEffect, useCallback, useRef } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useMarketStore } from '../store/useMarketStore';
import { useDebugStore } from '../store/useDebugStore';
import { validateInvestmentData } from '../utils/validators';
import { checkCompliance, reportViolations } from '../utils/complianceChecker';

export function useInvestmentData() {
  const setNodes = useDataStore(s => s.setNodes);
  const setSwitches = useDataStore(s => s.setSwitches);
  const setAlert = useDataStore(s => s.setAlert);
  const setThresholdAlert = useDataStore(s => s.setThresholdAlert);
  const setMacros = useDataStore(s => s.setMacros);
  const setNews = useDataStore(s => s.setNews);
  const setLoadingModule = useDataStore(s => s.setLoadingModule);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const isDebugMode = useDebugStore(s => s.isDebugMode);

  const marketRef = useRef(currentMarket);
  marketRef.current = currentMarket;

  const fetchPaths = useCallback(async (market?: string) => {
    const m = market || marketRef.current;
    try {
      const res = await fetch(`/api/v1/paths?market=${m}&t=${Date.now()}`);
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
  }, [setNodes, setSwitches, setAlert, setThresholdAlert, setLoadingModule]);

  const fetchNews = useCallback(async (market?: string, append = false) => {
    const m = market || marketRef.current;
    const limit = 20;
    let offset = 0;
    if (append) {
      const currentNews = useDataStore.getState().news;
      offset = currentNews?.length || 0;
    }

    try {
      const res = await fetch(`/api/v1/news?market=${m}&limit=${limit}&offset=${offset}&t=${Date.now()}`);
      console.log('News API Response:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('News API error:', res.status, errorText);
        throw new Error(`/api/v1/news failed: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log('News data received:', data.data?.news?.length || 0, 'items, offset:', offset);

      const newNews = data.data?.news || [];
      if (append) {
        const currentNews = useDataStore.getState().news;
        setNews([...(currentNews || []), ...newNews]);
      } else {
        setNews(newNews);
      }
      setLoadingModule('news', false);

      return data.data?.hasMore ?? (newNews.length >= limit);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '新聞數據加載失敗';
      console.error('❌ News API failed:', msg);
      setLoadingModule('news', false);
      return false;
    }
  }, [setNews, setLoadingModule]);

  const fetchMacros = useCallback(async (market?: string) => {
    const m = market || marketRef.current;
    try {
      const res = await fetch(`/api/v1/macros?market=${m}&t=${Date.now()}`);
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
  }, [setMacros, setLoadingModule]);

  useEffect(() => {
    setLoadingModule('paths', true);
    setLoadingModule('news', true);
    setLoadingModule('macros', true);
    fetchPaths();
    fetchNews();
    fetchMacros();
  }, [currentMarket, fetchPaths, fetchNews, fetchMacros, setLoadingModule]);

  useEffect(() => {
    const { loadingModules, nodes, switches, alert, thresholdAlert, macros, news } = useDataStore.getState();
    if (!loadingModules.paths && !loadingModules.news && !loadingModules.macros) {
      if (nodes && news && macros && switches) {
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
  }, [isDebugMode]);

  const loadingModules = useDataStore(s => s.loadingModules);
  const error = useDataStore(s => s.error);
  const news = useDataStore(s => s.news);

  return {
    loadingModules,
    error,
    news,
    loadMoreNews: () => fetchNews(undefined, true),
    refresh: () => {
      setLoadingModule('paths', true);
      setLoadingModule('news', true);
      setLoadingModule('macros', true);
      fetchPaths();
      fetchNews();
      fetchMacros();
    },
  };
}