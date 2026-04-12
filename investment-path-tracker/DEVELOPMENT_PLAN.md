# 投資路徑追蹤系統 - 開發設計文檔

**版本**: 1.0.0  
**最後更新**: 2026-04-12  
**狀態**: 開發中

---

## 📊 開發進度總覽

### Phase 1: 基礎架構 (✅ 100% 完成)

- [x] Vite + React 18 + TypeScript 項目初始化
- [x] 依賴安裝 (Zustand, Framer Motion, React Router, Firebase)
- [x] 目錄結構建立
- [x] Git 倉庫創建與推送
- [x] 配置文件 (.env, .gitignore, vite.config.ts)
- [x] TypeScript 類型定義
- [x] 樣式系統 (CSS Variables, 響應式，動畫)
- [x] Zustand Store (4 個)
- [x] Firebase 集成

### Phase 2: 通用組件 (✅ 100% 完成)

- [x] BlurLock - 模糊鎖定組件
- [x] PaywallModal - 付費牆 Modal
- [x] PremiumBadge - Pro 徽章
- [x] DebugPanel - 調試面板
- [x] LoadingSpinner - 加載動畫
- [x] GoogleLoginButton - Google 登錄按鈕

### Phase 3: 核心組件 (⏳ 40% 完成)

- [x] MacroBar - 宏觀數據欄 (✅ 完成)
- [x] AlertBanner - 警報系統 (✅ 完成)
- [ ] FlowDiagram - SVG 流程圖 (⏳ 開發中)
- [ ] ProbBar - 概率條 (⏳ 待開發)
- [ ] SwitchTable - 切換進度表 (⏳ 待開發)
- [ ] NewsPanel - 新聞面板 (⏳ 待開發)
- [ ] DetailPanel - 詳情面板 (⏳ 待開發)
- [ ] ThresholdBanner - 閾值框架 (⏳ 待開發)

### Phase 4: 頁面與集成 (⏳ 50% 完成)

- [x] Dashboard - 主儀表板 (✅ 基礎完成)
- [x] App.tsx - 路由配置 (✅ 完成)
- [ ] Pricing - 定價頁 (⏳ 待開發)
- [ ] Login - 登錄頁 (⏳ 待開發)

### Phase 5: 測試與優化 (⏳ 0% 完成)

- [ ] 單元測試
- [ ] E2E 測試
- [ ] 性能優化
- [ ] 錯誤邊界

---

## 📁 項目結構

```
investment-path-tracker/
├── data/
│   ├── latest.json           ✅ Mock 數據
│   └── README.md             ✅ 更新指南
├── src/
│   ├── components/
│   │   ├── common/           ✅ 6 個通用組件
│   │   ├── MacroBar/         ✅ 完成
│   │   ├── AlertBanner/      ✅ 完成
│   │   ├── FlowDiagram/      ⏳ 開發中
│   │   ├── ProbBar/          ⏳ 待開發
│   │   ├── SwitchTable/      ⏳ 待開發
│   │   ├── NewsPanel/        ⏳ 待開發
│   │   ├── DetailPanel/      ⏳ 待開發
│   │   └── ThresholdBanner/  ⏳ 待開發
│   ├── hooks/
│   │   ├── useInvestmentData ✅
│   │   ├── useKeyboard       ✅
│   │   ├── useResponsive     ⏳
│   │   └── usePremium        ⏳
│   ├── store/
│   │   ├── useDataStore      ✅
│   │   ├── useAuthStore      ✅
│   │   ├── usePremiumStore   ✅
│   │   └── useDebugStore     ✅
│   ├── types/
│   │   └── index.ts          ✅
│   ├── styles/
│   │   ├── variables.css     ✅
│   │   ├── global.css        ✅
│   │   ├── animations.css    ✅
│   │   ├── responsive.css    ✅
│   │   └── premium.css       ✅
│   ├── utils/
│   │   ├── firebase.ts       ✅
│   │   └── validators.ts     ✅
│   └── pages/
│       ├── Dashboard.tsx     ✅
│       ├── Pricing.tsx       ⏳
│       └── Login.tsx         ⏳
├── .env                      ✅
├── README.md                 ✅
├── DEPLOYMENT_GUIDE.md       ✅
└── DEVELOPMENT_PLAN.md       ✅
```

---

## 🎯 待開發組件詳細設計

### 1. FlowDiagram (SVG 流程圖) - 優先級 P0

**功能需求**:
- 顯示 5 個路徑節點 (A/B/C/D/E)
- 12 條切換箭頭 (SVG path)
- 節點 probability 顯示
- 箭頭粗細根據進度動態變化
- 動畫效果 (flow dash, pulse)
- 點擊交互 (查看詳情)

