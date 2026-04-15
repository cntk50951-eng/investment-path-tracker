import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useMarketStore } from '../store/useMarketStore';
import { useDebugStore } from '../store/useDebugStore';
import { validateInvestmentData } from '../utils/validators';
import { checkCompliance, reportViolations } from '../utils/complianceChecker';

async function fetchPathsData(market: string) {
  try {
    const res = await fetch(`/api/v1/paths?market=${market}&t=${Date.now()}`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`/api/v1/paths failed: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    useDataStore.getState().setNodes(data.data?.nodes || {});
    useDataStore.getState().setSwitches(data.data?.switches || {});
    useDataStore.getState().setAlert(data.data?.alert || null);
    useDataStore.getState().setThresholdAlert(data.data?.thresholdAlert || null);
    useDataStore.getState().setLoadingModule('paths', false);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '路徑數據加載失敗';
    console.error('❌ Paths API failed:', msg);
    useDataStore.getState().setLoadingModule('paths', false);
  }
}

export async function fetchNewsData(market: string, append = false) {
  const limit = 20;
  let offset = 0;
  if (append) {
    const currentNews = useDataStore.getState().news;
    offset = currentNews?.length || 0;
  }

  try {
    const res = await fetch(`/api/v1/news?market=${market}&limit=${limit}&offset=${offset}&t=${Date.now()}`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`/api/v1/news failed: ${res.status} - ${errorText}`);
    }
    const data = await res.json();

    const newNews = data.data?.news || [];
    if (append) {
      const currentNews = useDataStore.getState().news;
      useDataStore.getState().setNews([...(currentNews || []), ...newNews]);
    } else {
      useDataStore.getState().setNews(newNews);
    }
    useDataStore.getState().setLoadingModule('news', false);

    return data.data?.hasMore ?? (newNews.length >= limit);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '新聞數據加載失敗';
    console.error('❌ News API failed:', msg);
    useDataStore.getState().setLoadingModule('news', false);
    return false;
  }
}

async function fetchMacrosData(market: string) {
  try {
    const res = await fetch(`/api/v1/macros?market=${market}&t=${Date.now()}`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`/api/v1/macros failed: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    useDataStore.getState().setMacros(data.data?.macros || []);
    useDataStore.getState().setLoadingModule('macros', false);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '宏觀數據加載失敗';
    console.error('❌ Macros API failed:', msg);
    useDataStore.getState().setLoadingModule('macros', false);
  }
}

export function fetchAllData(market: string) {
  useDataStore.getState().setLoadingModule('paths', true);
  useDataStore.getState().setLoadingModule('news', true);
  useDataStore.getState().setLoadingModule('macros', true);
  fetchPathsData(market);
  fetchNewsData(market);
  fetchMacrosData(market);
}

export function useInitialDataFetch() {
  const currentMarket = useMarketStore(s => s.currentMarket);
  const isDebugMode = useDebugStore(s => s.isDebugMode);

  useEffect(() => {
    fetchAllData(currentMarket);
  }, [currentMarket]);

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

  return {
    refresh: () => fetchAllData(currentMarket),
    loadMoreNews: () => fetchNewsData(currentMarket, true),
  };
}