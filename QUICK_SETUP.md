# 🚀 Vercel 快速配置卡片

## 您的項目
- **URL**: https://investment-path-tracker.vercel.app/
- **版本**: 3.0.0
- **API Key**: `f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720`

---

## 一鍵複製：所有環境變量

```bash
# Firebase (7 個)
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB

# API (3 個)
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=false
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720

# 功能開關 (3 個)
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=false

# 應用 (1 個)
VITE_APP_VERSION=3.0.0
```

---

## 3 分鐘配置流程

### 1️⃣ 訪問 Vercel 設置頁面
```
https://vercel.com/investment-path-tracker/settings/environment-variables
```

### 2️⃣ 添加所有變量
- 點擊 `Add New` 14 次
- 每次複製上方一個變量
- Environment 全選（Production/Preview/Development）

### 3️⃣ 重新部署
```
https://vercel.com/investment-path-tracker/deployments
```
→ 點擊最新部署的 `⋯` → `Redeploy`

---

## 測試鏈接

✅ 首頁：https://investment-path-tracker.vercel.app/

✅ 新聞：https://investment-path-tracker.vercel.app/news

✅ API: https://investment-path-tracker.vercel.app/api/v1/paths

---

## Firebase 配置（必做！）

```
https://console.firebase.google.com/project/investmentpath-5ea2e/authentication/providers
```
→ 添加 Authorized Domain: `investment-path-tracker.vercel.app`

---

## 團隊 API Key

分享給投研團隊：
```
API Endpoint: https://investment-path-tracker.vercel.app/api/v1
API Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

更新數據示例：
```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/news \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{"news": [...]}'
```

---

## 完整文檔

- 配置指南：`docs/VERCEL_SETUP_COMPLETED.md`
- API 文檔：`docs/API_DOCUMENTATION.md`
- 數據契約：`docs/DATA_CONTRACT.md`
- 集成指南：`docs/API_INTEGRATION_GUIDE.md`

---

**完成配置後即可上線使用！** ✨
