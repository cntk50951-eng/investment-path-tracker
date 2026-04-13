# 🚨 緊急：Vercel 環境變量配置指南

## ⚠️ 問題：API 返回 500 錯誤

**原因**：Vercel 沒有配置 `POSTGRES_URL` 環境變量  
**影響**：API 無法連接數據庫，頁面顯示舊數據

---

## ✅ 立即配置（5 分鐘完成）

### 步驟 1：訪問 Vercel Dashboard

打開：https://vercel.com/investment-path-tracker/settings/environment-variables

### 步驟 2：添加環境變量

點擊 **"Add New"**，逐一添加以下變量：

#### 1. POSTGRES_URL（最重要！）

```
Name:  POSTGRES_URL
Value: postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
Environments: 勾選 Production, Preview, Development（全選）
```

#### 2. API_KEY

```
Name:  API_KEY
Value: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
Environments: 全選
```

#### 3. 其他必需變量

```
Name:  VITE_FIREBASE_API_KEY
Value: AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM

Name:  VITE_FIREBASE_AUTH_DOMAIN
Value: investmentpath-5ea2e.firebaseapp.com

Name:  VITE_FIREBASE_PROJECT_ID
Value: investmentpath-5ea2e

Name:  VITE_ENABLE_DEBUG
Value: true

Name:  VITE_ENABLE_PREMIUM
Value: true

Name:  VITE_ENABLE_MOCK_DATA
Value: false

Name:  VITE_API_BASE_URL
Value: /api/v1

Name:  VITE_USE_MOCK_API
Value: false

Name:  VITE_APP_VERSION
Value: 3.0.0
```

### 步驟 3：重新部署

1. 點擊頂部 **"Deployments"** 標籤
2. 找到最新部署
3. 點擊 **"⋯"** → **"Redeploy"**
4. 等待 1-2 分鐘

---

## 🧪 驗證配置

### 測試 API

```bash
# 測試 API 是否正常
curl https://investment-path-tracker.vercel.app/api/v1/paths | jq '.data.nodes'

# 預期結果：
# {
#   "a": {"prob": 9, ...},
#   "b": {"prob": 31, ...},
#   "d": {"prob": 20, ...},
#   "e": {"prob": 33, ...}
# }
```

### 測試網頁

訪問：https://investment-path-tracker.vercel.app/

**預期**：
- 路徑概率應顯示更新後的值（D=20%, B=31%, E=33%）
- 警報應顯示最新信息
- 新聞應包含 4 月 14 日的新聞

---

## ❓ 常見問題

### Q: 部署後還是舊數據？

**A**: 清除瀏覽器緩存
- Chrome: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
- Safari: Cmd+Option+E

### Q: API 還是 500 錯誤？

**A**: 檢查環境變量是否正確
1. 確認 POSTGRES_URL 完全正確（無空格）
2. 確認已勾選所有環境（Production/Preview/Development）
3. 查看 Vercel Functions 日誌

### Q: 如何查看日誌？

**A**: 
1. 訪問 Vercel Dashboard
2. 點擊項目 → Functions
3. 查看最新錯誤日誌

---

## 📞 緊急聯繫

如果配置遇到問題：
- 查看 `DB_OPERATIONS_INTERNAL.md` 獲取完整 credential
- 查看 `docs/VERCEL_DB_ENV_SETUP.md` 獲取詳細指南

---

**配置完成後 API 將立即恢復，頁面會顯示最新數據！** 🚀

