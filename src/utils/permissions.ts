// ==========================================
// 統一權限控制模塊
// 所有付費門控邏輯集中在此，不分散在各組件中
// ==========================================

import type { PremiumTier } from '../types';

/**
 * 權限分層定義：
 * FREE：僅可查看主投資路徑（current=true）；新聞標題可見，內容模糊
 * PRO：可切換所有投資路徑；新聞完整可見含詳情
 */

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

// ---- 路徑權限 ----

/** 是否可以查看指定路徑的完整內容 */
export function canViewPath(_pathId: string, isCurrent: boolean, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (isDebug) return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  // FREE 用戶僅可查看當前主路徑
  if (isCurrent) return { allowed: true };
  return { allowed: false, reason: '升級 Pro 解鎖所有投資路徑' };
}

/** 是否可以切換路徑 */
export function canSwitchPath(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (isDebug) return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  return { allowed: false, reason: '路徑切換為 Pro 功能' };
}

// ---- 新聞權限 ----

/** 是否可以查看新聞詳情（summary、tags、impact） */
export function canViewNewsDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (isDebug) return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  return { allowed: false, reason: '升級 Pro 查看完整新聞分析' };
}

/** 新聞列表中哪些項目可見（FREE 用戶標題可見，內容模糊） */
export function isNewsContentVisible(tier: PremiumTier, isDebug: boolean): boolean {
  return isDebug || tier === 'pro';
}

// ---- 切換詳情權限 ----

/** 是否可以查看切換的完整確認信號 */
export function canViewSwitchDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (isDebug) return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  return { allowed: false, reason: '升級 Pro 查看完整切換信號' };
}

// ---- 板塊配置權限 ----

/** 是否可以查看非主路徑的板塊配置 */
export function canViewAllocation(isCurrent: boolean, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (isDebug) return { allowed: true };
  if (tier === 'pro') return { allowed: true };
  if (isCurrent) return { allowed: true };
  return { allowed: false, reason: '升級 Pro 查看所有路徑板塊特徵' };
}

// ---- 工具函數 ----

/** 獲取用戶的 tier */
export function getUserTier(isPremium: boolean, isDebugMockPremium: boolean): PremiumTier {
  if (isDebugMockPremium) return 'pro';
  return isPremium ? 'pro' : 'free';
}
