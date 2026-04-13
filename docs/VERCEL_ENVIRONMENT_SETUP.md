# Vercel 部署與環境變量配置指南

## 📋 目錄
- [快速配置](#快速配置)
- [環境變量列表](#環境變量列表)
- [配置步驟](#配置步驟)
- [測試驗證](#測試驗證)

---

## 快速配置

**Vercel 項目 URL**: https://investment-path-tracker.vercel.app/

**需要配置的環境變量**（共 14 個）：

### 1. Firebase 配置（7 個）
```
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB
```

### 2. 功能開關（3 個）
```
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=false
```

### 3. API 配置（3 個）
```
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=false
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

### 4. 應用配置（1 個）
```
VITE_APP_VERSION=3.0.0
```

---

## 配置步驟

### 方法一：Vercel Dashboard（推薦）

1. **登錄 Vercel**
   - 訪問：https://vercel.com/dashboard
   - 找到項目：`investment-path-tracker`

2. **進入設置頁面**
   - 點擊項目卡片
   - 點擊頂部 `Settings` 標籤
   - 點擊左側 `Environment Variables`

3. **添加環境變量**
   - 點擊 `Add New` 按鈕
   - 逐一添加上述 14 個變量
   - **重要**：勾選所有環境（Production / Preview / Development）
   - 點擊 `Save`

4. **重新部署**
   - 添加完所有變量後，點擊 `Deploy` 標籤
   - 點擊 `Redeploy` 按鈕
   - 等待部署完成（約 30-60 秒）

### 方法二：Vercel CLI（進階）

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登錄 Vercel
vercel login

# 進入項目目錄
cd /Users/yuki/Desktop/jupyter/investmentpath

# 添加環境變量（逐一執行）
vercel env add VITE_FIREBASE_API_KEY AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
vercel env add VITE_FIREBASE_AUTH_DOMAIN investmentpath-5ea2e.firebaseapp.com
vercel env add VITE_FIREBASE_PROJECT_ID investmentpath-5ea2e
vercel env add VITE_FIREBASE_STORAGE_BUCKET investmentpath-5ea2e.firebasestorage.app
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID 793664347438
vercel env add VITE_FIREBASE_APP_ID 1:793664347438:web:4e609b2df64168fca7aebf
vercel env add VITE_FIREBASE_MEASUREMENT_ID G-6RQYZY4NDB
vercel env add VITE_ENABLE_DEBUG true
vercel env add VITE_ENABLE_PREMIUM true
vercel env add VITE_ENABLE_MOCK_DATA false
vercel env add VITE_API_BASE_URL /api/v1
vercel env add VITE_USE_MOCK_API false
vercel env add API_KEY f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
vercel env add VITE_APP_VERSION 3.0.0

# 重新部署
vercel --prod
```

---

## 環境變量說明

| 變量名稱 | 用途 | 環境 |
|---------|------|------|
| `VITE_FIREBASE_*` | Firebase 認證 | 全部 |
| `VITE_ENABLE_DEBUG` | 調試模式開關 | 全部 |
| `VITE_ENABLE_PREMIUM` | 付費功能開關 | 全部 |
| `VITE_ENABLE_MOCK_DATA` | Mock 數據模式（生產環境設為 false） | 全部 |
| `VITE_API_BASE_URL` | API 基礎路径 | 全部 |
| `VITE_USE_MOCK_API` | 是否使用 Mock API | Development: true, Production: false |
| `API_KEY` | 寫入 API 認證密鑰 | 全部 |
| `VITE_APP_VERSION` | 應用版本號 | 全部 |

---

## 測試驗證

### 1. 測試讀取 API

```bash
# 測試路徑 API
curl https://investment-path-tracker.vercel.app/api/v1/paths

# 測試新聞 API
curl https://investment-path-tracker.vercel.app/api/v1/news

# 測試宏觀指標 API
curl https://investment-path-tracker.vercel.app/api/v1/macros
```

**預期響應**：
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-13T...",
    "version": "3.0.0",
    "market": "US"
  }
}
```

### 2. 測試寫入 API（需要 API Key）

```bash
# 測試更新路徑數據
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/paths \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{"nodes": {"b": {"prob": 35}}}'
```

**預期響應**：
```json
{
  "success": true,
  "message": "路徑數據更新成功",
  "data": {
    "lastUpdated": "2026-04-13T...",
    "version": "3.0.0"
  }
}
```

### 3. 測試前端功能

訪問以下 URL 測試功能：

- **主儀表板**: https://investment-path-tracker.vercel.app/
- **新聞時間線**: https://investment-path-tracker.vercel.app/news
- **登錄頁面**: https://investment-path-tracker.vercel.app/login

---

## 安全注意事項

### ⚠️ 保護 API Key

1. **不要**將 `.env.local` 上傳到 GitHub
2. **不要**在前端代碼中硬編碼 API Key
3. **定期輪換** API Key（建議每 90 天）

### 生成新的 API Key

```bash
# 使用 OpenSSL 生成
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vercel 安全設置

1. **啟用 Vercel Authentication**（可選）
   - Settings → Authentication → Enable

2. **配置 Authorized Domains**（Firebase）
   - 訪問 Firebase Console
   - Authentication → Settings → Authorized domains
   - 添加：`investment-path-tracker.vercel.app`

---

## 故障排查

### 問題 1: API 返回 401 Unauthorized

**原因**：API Key 未配置或錯誤

**解決**：
1. 檢查 Vercel 環境變量中是否有 `API_KEY`
2. 確認請求 Header 中包含 `X-API-Key`
3. 重新部署項目

### 問題 2: 前端無法連接 API

**原因**：`VITE_API_BASE_URL` 未配置

**解決**：
1. 確認已添加 `VITE_API_BASE_URL=/api/v1`
2. 重新部署項目
3. 清除瀏覽器緩存

### 問題 3: 速率限制過於嚴格

**原因**：Vercel Serverless Functions 的速率限制

**解決**：
1. 升級 Vercel Pro Plan（可選）
2. 使用 Upstash Redis 實現分布式速率限制
3. 增加緩存時間

---

## 更新 API Key 流程

如果需要輪換 API Key：

1. **生成新 Key**
   ```bash
   openssl rand -hex 32
   ```

2. **更新 Vercel 環境變量**
   - Vercel Dashboard → Settings → Environment Variables
   - 編輯 `API_KEY`
   - 輸入新 Key
   - Save

3. **通知團隊**
   - 將新 Key 發送給投研團隊
   - 作廢舊 Key

4. **重新部署**
   - Vercel Dashboard → Deployments → Redeploy

---

## 完成檢查清單

- [ ] 添加所有 14 個環境變量
- [ ] 重新部署到 Production
- [ ] 測試所有 API Endpoint
- [ ] 測試前端功能（儀表板/新聞時間線）
- [ ] 配置 Firebase Authorized Domains
- [ ] 將新 API Key 發送給團隊
- [ ] 刪除本地 `.env.local` 中的敏感信息（如已上傳）

---

## 支持聯繫

- 📧 技術支持：`support@investmentpath.com`
- 📚 文檔：`docs/` 目錄
- 🔗 Vercel 文檔：https://vercel.com/docs/environment-variables

---

**配置完成後，您的 API 將 fully operational！** 🚀
