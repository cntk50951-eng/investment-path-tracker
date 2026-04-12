// ==========================================
// 全局常量（合規版本）
// ==========================================

/**
 * 閾值層級配置
 * 注意：action 文字已修正為觀察性描述，不含操作指令語氣
 */
export const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; action: string }> = {
  noise: {
    label: '⚪ 噪音',
    color: '#475569',
    bg: 'rgba(71,85,105,0.12)',
    action: '信號強度不足，持續觀察'
  },
  early_warning: {
    label: '🟡 早期預警',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    action: '早期信號出現，宏觀方向尚未確認，需持續觀察關鍵數據節點'
  },
  initial_confirm: {
    label: '🟠 初步確認',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    action: '進入初步確認區間，該路徑宏觀特徵將顯著強化'
  },
  strong: {
    label: '🔴 強信號',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    action: '多數確認信號已觸發，路徑切換概率顯著上升'
  },
  locked: {
    label: '🚨 路徑鎖定',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.15)',
    action: '新路徑成為下半年宏觀主線，板塊特徵將全面重新定價'
  }
};

/** 節點顏色映射 */
export const NODE_COLORS: Record<string, string> = {
  a: '#4ade80',
  b: '#fbbf24',
  c: '#f87171',
  d: '#a78bfa',
  e: '#f472b6',
};

/** 獲取節點顏色 */
export function getNodeColor(nodeId?: string | null): string {
  if (!nodeId) return '#94a3b8';
  return NODE_COLORS[nodeId] || '#94a3b8';
}
