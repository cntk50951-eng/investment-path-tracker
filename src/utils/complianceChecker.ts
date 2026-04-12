// ==========================================
// 合規審查模塊（獨立模塊，與業務邏輯解耦）
// 本系統定性為「宏觀研究出版物」，不是「投資顧問服務」
// 核心原則：主語是「市場/環境/數據顯示」✅　主語是「你/用戶應該做」❌
// ==========================================

import type { InvestmentData, ComplianceResult, ComplianceViolation, Allocation } from '../types';

// ---- 違規模式定義 ----

// 模式一：操作指令語氣
const ACTION_DIRECTIVE_PATTERNS = [
  /當前決策[：:]/,
  /應執行/,
  /立即執行/,
  /建議你/,
  /你應該/,
  /將倉位/,
  /不提前行動/,
  /所有倉位等待/,
  /執行.*清單/,
];

// 模式二：具體標的＋具體比例＋操作動詞
const TARGET_RATIO_PATTERNS = [
  /[A-Z]{2,5}\s*(加倉|減倉|清倉|建倉)\s*(至|到)?\s*\d+%/,
  /將.*股.*倉位.*(降至|升至|調至)\s*\d+%/,
  /(增持|減持).*至\s*\d+%/,
  /[A-Z]{2,5}\s*\d+%/,  // 標的代號+百分比
];

// 模式三：行動指令詞（作為指令使用時）
const ACTION_VERB_PATTERNS = [
  /(?:^|[，。；\s])決策(?:[：:])/,
  /(?:^|[，。；\s])立即(?!.*歷史)/,
  /(?:^|[，。；\s])清倉/,
  /(?:^|[，。；\s])加倉/,
  /(?:^|[，。；\s])減倉/,
  /(?:^|[，。；\s])建倉/,
  /需立即轉向/,
  /全面重配/,
  /執行\s*P\d/,
];

// 模式四：個人化建議
const PERSONALIZED_PATTERNS = [
  /根據你的/,
  /你的倉位/,
  /你的投資/,
  /建議你/,
  /你應該/,
];

// 標的代號正則（2-5個大寫字母，常見股票/ETF代號）
const TICKER_PATTERN = /\b(NVDA|AMD|GOOG|META|AMZN|AAPL|MSFT|TSLA|WMT|KO|MRK|GLD|SHV|XLU|XLE|XLF|XLB|ITA|EWJ|EWY|AXP|CME|SHY|TLT|SPY|QQQ|DIA|IWM)\b/;

// ---- 合規常量 ----

/** 板塊特徵前置說明（showPath 函數強制注入） */
export const ALLOC_DISCLAIMER = '板塊特徵方向（基於歷史宏觀環境規律，高配/標配/低配/規避為相對方向性描述，不代表具體倉位建議）';

/** 頁腳免責聲明（每頁強制渲染） */
export const FOOTER_DISCLAIMER = '本報告內容為宏觀經濟環境研究與情景分析，所有路徑判斷及板塊特徵描述均基於歷史數據規律，不構成任何投資建議，亦不針對任何讀者的具體持倉或財務狀況。投資決策請依據個人情況並諮詢持牌專業人士。數據來源：BLS、BEA、FRED、Yahoo Finance 等公開渠道。';

// ---- Tier 顏色映射 ----
export const TIER_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  overweight: { color: '#4ade80', bg: 'rgba(74,222,128,0.15)', label: '高配' },
  neutral:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: '標配' },
  underweight:{ color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: '低配' },
  avoid:      { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: '規避' },
};

// ---- 審查函數 ----

/**
 * 掃描單個文字字段，返回違規列表
 */
function scanTextField(text: string, fieldName: string): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  // 模式一：操作指令語氣
  for (const pattern of ACTION_DIRECTIVE_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'action_directive',
        field: fieldName,
        original: text,
        suggestion: '改為觀察性描述，如「當前觀察重點：...」',
        severity: 'error',
      });
      break;
    }
  }

  // 模式二：具體標的＋具體比例
  for (const pattern of TARGET_RATIO_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'specific_target_ratio',
        field: fieldName,
        original: text,
        suggestion: '移除具體標的代號和百分比，改為板塊方向性描述',
        severity: 'error',
      });
      break;
    }
  }

  // 模式三：行動指令詞
  for (const pattern of ACTION_VERB_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'action_verb',
        field: fieldName,
        original: text,
        suggestion: '改為「觀察」「監控」「關注」「歷史上呈現」「環境特徵」等描述',
        severity: 'warning',
      });
      break;
    }
  }

  // 模式四：個人化建議
  for (const pattern of PERSONALIZED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'personalized_advice',
        field: fieldName,
        original: text,
        suggestion: '所有內容應面向不特定的宏觀研究讀者',
        severity: 'error',
      });
      break;
    }
  }

  return violations;
}

