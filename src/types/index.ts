// ==========================================
// Investment Path Tracker - TypeScript 類型定義
// ==========================================

// 路徑節點 (5 條路徑：A/B/C/D/E)
export interface Node {
  id: 'a' | 'b' | 'c' | 'd' | 'e';
  name: string;
  sub: string;
  color: string;
  x: number;
  y: number;
  prob: number;
  current?: boolean;
  alloc: Allocation[];
}

// 板塊配置
export interface Allocation {
  n: string;  // 名稱
  w: number;  // 權重%
  c: string;  // 顏色
}

// 確認信號
export interface ConfirmSignal {
  text: string;
  status: 'yes' | 'near' | 'no';
  actual: string;
  note?: string;
}

// 路徑切換
export interface Switch {
  from: string;
  to: string;
  time: string;
  trigger: string;
  path: string;  // SVG path
  confirms: ConfirmSignal[];
  desc: string;
  nextCheck: string;
}

// 新聞事件
export interface NewsEvent {
  id?: string;
  date: string;
  title: string;
  source: string;
  severity: 'critical' | 'medium' | 'positive';
  summary: string;
  affects: string[];  // 影響的切換 ID
  url?: string;
}

// 宏觀指標
export interface MacroIndicator {
  name: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  status: 'hot' | 'warn' | 'normal';
  note?: string;
}

// 閾值警報
export interface ThresholdAlert {
  switchId: string;
  progress: number;
  tier: 'noise' | 'early_warning' | 'initial_confirm' | 'strong' | 'locked';
  nextTrigger: string;
}

// 人猿警報
export interface Alert {
  active: boolean;
  level: 'warning' | 'critical' | 'info';
  timestamp: string;
  title: string;
  message: string;
  action: string;
}

// 元數據
export interface Meta {
  version: string;
  lastUpdated: string;
  nextScheduledUpdate?: string;
  dataSource: string;
}

// 完整投資數據
export interface InvestmentData {
  meta: Meta;
  macros: MacroIndicator[];
  alert?: Alert;
  nodes: Record<string, Node>;
  switches: Record<string, Switch>;
  news: NewsEvent[];
  thresholdAlert?: ThresholdAlert;
}

// 用戶認證
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
}

export type AuthState = User | null;

// 調試模式
export interface DebugState {
  isDebugMode: boolean;
  mockPremium: boolean;
  useMockData: boolean;
  mockApiLatency: number;
  showBlurDebug: boolean;
}

// 驗證結果
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ message: string; path?: string }>;
}

// 閾值層級配置
export interface TierConfig {
  label: string;
  color: string;
  bg: string;
  action: string;
}

// 切換進度計算結果
export interface SwitchProgress {
  id: string;
  progress: number;
  yesCount: number;
  nearCount: number;
  noCount: number;
  totalCount: number;
  tier: string;
}
