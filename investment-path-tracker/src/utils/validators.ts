// ==========================================
// 數據驗證工具
// ==========================================

import type {
  InvestmentData,
  Node,
  Switch,
  NewsEvent,
  ValidationResult
} from '../types';

/**
 * 驗證概率總和是否為 100%
 */
export function validateProbSum(nodes: Record<string, Node>): ValidationResult {
  const sum = Object.values(nodes).reduce((acc, n) => acc + n.prob, 0);
  if (Math.abs(sum - 100) > 0.1) {
    return {
      isValid: false,
      errors: [{ message: `概率總和為 ${sum}%，應為 100%` }]
    };
  }
  return { isValid: true };
}

/**
 * 驗證路徑切換引用是否有效
 */
export function validateSwitchRefs(
  switches: Record<string, Switch>,
  nodes: Record<string, Node>
): ValidationResult {
  const errors: string[] = [];
  const nodeIds = Object.keys(nodes);

  Object.entries(switches).forEach(([id, sw]) => {
    if (!nodeIds.includes(sw.from)) {
      errors.push(`切換 ${id}: from='${sw.from}' 不存在`);
    }
    if (!nodeIds.includes(sw.to)) {
      errors.push(`切換 ${id}: to='${sw.to}' 不存在`);
    }
  });

  return errors.length > 0
    ? { isValid: false, errors: [{ message: errors.join(', ') }] }
    : { isValid: true };
}

/**
 * 驗證新聞 affects 引用是否有效
 */
export function validateNewsRefs(
  news: NewsEvent[],
  switches: Record<string, Switch>
): ValidationResult {
  const errors: string[] = [];
  const switchIds = Object.keys(switches);

  news.forEach((item, idx) => {
    item.affects.forEach(switchId => {
      if (!switchIds.includes(switchId)) {
        errors.push(`新聞 #${idx}: affects='${switchId}' 不存在`);
      }
    });
  });

  return errors.length > 0
    ? { isValid: false, errors: [{ message: errors.join(', ') }] }
    : { isValid: true };
}

/**
 * 驗證顏色格式
 */
export function validateColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * 驗證节点配置
 */
export function validateNodeAllocations(node: Node): ValidationResult {
  const totalAlloc = node.alloc.reduce((acc, a) => acc + a.w, 0);
  if (Math.abs(totalAlloc - 100) > 0.1) {
    return {
      isValid: false,
      errors: [{ message: `节点 ${node.id} 配置總和為 ${totalAlloc}%，應為 100%` }]
    };
  }

  const invalidColors = node.alloc.filter(a => !validateColor(a.c));
  if (invalidColors.length > 0) {
    return {
      isValid: false,
      errors: [{ message: `节点 ${node.id} 包含無效顏色` }]
    };
  }

  return { isValid: true };
}

/**
 * 驗證切換確認信號
 */
export function validateSwitchConfirms(sw: Switch): ValidationResult {
  const validStatuses = ['yes', 'near', 'no'];
  const invalidSignals = sw.confirms.filter(
    c => !validStatuses.includes(c.status)
  );

  if (invalidSignals.length > 0) {
    return {
      isValid: false,
      errors: [{ message: `切換 ${sw.from}→${sw.to} 包含無效信號狀態` }]
    };
  }

  return { isValid: true };
}

/**
 * 完整數據驗證
 */
export function validateInvestmentData(data: InvestmentData): ValidationResult {
  const errors: string[] = [];

  // 驗證概率總和
  const probResult = validateProbSum(data.nodes);
  if (!probResult.isValid) {
    errors.push(...probResult.errors.map(e => e.message));
  }

  // 驗證切換引用
  const switchResult = validateSwitchRefs(data.switches, data.nodes);
  if (!switchResult.isValid) {
    errors.push(...switchResult.errors.map(e => e.message));
  }

  // 驗證新聞引用
  const newsResult = validateNewsRefs(data.news, data.switches);
  if (!newsResult.isValid) {
    errors.push(...newsResult.errors.map(e => e.message));
  }

  // 驗證各节点配置
  Object.values(data.nodes).forEach(node => {
    const allocResult = validateNodeAllocations(node);
    if (!allocResult.isValid) {
      errors.push(...allocResult.errors.map(e => e.message));
    }
  });

  // 驗證切換信號
  Object.values(data.switches).forEach(sw => {
    const confirmResult = validateSwitchConfirms(sw);
    if (!confirmResult.isValid) {
      errors.push(...confirmResult.errors.map(e => e.message));
    }
  });

  return errors.length > 0
    ? { isValid: false, errors: errors.map(m => ({ message: m })) }
    : { isValid: true };
}

/**
 * 計算切換進度
 */
export function calcProgress(sw: Switch): number {
  const score = sw.confirms.reduce(
    (sum, c) => sum + (c.status === 'yes' ? 1 : c.status === 'near' ? 0.5 : 0),
    0
  );
  return score / sw.confirms.length;
}

/**
 * 獲取閾值層級
 */
export function getTier(progress: number): string {
  if (progress >= 0.75) return 'locked';
  if (progress >= 0.60) return 'strong';
  if (progress >= 0.50) return 'initial_confirm';
  if (progress >= 0.35) return 'early_warning';
  return 'noise';
}

/**
 * 閾值層級配置
 */
export const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; action: string }> = {
  noise: {
    label: '⚪ 噪音',
    color: '#475569',
    bg: 'rgba(71,85,105,0.12)',
    action: '觀察，不行動'
  },
  early_warning: {
    label: '🟡 早期預警',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    action: '準備邊緣倉位，不大動'
  },
  initial_confirm: {
    label: '🟠 初步確認',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    action: '高衝擊路徑立即執行 P0 預備動作'
  },
  strong: {
    label: '🔴 強信號',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    action: '執行 P0+P1，調整核心倉位'
  },
  locked: {
    label: '🚨 路徑鎖定',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.15)',
    action: '新路徑成為下半年投資主線，全面重配'
  }
};
