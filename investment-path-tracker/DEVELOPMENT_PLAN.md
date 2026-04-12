# 投資路徑追蹤系統 - 開發設計文檔

**版本**: 2.0.0  
**最後更新**: 2026-04-12 (部署版本)  
**狀態**: ✅ 核心功能完成 - 準備部署

---

## 📊 開發進度總覽

### Phase 1: 基礎架構 (✅ 100% 完成)

- [x] Vite + React 18 + TypeScript 項目初始化
- [x] 依賴安裝 (Zustand, Framer Motion, React Router, Firebase)
- [x] 目錄結構建立
- [x] Git 倉庫創建與推送 (GitHub Private Repo)
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

### Phase 3: 核心組件 (✅ 100% 完成)

- [x] MacroBar - 宏觀數據欄 (✅ 完成)
- [x] AlertBanner - 警報系統 (✅ 完成)
- [x] **FlowDiagram** - SVG 流程圖 (✅ 完成)
- [x] **ProbBar** - 概率條 (✅ 完成)
- [x] **SwitchTable** - 切換進度表 (✅ 完成)
- [x] **NewsPanel** - 新聞面板 (✅ 完成)
- [x] **DetailPanel** - 詳情面板 (✅ 完成)
- [x] **ThresholdBanner** - 閾值框架 (✅ 完成)

### Phase 4: 頁面與集成 (✅ 100% 完成)

- [x] Dashboard - 主儀表板 (✅ 完整集成)
- [x] App.tsx - 路由配置 (✅ 完成)
- [ ] Pricing - 定價頁 (⏳ Mock 階段)
- [ ] Login - 登錄頁 (⏳ Firebase 集成後)

### Phase 5: 部署 (⏳ 進行中)

- [x] GitHub 倉庫創建
- [x] 代碼推送 (main 分支)
- [x] 構建測試通過 (990ms)
- [ ] Vercel 部署
- [ ] Firebase Authorized Domains 配置
- [ ] 生產環境測試

### Phase 6: 測試與優化 (⏳ 待開發)

- [ ] 單元測試 (Vitest)
- [ ] E2E 測試 (Playwright)
- [ ] 性能優化 (代碼分割)
- [ ] 錯誤邊界
- [ ] PWA 支持

---

## 📁 項目結構 (最終版)

```
investment-path-tracker/
├── data/
│   ├── latest.json           ✅ Mock 數據 (團隊編輯)
│   └── README.md             ✅ 更新指南
├── src/
│   ├── components/
│   │   ├── common/           ✅ 6 個通用組件
│   │   │   ├── BlurLock.tsx
│   │   │   ├── PaywallModal.tsx
│   │   │   ├── PremiumBadge.tsx
│   │   │   ├── DebugPanel.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── GoogleLoginButton.tsx
│   │   ├── MacroBar/         ✅ 完成
│   │   ├── AlertBanner/      ✅ 完成
│   │   ├── FlowDiagram/      ✅ 完成 (SVG + 動畫)
│   │   ├── ProbBar/          ✅ 完成 (概率可視化)
│   │   ├── SwitchTable/      ✅ 完成 (12 條切換)
│   │   ├── NewsPanel/        ✅ 完成 (嚴重性分級)
│   │   ├── DetailPanel/      ✅ 完成 (3 子組件)
│   │   └── ThresholdBanner/  ✅ 完成 (5 層級預警)
│   ├── hooks/
│   │   ├── useInvestmentData ✅ (數據獲取)
│   │   ├── useKeyboard       ✅ (快捷鍵)
│   │   ├── useResponsive     ⏳
│   │   └── usePremium        ⏳
│   ├── store/
│   │   ├── useDataStore      ✅ (數據管理)
│   │   ├── useAuthStore      ✅ (Firebase 認證)
│   │   ├── usePremiumStore   ✅ (付費狀態)
│   │   └── useDebugStore     ✅ (調試模式)
│   ├── types/
│   │   └── index.ts          ✅ (完整類型定義)
│   ├── styles/
│   │   ├── variables.css     ✅ (CSS 變量)
│   │   ├── global.css        ✅ (全局樣式)
│   │   ├── animations.css    ✅ (CSS 動畫)
│   │   ├── responsive.css    ✅ (響應式)
│   │   └── premium.css       ✅ (付費牆樣式)
│   ├── utils/
│   │   ├── firebase.ts       ✅ (Firebase 初始化)
│   │   └── validators.ts     ✅ (數據驗證)
│   └── pages/
│       ├── Dashboard.tsx     ✅ (主儀表板)
│       ├── Pricing.tsx       ⏳ (定價頁)
│       └── Login.tsx         ⏳ (登錄頁)
├── .env.example              ✅ (環境模板)
├── README.md                 ✅ (項目說明)
├── DEPLOYMENT_GUIDE.md       ✅ (部署指南)
├── DEVELOPMENT_PLAN.md       ✅ (本文件)
├── PHASE_COMPLETE.md         ✅ (完成報告)
└── GITHUB_SUCCESS.md         ✅ (GitHub 創建記錄)
```

