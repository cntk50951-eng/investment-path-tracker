# 🚨 緊急修復：API 返回 500 錯誤

## 📊 診斷結果

### 數據庫狀態
✅ **DB 數據正確**:
- E: 33%
- B: 31% ← 當前
- D: 20%
- A: 9%
- C: 7%
- 總和：100%

### API 狀態
❌ **API 返回 500 錯誤**:
```
curl https://investment-path-tracker.vercel.app/api/v1/paths
結果：500 Internal Server Error
```

**根本原因**: Vercel 沒有配置 `POSTGRES_URL` 環境變量

---

## ✅ 立即修復（3 分鐘）

### 步驟 1: 訪問 Vercel Dashboard

打開：https://vercel.com/investment-path-tracker/settings/environment-variables

### 步驟 2: 添加環境變量

點擊 **"Add New"**，添加以下變量：

#### 1. POSTGRES_URL（必須！）

```
Name:  POSTGRES_URL
Value: postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
Environments: ✅ Production ✅ Preview ✅ Development（全選）
```

#### 2. API_KEY（必須！）

```
Name:  API_KEY
Value: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
Environments: 全選
```

### 步驟 3: 重新部署

1. 點擊 **"Deployments"** 標籤
2. 找到最新部署（狀態可能是 "Failed" 或 "Ready"）
3. 點擊 **"⋯"** → **"Redeploy"**
4. 等待 1-2 分鐘

---

## 🧪 驗證修復

部署完成後測試：

```bash
# 測試 API
curl https://investment-path-tracker.vercel.app/api/v1/paths | jq '.data.nodes'

# 預期結果：
# {
#   "e": {"prob": 33},
#   "b": {"prob": 31},
#   "d": {"prob": 20},
#   "a": {"prob": 9},
#   "c": {"prob": 7}
# }
```

---

## 📋 完整環境變量清單

需要添加的所有變量：

```bash
# 數據庫（1 個 - 最重要）
POSTGRES_URL=postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# API Key（1 個）
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720

# Firebase（7 個）
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB

# 功能開關（3 個）
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=false

# 應用配置（3 個）
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=false
VITE_APP_VERSION=3.0.0
```

---

## ⏱️ 時間預估

- 配置環境變量：2-3 分鐘
- 重新部署：1-2 分鐘
- **總計：3-5 分鐘**

---

## 📞 部署完成後

1. **強制刷新頁面**: Cmd+Shift+R
2. **驗證概率**: 應顯示 E=33%, D=20%, B=31%
3. **驗證新聞**: 應顯示 4 月 14 日的新聞

---

**配置完成後 API 將立即恢復，頁面顯示正確的 E=33%！** 🚀

