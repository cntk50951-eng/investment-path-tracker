// ==========================================
// 付費狀態 Store — 精簡版
// 移除複雜的計數邏輯，改為純粹的 inline 升級引導
// ==========================================

import { create } from 'zustand';

interface PremiumState {
  isPremium: boolean;
  expiresAt: string | null;

  // 升級浮層狀態（由用戶主動觸發，不自動彈出）
  upgradePrompt: {
    visible: boolean;
    reason: string;
    anchor: 'path' | 'switch' | 'news' | null;
  };

  setPremium: (isPremium: boolean, expiresAt?: string) => void;
  showUpgradePrompt: (reason: string, anchor: 'path' | 'switch' | 'news') => void;
  hideUpgradePrompt: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  expiresAt: null,

  upgradePrompt: {
    visible: false,
    reason: '',
    anchor: null,
  },

  setPremium: (isPremium, expiresAt) => set({
    isPremium,
    expiresAt: expiresAt ?? null,
  }),

  showUpgradePrompt: (reason, anchor) => set({
    upgradePrompt: { visible: true, reason, anchor },
  }),

  hideUpgradePrompt: () => set({
    upgradePrompt: { visible: false, reason: '', anchor: null },
  }),
}));