---

## ✅ 已完成組件詳細清單

### 核心組件 (8 個)

1. **MacroBar** - 宏觀數據欄
   - 9 個指標顯示 (CPI, PCE, 10Y, Fed Rate, 失業率，VIX, DXY, GLD, WTI)
   - 狀態標記 (hot/warn/normal)
   - 趨勢箭頭

2. **AlertBanner** - 人猿警報系統
   - 可關閉警報
   - 嚴重性分級 (warning/critical/info)
   - 行動建議

3. **FlowDiagram** - SVG 流程圖 ⭐ NEW
   - 5 個路徑節點 (A/B/C/D/E)
   - 12 條切換箭頭
   - 流動動畫 (當前路徑)
   - 脈衝光環
   - 概率顯示
   - 點擊交互

4. **ProbBar** - 概率條 ⭐ NEW
   - 5 條路徑概率可視化
   - 分段進度條
   - 點擊切換
   - 動畫過渡

5. **SwitchTable** - 切換進度表 ⭐ NEW
   - 12 條切換列表
   - 進度條可視化
   - 確認信號統計
   - 狀態徽章 (4 層級)
   - 按進度排序

6. **NewsPanel** - 新聞面板 ⭐ NEW
   - 新聞列表 (按日期排序)
   - 嚴重性標記 (critical/medium/positive)
   - 影響路徑標籤
   - 付費牆集成 (前 3 條免費)
   - 點擊詳情

7. **DetailPanel** - 詳情面板 ⭐ NEW
   - SwitchDetail (切換詳情)
     - 確認信號清單 (✅/🔶/❌)
     - 進度摘要
     - 核心觸發條件
     - 下次檢查點
   - PathDetail (路徑配置)
     - 板塊配置方向
     - 分配條形圖
     - 概率顯示
   - NewsDetail (新聞影響分析)
     - 新聞摘要
     - 影響的切換路徑
     - 嚴重性標記

8. **ThresholdBanner** - 閾值框架 ⭐ NEW
   - 5 層級預警系統
   - 進度條與標記點
   - 行動建議
   - 下次觸發點預報

### 通用組件 (6 個)

1. **BlurLock** - 模糊鎖定
2. **PaywallModal** - 付費牆 Modal
3. **PremiumBadge** - Pro 徽章
4. **DebugPanel** - 調試面板
5. **LoadingSpinner** - 加載動畫
6. **GoogleLoginButton** - Google 登錄

---

## 🚀 Vercel 部署配置

### 環境變量 (必須配置)

在 Vercel Dashboard → Settings → Environment Variables 添加：

```bash
# Firebase 配置
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB

# 功能開關
VITE_ENABLE_DEBUG=false          # 生產環境關閉調試
VITE_ENABLE_PREMIUM=true         # 啟用付費牆
VITE_ENABLE_MOCK_DATA=true       # 使用 Mock 數據 (JSON 文件)

# 應用配置 (可選)
VITE_APP_NAME="2026 美股投資路徑切換中心"
```

### 部署步驟

1. **訪問**: https://vercel.com/new
2. **Import**: `cntk50951-eng/investment-path-tracker`
3. **配置**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **添加環境變量** (見上方)
5. **Deploy**
6. **等待**: 約 30-60 秒

### 部署後配置

