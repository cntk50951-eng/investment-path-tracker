// ==========================================
// 統一權限控制模塊 — Free / Pro 清晰邊界
// 管理員開關控制：
//   - 'all' 模式：管理員可見所有功能
//   - 'subscription' 模式：僅訂閱相關功能可見（模擬免費用戶視角）
//
// FREE 可見：
//   - 宏觀數據欄（完整）
//   - 閾值橫幅（僅主路徑→最大切換）
//   - 流程圖：基準路徑 + 最高概率路徑（清晰）、其他路徑（模糊）
//   - 概率條（完整可見）
//   - 切換進度表（進度條可見，信號詳情模糊）
//   - 新聞列表（前 10 條僅標題，10 條後完全模糊）
//   - 新聞詳情（僅標題 + 日期 + 來源）
//
// PRO 專屬：
//   - 全部路徑的板塊特徵詳情
//   - 切換確認信號詳情
//   - 新聞摘要 + 詳情（影響分析、標籤、關聯路徑）
// ==========================================

import type { PremiumTier } from '../types';
import { useDebugStore } from '../store/useDebugStore';

export interface PermissionCheck {
  allowed: boolean;
  reason: string;
}

// ---- 核心判斷函數 ----

function check(allowed: boolean, reason: string): PermissionCheck {
  return { allowed, reason };
}

function isFree(tier: PremiumTier, isDebug: boolean): boolean {
  // 管理員調試模式：
  //   'all' 模式 → 管理員可見所有功能（等同 Pro）→ isFree=false
  //   'subscription' 模式 → 模擬免費用戶視角 → isFree=true
  if (isDebug) {
    const { debugVisibilityMode } = useDebugStore.getState();
    if (debugVisibilityMode === 'subscription') return true;
    if (debugVisibilityMode === 'all') return false;
  }
  return tier === 'free';
}

/**
 * 判斷某個路徑是否為 Free 用戶可見的路徑
 * Free 用戶可見：基準路徑（current=true）+ 概率最高的路徑
 */
export function isPathVisibleForFree(nodeId: string, nodes: Record<string, any>, isDebug: boolean, tier: PremiumTier): boolean {
  if (!isFree(tier, isDebug)) return true;
  if (!nodes) return true;

  // 基準路徑永遠可見
  const node = nodes[nodeId];
  if (node?.current) return true;

  // 找出概率最高的路徑
  let maxProb = -1;
  let maxProbId = '';
  for (const [id, n] of Object.entries(nodes)) {
    const prob = (n as any).prob ?? 0;
    if (prob > maxProb) {
      maxProb = prob;
      maxProbId = id;
    }
  }

  // 最高概率路徑可見
  if (nodeId === maxProbId) return true;

  // 其他路徑模糊
  return false;
}

// ---- 新聞權限 ----

export function canViewNewsContent(tier: PremiumTier, isDebug: boolean, index?: number): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  
  if (index !== undefined && index < 10) {
    return check(false, '免費用戶僅可見新聞標題');
  }
  
  return check(false, '升級 Pro 解鎖完整新聞分析與影響評估');
}

export function canViewNewsDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 查看完整新聞詳情');
}

// ---- 路徑權限 ----

/**
 * 路徑板塊詳情權限
 * FREE：基準路徑 + 最高概率路徑可見，其他模糊
 * PRO：全部路徑詳情
 */
export function canViewPathDetail(isCurrent: boolean, tier: PremiumTier, isDebug: boolean, isMaxProb?: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  if (isCurrent) return check(true, '');
  if (isMaxProb) return check(true, '');
  return check(false, '升級 Pro 解鎖全部路徑的板塊特徵');
}

/**
 * 路徑概率查看權限 — 全部可見
 */
export function canViewPathProbability(_tier?: PremiumTier, __isDebug?: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 切換詳情權限 ----

export function canViewSwitchDetail(tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  return check(false, '升級 Pro 查看完整確認信號與分析');
}

export function canViewSwitchProgress(_tier?: PremiumTier, __isDebug?: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 閾值警報權限 ----

export function canViewThresholdAlert(switchId: string, maxSwitchId: string, tier: PremiumTier, isDebug: boolean): PermissionCheck {
  if (!isFree(tier, isDebug)) return check(true, '');
  if (switchId === maxSwitchId) return check(true, '');
  return check(false, '升級 Pro 查看完整閾值警報');
}

// ---- 宏觀指標權限 ----

export function canViewMacro(_tier?: PremiumTier, __isDebug?: boolean): PermissionCheck {
  return check(true, '');
}

// ---- 工具函數 ----

export function getUserTier(isPremium: boolean, isDebugMockPremium: boolean): PremiumTier {
  if (isDebugMockPremium) return 'pro';
  return isPremium ? 'pro' : 'free';
}

/**
 * 計算模糊程度
 */
export function getBlurLevel(tier: PremiumTier, isDebug: boolean, isVisible: boolean): number {
  if (!isFree(tier, isDebug) || isVisible) return 0;
  return 1;
}