**技術實現**:
```typescript
// 節點數據結構
interface FlowNode {
  id: 'a' | 'b' | 'c' | 'd' | 'e';
  name: string;
  sub: string;
  color: string;
  x: number;
  y: number;
  prob: number;
  current?: boolean;
}

// SVG 渲染
const FlowDiagram: React.FC = () => {
  return (
    <svg viewBox="0 0 800 430">
      {/* 箭頭層 */}
      <g id="arrowLayer">
        {Object.entries(SWITCHES).map(([id, sw]) => (
          <path key={id} d={sw.path} stroke={color} />
        ))}
      </g>
      {/* 節點層 */}
      <g id="nodeLayer">
        {Object.values(NODES).map(node => (
          <g key={node.id}>
            <rect x={node.x} y={node.y} />
            <text>{node.name}</text>
          </g>
        ))}
      </g>
    </svg>
  );
};
```

**UI 設計**:
- 深色背景
- 漸變節點框
- 流動箭頭動畫
- 光暈效果 (當前路徑)
- hover 放大

---

### 2. SwitchTable (切換進度表) - 優先級 P0

**功能需求**:
- 12 條切換列表
- 確認進度條
- 已確認/總數顯示
- 狀態徽章 (高度警戒/需監控/低壓力/未觸發)
- 點擊查看詳情

**數據結構**:
```typescript
interface SwitchRow {
  id: string;
  from: string;
  to: string;
  trigger: string;
  progress: number;
  yesCount: number;
  nearCount: number;
  totalCount: number;
  time: string;
  status: 'critical' | 'warning' | 'low' | 'inactive';
}
```

**UI 設計**:
- 表格佈局
- 進度條可視化
- 顏色編碼狀態
- hover 效果
- active row 高亮

---

### 3. NewsPanel (新聞面板) - 優先級 P1

**功能需求**:
- 新聞列表 (按日期排序)
- 嚴重性標記 (critical/medium/positive)
- 影響路徑標籤
- 點擊查看詳情
- 模糊化處理 (免費用戶)

**UI 設計**:
- 垂直滾動列表
- 顏色編碼左邊框
- 標籤雲
- hover 背景變化

---

### 4. DetailPanel (詳情面板) - 優先級 P1

**子組件**:
- SwitchDetail - 切換詳情 (確認信號清單)
- PathDetail - 路徑配置 (板塊分配)
- NewsDetail - 新聞影響分析

**UI 設計**:
- 卡片佈局
- 分層信息
- 進度可視化
- 相關新聞鏈接

---

### 5. ProbBar (概率條) - 優先級 P2

**功能需求**:
- 5 條路徑概率可視化
- 分段進度條
- 點擊切換路徑
- 顏色編碼

---

### 6. ThresholdBanner (閾值框架) - 優先級 P2

**功能需求**:
- 5 層級顯示 (噪音/預警/確認/強信號/鎖定)
- 進度條
- 行動建議
- 下次觸發點

---

## 🔧 技術規範

### TypeScript 類型

所有組件必須使用 TypeScript，類型定義在 `src/types/index.ts`

### CSS 命名

使用 BEM 命名約定：
```css
.component {}
.component__element {}
.component--modifier {}
```

### 組件結構

```typescript
// 標準組件模板
import React from 'react';
import { motion } from 'framer-motion';
import './ComponentName.css';

interface ComponentNameProps {
  // props 定義
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  // props
}) => {
  return (
    <div className="component-name">
      {/* content */}
    </div>
  );
};
```

### 狀態管理

使用 Zustand store，避免 prop drilling

### 動畫

優先使用 Framer Motion，簡單動畫使用 CSS

---

## 📋 開發檢查清單

### 每個組件完成標準

- [ ] TypeScript 類型定義
- [ ] React 組件實現
- [ ] CSS 樣式 (含響應式)
- [ ] Framer Motion 動畫
- [ ] 付費牆集成 (如適用)
- [ ] 調試模式支持
- [ ] 快捷鍵支持 (如適用)
- [ ] 單元測試

---

## 🚀 下一步行動

1. **FlowDiagram** - SVG 流程圖 (核心視覺組件)
2. **SwitchTable** - 切換進度表 (核心功能)
3. **NewsPanel** - 新聞面板完整功能
4. **DetailPanel** - 詳情面板
5. **ProbBar** - 概率條
6. **ThresholdBanner** - 閾值框架

---

## 📊 開發時程估算

| 組件 | 預估時間 | 優先級 |
|------|---------|--------|
| FlowDiagram | 2 小時 | P0 |
| SwitchTable | 1.5 小時 | P0 |
| NewsPanel | 1 小時 | P1 |
| DetailPanel | 2 小時 | P1 |
| ProbBar | 0.5 小時 | P2 |
| ThresholdBanner | 1 小時 | P2 |
| **總計** | **8 小時** | - |

---

**文檔最後更新**: 2026-04-12  
**下次更新**: 完成 FlowDiagram 和 SwitchTable 後