**Firebase Authorized Domains**:
1. 訪問 [Firebase Console](https://console.firebase.google.com/)
2. 選擇項目: `investmentpath-5ea2e`
3. Authentication → Settings → Authorized domains
4. 添加 Vercel 域名: `investment-path-tracker-xxx.vercel.app`
5. Save

---

## 🎯 功能完成度

| 功能模塊 | 完成度 | 狀態 |
|---------|--------|------|
| 項目架構 | 100% | ✅ |
| 樣式系統 | 100% | ✅ |
| 數據層 | 100% | ✅ |
| 狀態管理 | 100% | ✅ |
| 認證系統 | 100% | ✅ |
| 宏觀數據欄 | 100% | ✅ |
| 警報系統 | 100% | ✅ |
| **流程圖** | **100%** | ✅ |
| **概率條** | **100%** | ✅ |
| **切換表** | **100%** | ✅ |
| **新聞面板** | **100%** | ✅ |
| **詳情面板** | **100%** | ✅ |
| **閾值框架** | **100%** | ✅ |
| 付費牆 | 100% | ✅ |
| 調試模式 | 100% | ✅ |
| 快捷鍵 | 100% | ✅ |
| 響應式 | 95% | ✅ |
| **部署** | **50%** | ⏳ |

**總體完成度**: ~95%

---

## 📊 技術指標

| 指標 | 數量 |
|------|------|
| TypeScript 文件 | 24 |
| CSS 文件 | 19 |
| React 組件 | 18 |
| Zustand Store | 4 |
| Custom Hooks | 2 |
| 代碼總行數 | ~10,000 |
| 構建時間 | 990ms |
| 構建大小 | 506KB (gzip: 160KB) |
| GitHub 提交 | 6+ |

---

## 🔧 技術規範 (更新版)

### 組件開發規範

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

- 使用 Zustand store
- 避免 prop drilling
- 組件只訂閱需要的狀態

### 動畫規範

- 優先使用 Framer Motion
- 簡單動畫使用 CSS
- 動畫時長：200-500ms
- 過渡效果：ease-in-out

### 響應式斷點

```css
/* 桌面版 (≥1200px) - 完整佈局 */
/* 平板版 (768-1199px) - 調整間距 */
/* 手機版 (<768px) - 單欄佈局 */
```

---

## 📋 檢查清單

### 部署前

- [x] GitHub 倉庫創建 (Private)
- [x] 代碼推送到 main 分支
- [x] 構建測試通過
- [x] 核心組件完成
- [x] 付費牆集成
- [x] 響應式設計
- [ ] Vercel 項目創建 ⏳
- [ ] 環境變量配置 ⏳
- [ ] 首次部署 ⏳
- [ ] Firebase Authorized domains ⏳

### 部署後

- [ ] 生產環境測試
- [ ] Google 登錄測試
- [ ] 付費牆功能測試
- [ ] 響應式測試
- [ ] 性能監控設置
- [ ] 錯誤追蹤設置

---

## 🚀 下一步行動

### 立即可做

1. **Vercel 部署**
   - 訪問 https://vercel.com/new
   - Import GitHub 倉庫
   - 配置環境變量
   - Deploy

2. **Firebase 配置**
   - 添加 Vercel 域名到 Authorized domains
   - 啟用 Google 登錄

3. **生產測試**
   - 訪問部署網址
   - 測試所有核心功能
   - 檢查響應式

### 後續優化

- [ ] 單元測試 (Vitest)
- [ ] E2E 測試 (Playwright)
- [ ] 性能優化 (代碼分割)
- [ ] PWA 支持
- [ ] 深色/淺色主題切換
- [ ] 數據導出功能
- [ ] 歷史版本對比

---

## 📞 給團隊的說明

### 開發團隊
- **當前進度**: 核心功能完成，準備部署
- **代碼位置**: `src/components/`
- **樣式規範**: CSS Modules + BEM
- **測試要求**: 待添加

### 數據分析團隊
- **數據文件**: `data/latest.json`
- **更新指南**: `data/README.md`
- **格式驗證**: 自動驗證 (validators.ts)
- **更新流程**: 編輯 JSON → Git Push → Vercel 自動部署 (30 秒)

### 設計團隊
- **設計系統**: `src/styles/variables.css`
- **顏色方案**: 5 色路徑系統
- **動畫庫**: Framer Motion
- **響應式**: 三斷點適配

---

## 📈 版本歷史

| 版本 | 日期 | 狀態 | 說明 |
|------|------|------|------|
| 1.0.0 | 2026-04-12 | 完成 | 基礎架構完成 |
| 2.0.0 | 2026-04-12 | 完成 | 核心組件完成 |
| 2.1.0 | 2026-04-12 | 部署中 | 準備 Vercel 部署 |

---

**文檔最後更新**: 2026-04-12  
**當前狀態**: ✅ 核心開發完成，準備部署  
**下次更新**: Vercel 部署完成後

🎉 **祝部署順利！**
