// ==========================================
// 調試模式 Store
// 支持：Ctrl+Shift+D 快捷鍵 / URL 參數 ?debug=true
// 上線前一行代碼可禁用：將 ALLOW_DEBUG 設為 false
// ==========================================

import { create } from 'zustand';

// ========== 上線開關：設為 false 即可完全禁用 debug ==========
const ALLOW_DEBUG = true;
// =============================================================

const isDevelopment = import.meta.env.DEV;

// 檢查 URL 參數
function checkUrlDebug(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'true';
}

interface DebugState {
  isDebugMode: boolean;
  canToggleDebug: boolean;
  mockPremium: boolean;
  mockAuthUser: { name: string; email: string; isPremium: boolean } | null;
  useMockData: boolean;
  mockApiLatency: number;
  mockApiError: boolean;
  showBlurDebug: boolean;
  showPaywallPreview: boolean;
  showComplianceHighlight: boolean;

  toggleDebug: () => void;
  toggleMockPremium: () => void;
  setMockApiLatency: (ms: number) => void;
  toggleMockApiError: () => void;
  toggleBlurDebug: () => void;
  togglePaywallPreview: () => void;
  toggleComplianceHighlight: () => void;
  resetAll: () => void;
}

const initialDebug = ALLOW_DEBUG && (isDevelopment || checkUrlDebug());

export const useDebugStore = create<DebugState>((set) => ({
  isDebugMode: initialDebug,
  canToggleDebug: ALLOW_DEBUG,
  mockPremium: false,
  mockAuthUser: null,
  useMockData: true,
  mockApiLatency: 500,
  mockApiError: false,
  showBlurDebug: false,
  showPaywallPreview: false,
  showComplianceHighlight: false,

  toggleDebug: () => {
    if (!ALLOW_DEBUG) {
      console.warn('⚠️ Debug mode is disabled');
      return;
    }
    set((state) => ({ isDebugMode: !state.isDebugMode }));
  },

  toggleMockPremium: () => set((state) => ({ mockPremium: !state.mockPremium })),
  setMockApiLatency: (ms) => set({ mockApiLatency: ms }),
  toggleMockApiError: () => set((state) => ({ mockApiError: !state.mockApiError })),
  toggleBlurDebug: () => set((state) => ({ showBlurDebug: !state.showBlurDebug })),
  togglePaywallPreview: () => set((state) => ({ showPaywallPreview: !state.showPaywallPreview })),
  toggleComplianceHighlight: () => set((state) => ({ showComplianceHighlight: !state.showComplianceHighlight })),

  resetAll: () => set({
    isDebugMode: initialDebug,
    mockPremium: false,
    mockAuthUser: null,
    useMockData: true,
    mockApiLatency: 500,
    mockApiError: false,
    showBlurDebug: false,
    showPaywallPreview: false,
    showComplianceHighlight: false,
  }),
}));

// 快捷鍵監聽（Ctrl+Shift+D）
if (typeof window !== 'undefined' && ALLOW_DEBUG) {
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
