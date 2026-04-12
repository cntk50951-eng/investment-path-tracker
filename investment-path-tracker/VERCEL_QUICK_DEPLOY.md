# 🚀 Vercel 部署快速指南

**最後更新**: 2026-04-12  
**倉庫**: https://github.com/cntk50951-eng/investment-path-tracker

---

## ⚡ 快速部署步驟

### 步驟 1: 訪問 Vercel

🔗 連結：https://vercel.com/new

### 步驟 2: Import Git Repository

1. 點擊 **"Import Git Repository"**
2. 在搜索框輸入：`investment-path-tracker`
3. 找到：`cntk50951-eng/investment-path-tracker`
4. 點擊 **"Import"**

### 步驟 3: 配置項目

**Framework Preset**: Vite  
**Root Directory**: `./`  
**Build Command**: `npm run build`  
**Output Directory**: `dist`

### 步驟 4: 添加環境變量 ⭐ 重要

在 **Environment Variables** 中添加以下變量：

```bash
# Firebase 配置 (7 個)
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB

# 功能開關 (3 個)
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=true

# 應用配置 (可選)
VITE_APP_NAME="2026 美股投資路徑切換中心"
```

### 步驟 5: Deploy

點擊 **"Deploy"** 按鈕

**等待時間**: 約 30-60 秒

### 步驟 6: 查看部署結果

部署完成後會顯示：
- ✅ Deployment Status: Ready
- 🔗 預覽網址：`https://investment-path-tracker-xxx.vercel.app`

點擊網址訪問測試！

---

## 🔧 部署後配置

### Firebase Authorized Domains

1. 訪問：https://console.firebase.google.com/
2. 選擇項目：`investmentpath-5ea2e`
3. 進入：**Authentication** → **Settings** → **Authorized domains**
4. 點擊：**"Add domain"**
5. 添加：`investment-path-tracker-xxx.vercel.app` (替換 xxx 為實際域名)
6. 點擊：**"Save"**

**生效時間**: 5-10 分鐘

---

## ✅ 測試清單

部署完成後，請測試以下功能：

### 基礎功能
- [ ] 頁面正常加載
- [ ] 宏觀數據欄顯示正確
- [ ] 警報系統顯示
- [ ] 流程圖動畫正常
- [ ] 切換表數據正確
- [ ] 新聞面板顯示
- [ ] 詳情面板點擊正常

### 交互功能
- [ ] 點擊路徑節點 → 顯示詳情
- [ ] 點擊切換箭頭 → 顯示詳情
- [ ] 點擊新聞 → 顯示詳情
- [ ] 快捷鍵測試 (1-5, R, N, Esc)
- [ ] 調試面板 (如開啟)

### 響應式測試
- [ ] 桌面版 (≥1200px) - 完整佈局
- [ ] 平板版 (768-1199px) - 調整間距
- [ ] 手機版 (<768px) - 單欄佈局

### 付費功能
- [ ] 點擊其他路徑 → 顯示付費牆
- [ ] 點擊切換表 → 顯示付費牆
- [ ] 新聞前 3 條免費，後續鎖定

---

## 🔄 後續更新流程

### 代碼更新

```bash
# 1. 修改代碼
# 2. 提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送
git push origin main

# 4. Vercel 自動部署 (約 30 秒)
```

### 數據更新 (團隊操作)

```bash
# 1. 編輯 data/latest.json
# 2. 提交
git add data/latest.json
git commit -m "update: 2026-04-15 CPI 數據更新"

# 3. 推送
git push origin main

# 4. Vercel 自動部署 (約 30 秒)
```

---

## 📊 部署信息

| 項目 | 值 |
|------|-----|
| 倉庫 | cntk50951-eng/investment-path-tracker |
| 分支 | main |
| 構建命令 | npm run build |
| 輸出目錄 | dist |
| 構建時間 | ~1 秒 |
| 構建大小 | 506KB (gzip: 160KB) |
| 自動部署 | ✅ (Git Push 觸發) |
| CDN | ✅ (全球加速) |

---

## ⚠️ 常見問題

### Q1: 構建失敗

**檢查**:
- 環境變量是否正確
- package.json 腳本是否正確
- 本地執行 `npm run build` 測試

### Q2: Google 登錄失敗

**解決**:
1. 確認 Firebase Authorized Domains 已添加 Vercel 域名
2. 等待 5-10 分鐘生效
3. 清除瀏覽器緩存

### Q3: 頁面空白

**檢查**:
- 瀏覽器控制台錯誤
- 環境變量是否正確
- Firebase 配置是否正確

### Q4: 數據未更新

**解決**:
1. 確認 Git Push 成功
2. 檢查 Vercel 部署日誌
3. 清除瀏覽器緩存

---

## 📞 技術支持

**文檔**:
- README.md - 項目說明
- DEPLOYMENT_GUIDE.md - 詳細部署指南
- DEVELOPMENT_PLAN.md - 開發計劃
- data/README.md - 數據更新指南

**倉庫**: https://github.com/cntk50951-eng/investment-path-tracker

---

## 🎉 部署成功檢查清單

- [x] Vercel 項目創建
- [x] 環境變量配置
- [x] 首次部署成功
- [ ] Firebase Authorized domains 配置
- [ ] 生產環境測試通過
- [ ] 團隊培訓完成

**祝部署順利！** 🚀
