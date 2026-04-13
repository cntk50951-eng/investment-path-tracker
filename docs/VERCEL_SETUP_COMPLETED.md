# ✅ Vercel 配置完成清單

## 🎯 您的項目信息

- **項目名稱**: investment-path-tracker
- **Vercel URL**: https://investment-path-tracker.vercel.app/
- **版本**: 3.0.0
- **更新日期**: 2026-04-13

---

## 📋 需要配置的環境變量（14 個）

### ✅ 已生成 API Key
```
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

### 完整列表（可直接複製）

#### 1. Firebase 配置（7 個）
```
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB
```

#### 2. API 配置（3 個）
```
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK_API=false
API_KEY=f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

#### 3. 功能開關（3 個）
```
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=false
```

#### 4. 應用配置（1 個）
```
VITE_APP_VERSION=3.0.0
```

---

## 🚀 配置步驟（5 分鐘完成）

### 步驟 1: 登錄 Vercel

訪問：https://vercel.com/dashboard

### 步驟 2: 找到項目

點擊 `investment-path-tracker` 項目卡片

### 步驟 3: 進入環境變量設置

1. 點擊頂部 `Settings` 標籤
2. 點擊左側 `Environment Variables`
3. 點擊 `Add New` 按鈕

### 步驟 4: 逐一添加變量

**重複以下步驟 14 次**（每次添加一個變量）：

1. 點擊 `Add New`
2. Name: 粘貼變量名稱（如 `VITE_FIREBASE_API_KEY`）
3. Value: 粘貼對應的值
4. Environments: 勾選 **Production**, **Preview**, **Development**（全選）
5. 點擊 `Save`

### 步驟 5: 重新部署

1. 添加完所有變量後，點擊頂部 `Deployments` 標籤
2. 找到最新的部署
3. 點擊右側 `⋯` 按鈕
4. 選擇 `Redeploy`
5. 等待部署完成（約 30-60 秒）

---

## ✅ 驗證測試

部署完成後，訪問以下 URL 測試：

### 1. 測試首頁
```
https://investment-path-tracker.vercel.app/
```
✅ 應顯示登錄頁面或儀表板

### 2. 測試新聞時間線
```
https://investment-path-tracker.vercel.app/news
```
✅ 應顯示新聞列表和篩選器

### 3. 測試 API - 路徑
```bash
curl https://investment-path-tracker.vercel.app/api/v1/paths
```
✅ 應返回 JSON 數據，包含 nodes 和 switches

### 4. 測試 API - 新聞
```bash
curl https://investment-path-tracker.vercel.app/api/v1/news
```
✅ 應返回新聞列表

### 5. 測試 API - 寫入（需 API Key）
```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/paths \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{"nodes": {}}'
```
✅ 應返回成功消息

---

## 🔒 Firebase 配置（重要！）

### 配置 Authorized Domains

1. 訪問 https://console.firebase.google.com/
2. 選擇項目：`investmentpath-5ea2e`
3. 點擊左側 `Authentication`
4. 點擊 `Settings` 標籤
5. 找到 `Authorized domains`
6. 點擊 `Add domain`
7. 輸入：`investment-path-tracker.vercel.app`
8. 點擊 `Add`

⚠️ **不配置此項將導致登錄失敗！**

---

## 📊 完成檢查清單

部署後請逐一勾選：

- [ ] 14 個環境變量全部添加
- [ ] 已重新部署到 Production
- [ ] 首頁可以正常訪問
- [ ] 新聞時間線頁面正常
- [ ] API 返回正確數據
- [ ] Firebase Authorized Domains 已配置
- [ ] Google 登錄功能正常
- [ ] 免費用戶付費牆正常顯示
- [ ] Pro 用戶功能正常

---

## 🆘 常見問題

### Q: 環境變量添加後不生效？

**A**: 需要重新部署才會生效
- 點擊 `Deployments` → `Redeploy`

### Q: API 返回 500 錯誤？

**A**: 檢查環境變量是否正確
- 確認所有 `VITE_` 開頭的變量已添加
- 確認 `API_KEY` 已添加（不是 `VITE_API_KEY`）

### Q: 登錄失敗？

**A**: 配置 Firebase Authorized Domains
- 按照上方「Firebase 配置」步驟操作

### Q: 如何更新 API Key？

**A**: 
1. 生成新 Key: `openssl rand -hex 32`
2. Vercel Dashboard → Settings → Environment Variables
3. 編輯 `API_KEY`
4. 重新部署

---

## 📞 需要協助？

1. 查看詳細文檔：`docs/VERCEL_ENVIRONMENT_SETUP.md`
2. API 文檔：`docs/API_DOCUMENTATION.md`
3. 數據更新指南：`docs/API_INTEGRATION_GUIDE.md`

---

**配置完成後，您的應用將 fully operational！** 🎉
