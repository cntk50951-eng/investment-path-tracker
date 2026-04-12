# GitHub 倉庫創建與部署指南

## ⚠️ GitHub PAT 問題說明

當前的 GitHub PAT 權限不足，無法通過 API 創建倉庫。請按照以下手動步驟操作。

---

## 📋 手動創建 GitHub 倉庫步驟

### 步驟 1: 訪問 GitHub

訪問: https://github.com/new

### 步驟 2: 填寫倉庫信息

- **Owner**: `cntk50951-eng`
- **Repository name**: `investment-path-tracker`
- **Description**: `2026 美股投資路徑追蹤系統 - 人猿團隊決策面板`
- **Visibility**: 🔒 **Private** (勾選)
- **Initialize this repository with a README**: ❌ **不要勾選** (我們已有本地倉庫)

### 步驟 3: 點擊 "Create repository"

### 步驟 4: 設置本地 Git 遠程

在項目根目錄執行:

```bash
cd /Users/yuki/Desktop/jupyter/investmentpath/investment-path-tracker

# 添加遠程倉庫
git remote add origin https://github.com/cntk50951-eng/investment-path-tracker.git

# 驗證遠程
git remote -v
```

### 步驟 5: 首次提交

```bash
# 提交所有文件
git commit -m "init: Investment Path Tracker 2026

功能特性:
- React 18 + TypeScript + Vite
- Firebase Auth (Google 登錄)
- 付費牆系統 (完整 Mock UI)
- 調試模式 (開發環境專屬)
- 響應式設計 (桌面/平板/手機)
- 完整遷移原始 HTML 功能
- 12 條路徑切換追蹤
- 5 層級閾值預警系統
- 宏觀數據欄 (9 指標)
- 新聞事件流 (嚴重性分級)

技術棧:
- Zustand (狀態管理)
- Framer Motion (動畫)
- React Router (路由)
- Firebase (認證 + Analytics)

數據結構:
- data/latest.json (團隊編輯)
- data/schema.json (格式驗證)

部署:
- Vercel (自動 CI/CD)"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 Vercel 部署步驟

### 步驟 1: 訪問 Vercel

訪問: https://vercel.com/new

### 步驟 2: 導入 Git 倉庫

1. 點擊 **"Import Git Repository"**
2. 在搜索框輸入 `investment-path-tracker`
3. 找到 `cntk50951-eng/investment-path-tracker`
4. 點擊 **"Import"**

### 步驟 3: 配置項目

- **Project Name**: `investment-path-tracker`
- **Framework Preset**: Vite
- **Root Directory**: `./` (默認)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 步驟 4: 配置環境變量

點擊 **"Environment Variables"**，添加以下變量 (所有環境都適用):

| Variable Name | Value |
|--------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `investmentpath-5ea2e.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `investmentpath-5ea2e` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `investmentpath-5ea2e.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `793664347438` |
| `VITE_FIREBASE_APP_ID` | `1:793664347438:web:4e609b2df64168fca7aebf` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-6RQYZY4NDB` |
| `VITE_ENABLE_DEBUG` | `true` |
| `VITE_ENABLE_PREMIUM` | `true` |
| `VITE_ENABLE_MOCK_DATA` | `true` |

### 步驟 5: 點擊 "Deploy"

等待約 30-60 秒，部署完成後會顯示：
- ✅ Deployment Status: Ready
- 🔗 預覽網址: `https://investment-path-tracker-xxx.vercel.app`

### 步驟 6: 配置 Firebase Authorized Domains

1. 訪問 [Firebase Console](https://console.firebase.google.com/)
2. 選擇項目 `investmentpath-5ea2e`
3. 進入 **Authentication** → **Settings** → **Authorized domains**
4. 點擊 **"Add domain"**
5. 添加：`investment-path-tracker-xxx.vercel.app` (替換為實際域名)
6. 點擊 **"Save"**

### 步驟 7: 測試

訪問部署的網址，確認:
1. ✅ 頁面正常顯示
2. ✅ 宏觀數據欄正確
3. ✅ 警報系統顯示
4. ✅ Google 登錄可用
5. ✅ 響應式正常

---

## 🔄 後續更新流程

### 團隊更新數據

1. **編輯 `data/latest.json`**
2. **提交 & Push**
   ```bash
   git add data/latest.json
   git commit -m "update: YYYY-MM-DD 數據更新"
   git push
   ```
3. **Vercel 自動部署** (約 30 秒)

### Vercel 自動部署

每次 Push 到 `main` 分支都會自動觸發:
1. Vercel 檢測到 GitHub Push
2. 自動執行 `npm install` 和 `npm run build`
3. 部署到全球 CDN
4. 更新域名

---

## 🔧 故障排查

### 問題：Git Push 失敗

**錯誤**: `remote: Repository not found`

**解決**:
1. 確認倉庫已創建
2. 確認倉庫名稱為 `investment-path-tracker`
3. 確認 Owner 為 `cntk50951-eng`
4. 檢查 PAT 是否有 repo 權限

### 問題：Vercel 部署失敗

**錯誤**: `Build failed`

**解決**:
1. 查看 Vercel 部署日誌
2. 確認環境變量正確
3. 確認 `package.json` 腳本正確
4. 在本地執行 `npm run build` 測試

### 問題：Firebase 登錄失敗

**錯誤**: `Unauthorized domain`

**解決**:
1. 在 Firebase Console 添加 Vercel 域名到 Authorized domains
2. 等待 5-10 分鐘生效
3. 清除瀏覽器緩存

---

## 📞 需要協助？

如有問題，請聯繫開發團隊。

## ✅ 檢查清單

- [ ] GitHub 倉庫已創建 (Private)
- [ ] 本地 Git 遠程已設置
- [ ] 首次提交已 Push
- [ ] Vercel 項目已創建
- [ ] 環境變量已配置
- [ ] 首次部署成功
- [ ] Firebase Authorized domains 已添加
- [ ] 測試通過

---

**創建完成後，請將 Vercel 域名告知團隊，以便配置 Firebase。**
