// ==========================================
// 調試模式 Store
// ==========================================

import { create } from 'zustand';

interface DebugState {
  // 基礎開關
  isDebugMode: boolean;
  canToggleDebug: boolean;

  // 付費相關
  mockPremium: boolean;
  mockAuthUser: {
    name: string;
    email: string;
    isPremium: boolean;
  } | null;

  // 數據相關
  useMockData: boolean;
  mockApiLatency: number;
  mockApiError: boolean;

  // UI 相關
  showBlurDebug: boolean;
  showPaywallPreview: boolean;

  // Actions
  toggleDebug: () => void;
  toggleMockPremium: () => void;
  setMockApiLatency: (ms: number) => void;
  toggleMockApiError: () => void;
  toggleBlurDebug: () => void;
  togglePaywallPreview: () => void;
  resetAll: () => void;
}

const isDevelopment = import.meta.env.DEV;

export const useDebugStore = create<DebugState>((set, get) => ({
  // 初始狀態 (僅開發環境可用)
  isDebugMode: isDevelopment,
  canToggleDebug: isDevelopment,

  mockPremium: false,
  mockAuthUser: null,

  useMockData: true,
  mockApiLatency: 500,
  mockApiError: false,

  showBlurDebug: false,
  showPaywallPreview: false,

  // 切換調試模式
  toggleDebug: () => {
    if (!isDevelopment) {
      console.warn('⚠️ Debug mode is only available in development');
      return;
    }
    set((state) => ({ isDebugMode: !state.isDebugMode }));
  },

  // 切換 Mock 付費狀態
  toggleMockPremium: () => set((state) => ({
    mockPremium: !state.mockPremium,
  })),

  // 設置 Mock API 延遲
  setMockApiLatency: (ms) => set({ mockApiLatency: ms }),

  // 切換 Mock API 錯誤
  toggleMockApiError: () => set((state) => ({
    mockApiError: !state.mockApiError,
  })),

  // 切換模糊調試
  toggleBlurDebug: () => set((state) => ({
    showBlurDebug: !state.showBlurDebug,
  })),

  // 切換付費牆預覽
  togglePaywallPreview: () => set((state) => ({
    showPaywallPreview: !state.showPaywallPreview,
  })),

  // 重置所有設置
  resetAll: () => set({
    isDebugMode: isDevelopment,
    mockPremium: false,
    mockAuthUser: null,
    useMockData: true,
    mockApiLatency: 500,
    mockApiError: false,
    showBlurDebug: false,
    showPaywallPreview: false,
  }),
}));

// 快捷鍵監聽
if (typeof window !== 'undefined' && isDevelopment) {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          useDebugStore.getState().toggleDebug();
          console.log('🔧 Debug mode toggled');
          break;
        case 'p':
          e.preventDefault();
          useDebugStore.getState().toggleMockPremium();
          console.log('💎 Premium mock toggled');
          break;
        case 'r':
          e.preventDefault();
          useDebugStore.getState().resetAll();
          console.log('🔄 Debug settings reset');
          break;
      }
    }
  });
}
