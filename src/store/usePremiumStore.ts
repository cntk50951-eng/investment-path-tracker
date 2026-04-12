// ==========================================
// 付費狀態 Store
// ==========================================

import { create } from 'zustand';

interface PremiumState {
  // 狀態
  isPremium: boolean;
  expiresAt: string | null;
  hasDismissedPaywall: boolean;
  paywallCount: number;

  // Actions
  setPremium: (isPremium: boolean, expiresAt?: string) => void;
  incrementPaywallCount: () => void;
  dismissPaywall: () => void;
  resetPaywallCount: () => void;
  shouldShowPaywall: () => boolean;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  // 初始狀態
  isPremium: false,
  expiresAt: null,
  hasDismissedPaywall: false,
  paywallCount: 0,

  // 設置付費狀態
  setPremium: (isPremium, expiresAt) => set({
    isPremium,
    expiresAt: expiresAt || null,
  }),

  // 增加付費牆顯示次數
  incrementPaywallCount: () => set((state) => ({
    paywallCount: state.paywallCount + 1,
  })),

  // 關閉付費牆
  dismissPaywall: () => set({
    hasDismissedPaywall: true,
  }),

  // 重置付費牆計數
  resetPaywallCount: () => set({
    paywallCount: 0,
    hasDismissedPaywall: false,
  }),

  // 是否應該顯示付費牆 (溫和策略)
  shouldShowPaywall: () => {
    const state = get();
    
    // 付費用戶不顯示
    if (state.isPremium) return false;
    
    // 前 2 次點擊不顯示完整付費牆
    if (state.paywallCount < 2) return false;
    
    // 每 5 次點擊顯示一次完整付費牆
    return state.paywallCount % 5 === 0;
  },
}));
