// ==========================================
// 數據管理 Store
// ==========================================

import { create } from 'zustand';
import type { InvestmentData, Node, Switch, NewsEvent } from '../types';

interface DataState {
  // 模塊級數據（支持增量加載）
  nodes: Record<string, any> | null;
  switches: Record<string, any> | null;
  alert: any | null;
  thresholdAlert: any | null;
  macros: any[] | null;
  marketData: any[] | null;
  news: any[] | null;
  
  // 加載狀態（模塊級）
  isLoading: boolean;
  loadingModules: {
    paths: boolean;
    news: boolean;
    macros: boolean;
  };
  
  // 錯誤狀態
  error: string | null;
  lastFetched: string | null;

  // 選中的項目
  selectedPath: string | null;
  selectedSwitch: string | null;
  selectedNews: NewsEvent | null;

  // Actions - 模塊級更新
  setNodes: (nodes: Record<string, any>) => void;
  setSwitches: (switches: Record<string, any>) => void;
  setAlert: (alert: any) => void;
  setThresholdAlert: (alert: any) => void;
  setMacros: (macros: any[]) => void;
  setMarketData: (marketData: any[]) => void;
  setNews: (news: any[]) => void;
  
  // 傳統 Actions（保持兼容）
  setData: (data: InvestmentData) => void;
  setLoading: (loading: boolean) => void;
  setLoadingModule: (module: 'paths' | 'news' | 'macros', loading: boolean) => void;
  setError: (error: string) => void;
  
  // 選擇項目
  selectPath: (pathId: string | null) => void;
  selectSwitch: (switchId: string | null) => void;
  selectNews: (news: NewsEvent | null) => void;
  
  // 工具方法
  getNode: (id: string) => Node | undefined;
  getSwitch: (id: string) => Switch | undefined;
  updateNodeProb: (id: string, prob: number) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // 初始狀態 - 模塊級數據
  nodes: null,
  switches: null,
  alert: null,
  thresholdAlert: null,
  macros: null,
  marketData: null,
  news: null,
  
  // 加載狀態
  isLoading: false,
  loadingModules: {
    paths: true,
    news: true,
    macros: true,
  },
  
  // 錯誤狀態
  error: null,
  lastFetched: null,

  selectedPath: null,
  selectedSwitch: null,
  selectedNews: null,

  // 模塊級更新 Actions
  setNodes: (nodes) => set({ nodes, lastFetched: new Date().toISOString() }),
  setSwitches: (switches) => set({ switches }),
  setAlert: (alert) => set({ alert }),
  setThresholdAlert: (thresholdAlert) => set({ thresholdAlert }),
  setMacros: (macros) => set({ macros }),
  setMarketData: (marketData) => set({ marketData }),
  setNews: (news) => set({ news, lastFetched: new Date().toISOString() }),
  
  // 傳統 Actions（兼容）
  setData: (data) => set({ 
    nodes: data.nodes,
    switches: data.switches,
    alert: data.alert,
    thresholdAlert: data.thresholdAlert,
    macros: data.macros,
    news: data.news,
    lastFetched: new Date().toISOString(),
    error: null 
  }),

  setLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingModule: (module, loading) => set((state) => ({
    loadingModules: {
      ...state.loadingModules,
      [module]: loading
    }
  })),

  setError: (error) => set({ error }),

  // 選擇項目
  selectPath: (pathId) => set({ selectedPath: pathId }),
  
  selectSwitch: (switchId) => set({ selectedSwitch: switchId }),
  
  selectNews: (news) => set({ selectedNews: news }),

  // 獲取節點
  getNode: (id) => {
    const state = get();
    return state.nodes?.[id];
  },

  // 獲取切換
  getSwitch: (id) => {
    const state = get();
    return state.switches?.[id];
  },

  // 更新節點概率
  updateNodeProb: (id, prob) => set((state) => {
    if (!state.nodes) return state;
    
    return {
      nodes: {
        ...state.nodes,
        [id]: {
          ...state.nodes[id],
          prob
        }
      }
    };
  }),
}));
