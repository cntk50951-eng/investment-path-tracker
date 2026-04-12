// ==========================================
// 數據管理 Store
// ==========================================

import { create } from 'zustand';
import type { InvestmentData, Node, Switch, NewsEvent } from '../types';

interface DataState {
  // 數據
  investmentData: InvestmentData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;

  // 選中的項目
  selectedPath: string | null;
  selectedSwitch: string | null;
  selectedNews: NewsEvent | null;

  // Actions
  setData: (data: InvestmentData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  
  selectPath: (pathId: string | null) => void;
  selectSwitch: (switchId: string | null) => void;
  selectNews: (news: NewsEvent | null) => void;
  
  getNode: (id: string) => Node | undefined;
  getSwitch: (id: string) => Switch | undefined;
  updateNodeProb: (id: string, prob: number) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // 初始狀態
  investmentData: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  selectedPath: null,
  selectedSwitch: null,
  selectedNews: null,

  // 設置數據
  setData: (data) => set({ 
    investmentData: data, 
    lastFetched: new Date().toISOString(),
    error: null 
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // 選擇項目
  selectPath: (pathId) => set({ selectedPath: pathId }),
  
  selectSwitch: (switchId) => set({ selectedSwitch: switchId }),
  
  selectNews: (news) => set({ selectedNews: news }),

  // 獲取節點
  getNode: (id) => {
    const data = get().investmentData;
    return data?.nodes[id];
  },

  // 獲取切換
  getSwitch: (id) => {
    const data = get().investmentData;
    return data?.switches[id];
  },

  // 更新節點概率
  updateNodeProb: (id, prob) => set((state) => {
    if (!state.investmentData) return state;
    
    return {
      investmentData: {
        ...state.investmentData,
        nodes: {
          ...state.investmentData.nodes,
          [id]: {
            ...state.investmentData.nodes[id],
            prob
          }
        }
      }
    };
  }),
}));
