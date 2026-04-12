// ==========================================
// 數據驗證工具
// ==========================================

import type {
  InvestmentData,
  Node,
  Switch,
  NewsEvent,
  ValidationResult,
  AllocationTier
} from '../types';

const VALID_TIERS: AllocationTier[] = ['overweight', 'neutral', 'underweight', 'avoid'];

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
  return { isValid: true, errors: [] };
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
    : { isValid: true, errors: [] };
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
    : { isValid: true, errors: [] };
}

/**
 * 驗證節點板塊配置（合規 tier 格式）
 */
export function validateNodeAllocations(node: Node): ValidationResult {
  const errors: string[] = [];

  for (const alloc of node.alloc) {
    if (!VALID_TIERS.includes(alloc.tier)) {
      errors.push(`節點 ${node.id} 板塊 "${alloc.n}" 的 tier "${alloc.tier}" 無效，僅允許 ${VALID_TIERS.join('/')}`);
    }
    // 合規檢查：不應包含具體標的代號
    if (/\b[A-Z]{2,5}\b/.test(alloc.n) && !/板塊|市場|資產|債券|商品|龍頭|現金/.test(alloc.n)) {
      errors.push(`節點 ${node.id} 板塊 "${alloc.n}" 可能包含具體標的代號，請使用板塊名稱`);
    }
  }

  return errors.length > 0
    ? { isValid: false, errors: errors.map(m => ({ message: m })) }
    : { isValid: true, errors: [] };
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

  return { isValid: true, errors: [] };
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

  // 驗證各節點配置
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
    : { isValid: true, errors: [] };
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