// ==========================================
// 統一權限控制模塊 — Free / Pro 清晰邊界
//
// FREE 可見：
//   - 宏觀數據欄（完整）
//   - 閾值橫幅（僅主路徑→最大切換）
//   - 流程圖結構 + 概率條（完整）
//   - 非主路徑的板塊特徵模糊處理
//   - 切換進度表（進度條可見，信號詳情模糊）
//   - 新聞列表（前 10 條僅標題，10 條後完全模糊）
//   - 新聞詳情（僅標題 + 日期 + 來源）
//
// PRO 專屬：
//   - 非主路徑的板塊特徵詳情
//   - 切換確認信號詳情
//   - 新聞摘要 + 詳情（影響分析、標籤、關聯路徑）
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

// ---- 新聞權限 ----

/**
 * 新聞內容查看權限
 * FREE：前 10 條僅標題可見，摘要模糊；10 條後完全模糊
 * PRO：完整內容
 */
export function canViewNewsContent(tier: PremiumTier, isDebug: boolean, index?: number): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  
  // 免費用戶：前 10 條可見標題，但摘要模糊
  if (index !== undefined && index < 10) {
    return check(false, '免費用戶僅可見新聞標題');
  }
  
  return check(false, '升級 Pro 解鎖完整新聞分析與影響評估');
}

/**
 * 新聞詳情查看權限
 * FREE：僅標題 + 日期 + 來源可見
 * PRO：完整詳情（摘要、影響分析、標籤、關聯路徑）
 */
export function canViewNewsDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 查看完整新聞詳情');
}

// ---- 路徑權限 ----

/**
 * 路徑板塊詳情權限
 * FREE：僅當前主路徑可見，其他路徑模糊
 * PRO：全部路徑詳情
 */
export function canViewPathDetail(isCurrent: boolean, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug) || isCurrent) return check(true, '');
  return check(false, '升級 Pro 解鎖全部 5 條路徑的板塊特徵');
}

/**
 * 路徑概率查看權限
 * FREE：可見全部概率
 * PRO：可見全部概率
 */
export function canViewPathProbability(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 切換詳情權限 ----

/**
 * 切換確認信號詳情權限
 * FREE：進度條可見，信號詳情模糊
 * PRO：完整確認信號
 */
export function canViewSwitchDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 查看完整確認信號與分析');
}

/**
 * 切換進度查看權限
 * FREE：進度條可見
 * PRO：進度條可見
 */
export function canViewSwitchProgress(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 閾值警報權限 ----

/**
 * 閾值警報查看權限
 * FREE：僅主路徑→最大切換的閾值可見
 * PRO：全部閾值警報
 */
export function canViewThresholdAlert(switchId: string, maxSwitchId: string, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  
  if (switchId === maxSwitchId) {
    return check(true, '');
  }
  
  return check(false, '升級 Pro 查看完整閾值警報');
}

// ---- 宏觀指標權限 ----

/**
 * 宏觀指標查看權限
 * FREE：完整可見
 * PRO：完整可見
 */
export function canViewMacro(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 工具函數 ----

export function getUserTier(isPremium: boolean, isDebugMockPremium: boolean): PremiumTier {
  if (isDebugMockPremium) return 'pro';
  return isPremium ? 'pro' : 'free';
}

/**
 * 計算模糊程度
 * @returns 0=完全可見，1=完全模糊，0.5=部分模糊
 */
export function getBlurLevel(tier: PremiumTier, isDebug: boolean, isVisible: boolean): number {
  if (!isFree(tier, isDebug) || isVisible) return 0;
  return 1;
}