/**
 * 檢查 alloc 數據結構合規性
 */
function checkAllocCompliance(alloc: Allocation[], nodeName: string): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  for (const item of alloc) {
    // 檢查是否包含標的代號
    if (TICKER_PATTERN.test(item.n)) {
      violations.push({
        type: 'ticker_in_alloc',
        field: `${nodeName}.alloc.${item.n}`,
        original: item.n,
        suggestion: '移除具體股票代號，僅保留板塊名稱',
        severity: 'error',
      });
    }

    // 檢查是否包含百分比數字
    if (/\d+%/.test(item.n)) {
      violations.push({
        type: 'specific_target_ratio',
        field: `${nodeName}.alloc.${item.n}`,
        original: item.n,
        suggestion: '移除百分比數字',
        severity: 'error',
      });
    }

    // 檢查 tier 是否為合法值
    const validTiers = ['overweight', 'neutral', 'underweight', 'avoid'];
    if (!validTiers.includes(item.tier)) {
      violations.push({
        type: 'ticker_in_alloc',
        field: `${nodeName}.alloc.${item.n}`,
        original: `tier: ${item.tier}`,
        suggestion: 'tier 只允許 overweight/neutral/underweight/avoid',
        severity: 'error',
      });
    }
  }

  return violations;
}

/**
 * 完整合規審查：掃描整個 InvestmentData
 */
export function checkCompliance(data: InvestmentData): ComplianceResult {
  const violations: ComplianceViolation[] = [];

  // 1. 掃描 alert
  if (data.alert) {
    violations.push(...scanTextField(data.alert.message, 'alert.message'));
    violations.push(...scanTextField(data.alert.action, 'alert.action'));
  }

  // 2. 掃描 thresholdAlert
  if (data.thresholdAlert) {
    violations.push(...scanTextField(data.thresholdAlert.nextTrigger, 'thresholdAlert.nextTrigger'));
  }

  // 3. 掃描所有 nodes 的 alloc
  for (const [nodeId, node] of Object.entries(data.nodes)) {
    violations.push(...checkAllocCompliance(node.alloc, `nodes.${nodeId}`));
  }

  // 4. 掃描所有 switches 的 desc
  for (const [switchId, sw] of Object.entries(data.switches)) {
    violations.push(...scanTextField(sw.desc, `switches.${switchId}.desc`));
    violations.push(...scanTextField(sw.trigger, `switches.${switchId}.trigger`));
    // 掃描確認信號
    for (const confirm of sw.confirms) {
      if (confirm.note) {
        violations.push(...scanTextField(confirm.note, `switches.${switchId}.confirms.note`));
      }
    }
  }

  // 5. 掃描新聞
  for (const news of data.news) {
    violations.push(...scanTextField(news.summary, `news.${news.id}.summary`));
  }

  // 6. 掃描 TIER_CONFIG action 文字（靜態檢查）
  // 這部分在 validators.ts 中的 TIER_CONFIG 已修正

  return {
    isCompliant: violations.filter(v => v.severity === 'error').length === 0,
    violations,
  };
}

/**
 * 在 debug 模式下高亮標記違規內容
 * 在生產模式下輸出 console warning
 */
export function reportViolations(result: ComplianceResult, isDebug: boolean): void {
  if (result.isCompliant && result.violations.length === 0) return;

  const errors = result.violations.filter(v => v.severity === 'error');
  const warnings = result.violations.filter(v => v.severity === 'warning');

  if (errors.length > 0) {
    console.warn(
      `⚠️ [合規審查] 發現 ${errors.length} 個違規項：`,
      errors.map(v => `\n  ❌ [${v.type}] ${v.field}: "${v.original.substring(0, 60)}..." → ${v.suggestion}`)
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `⚠️ [合規審查] 發現 ${warnings.length} 個警告項：`,
      warnings.map(v => `\n  ⚠️ [${v.type}] ${v.field}: "${v.original.substring(0, 60)}..."`)
    );
  }

  if (isDebug) {
    console.group('🔍 合規審查詳細報告');
    result.violations.forEach(v => {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} [${v.type}] ${v.field}`);
      console.log(`   原文: ${v.original.substring(0, 100)}`);
      if (v.suggestion) console.log(`   建議: ${v.suggestion}`);
    });
    console.groupEnd();
  }
}
