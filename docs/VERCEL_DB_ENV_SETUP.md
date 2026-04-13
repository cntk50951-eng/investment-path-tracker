# 🚀 Vercel 環境變量配置指南

## ⚠️ 重要：需要配置數據庫環境變量

遷移到 PostgreSQL 後，需要在 Vercel 配置數據庫連接。

---

## 📋 需要添加的環境變量（共 15 個）

### 1. 數據庫配置（1 個 - 最重要！）

```
POSTGRES_URL=postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### 2. Firebase 配置（7 個）

```
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB
```

### 3. API 配置（1 個）

```
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

### 4. 功能開關（3 個）

```
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=false
```

### 5. 應用配置（3 個）

```
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=false
VITE_APP_VERSION=3.0.0
```

---

## 🔧 配置步驟

### 方法一：Vercel Dashboard（推薦）

1. **訪問環境變量頁面**
   ```
   https://vercel.com/investment-path-tracker/settings/environment-variables
   ```

2. **點擊 "Add New" 按鈕**

3. **逐一添加上述 15 個變量**
   - Name: 變量名（如 `POSTGRES_URL`）
   - Value: 對應的值
   - Environments: 勾選 Production、Preview、Development（全選）
   - 點擊 Save

4. **重新部署**
   - 點擊 Deployments 標籤
   - 找到最新部署
   - 點擊 ⋯ → Redeploy
   - 等待 1-2 分鐘

---

### 方法二：Vercel CLI

```bash
# 安裝 CLI
npm i -g vercel

# 登錄
vercel login

# 添加環境變量（逐一執行）
vercel env add POSTGRES_URL "postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
vercel env add VITE_FIREBASE_API_KEY AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
vercel env add VITE_FIREBASE_AUTH_DOMAIN investmentpath-5ea2e.firebaseapp.com
vercel env add VITE_FIREBASE_PROJECT_ID investmentpath-5ea2e
vercel env add VITE_FIREBASE_STORAGE_BUCKET investmentpath-5ea2e.firebasestorage.app
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID 793664347438
vercel env add VITE_FIREBASE_APP_ID 1:793664347438:web:4e609b2df64168fca7aebf
vercel env add VITE_FIREBASE_MEASUREMENT_ID G-6RQYZY4NDB
vercel env add API_KEY f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
vercel env add VITE_ENABLE_DEBUG true
vercel env add VITE_ENABLE_PREMIUM true
vercel env add VITE_ENABLE_MOCK_DATA false
vercel env add VITE_API_BASE_URL /api/v1
vercel env add VITE_USE_MOCK_API false
vercel env add VITE_APP_VERSION 3.0.0

# 重新部署
vercel --prod
```

---

## ✅ 驗證配置

### 1. 測試讀取 API

```bash
curl https://investment-path-tracker.vercel.app/api/v1/paths
```

**預期響應**：
```json
{
  "success": true,
  "data": {
    "nodes": {
      "a": {...},
      "b": {...}
    },
    ...
  },
  "meta": {
    "source": "PostgreSQL"
  }
}
```

### 2. 測試寫入 API

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/news \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{"news": [{"id": "test-001", "market": "US", "date": "2026-04-13", "title": "測試", "source": "測試", "severity": "positive", "summary": "測試", "impact": "測試", "affects": ["be"], "relatedPaths": ["e","b"], "tags": ["測試"]}]}'
```

**預期響應**：
```json
{
  "success": true,
  "message": "新聞數據更新成功（實時寫入數據庫）",
  "data": {
    "count": 1,
    "lastUpdated": "2026-04-13T...",
    "source": "PostgreSQL"
  }
}
```

### 3. 訪問網頁

- 主頁：https://investment-path-tracker.vercel.app/
- 新聞：https://investment-path-tracker.vercel.app/news

---

## ❓ 常見問題

### Q: API 返回 500 錯誤？

**A**: 檢查 `POSTGRES_URL` 是否正確配置

### Q: API 返回 401 錯誤？

**A**: 檢查 `API_KEY` 是否正確配置

### Q: 部署失敗？

**A**: 
1. 查看 Vercel Deployments 日誌
2. 確認所有環境變量已配置
3. 確認數據庫連接字符串正確

---

## 🎯 下一步

配置完成後，團隊可以：
1. 使用 API 實時更新數據
2. 查看 `docs/TEAM_API_GUIDE.md` 了解使用方法
3. 享受 100x 更快的更新速度！

---

**配置完成後請測試 API！** 🚀
