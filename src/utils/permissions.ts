// ==========================================
// 統一權限控制模塊 — Free / Pro 清晰邊界
//
// FREE 可見：
//   - 宏觀數據欄（完整）
//   - 流程圖結構 + 概率條（完整，非主路徑節點灰化）
//   - 路徑 Tab（可點擊，非主路徑觸發 inline 升級提示）
//   - 切換進度表（進度條 + 方向可見，點擊詳情觸發升級提示）
//   - 主路徑板塊特徵（完整）
//   - 新聞標題 + 來源（完整）
//   - 警報橫幅 / 閾值橫幅（完整，作為引流工具）
//
// PRO 專屬：
//   - 非主路徑的板塊特徵詳情
//   - 切換確認信號詳情（點擊切換行後的展開內容）
//   - 新聞摘要 + 詳情抽屜（影響分析、標籤、關聯路徑）
// ==========================================

import type { PremiumTier } from '../types';

export interface PermissionCheck {
  allowed: boolean;
  reason: string;
}

// ---- 核心判斷函數 ----

function check(allowed: boolean, reason: string): PermissionCheck {
  return { allowed, reason };
}

function isFree(tier: PremiumTier, isDebug: boolean): boolean {
  return !isDebug && tier === 'free';
}

// ---- 路徑權限 ----

/**
 * 非主路徑的板塊特徵詳情 — Pro 專屬
 * 主路徑（current=true）免費可見
 */
export function canViewPathDetail(isCurrent: boolean, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug) || isCurrent) return check(true, '');
  return check(false, '升級 Pro 解鎖全部 5 條路徑的板塊特徵');
}

// ---- 切換詳情權限 ----

/**
 * 切換確認信號詳情 — Pro 專屬
 * Free 用戶可見進度條和觸發條件，但點擊展開詳情時觸發升級提示
 */
export function canViewSwitchDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 查看完整確認信號與分析');
}

// ---- 新聞權限 ----

/**
 * 新聞摘要 + 詳情抽屜 — Pro 專屬
 * Free 用戶：標題 + 來源可見，摘要模糊，點擊觸發升級提示
 */
export function canViewNewsContent(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 解鎖完整新聞分析與影響評估');
}

// ---- 工具函數 ----

export function getUserTier(isPremium: boolean, isDebugMockPremium: boolean): PremiumTier {
  if (isDebugMockPremium) return 'pro';
  return isPremium ? 'pro' : 'free';
}
