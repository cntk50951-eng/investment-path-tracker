# 🚀 Vercel 部署最終指南

**最後更新**: 2026-04-12  
**狀態**: ⚠️ 需要將倉庫設為公開

---

## ⚡ 快速解決步驟

### 問題診斷

**錯誤信息**:
```
The deployment was blocked because the commit author did not have contributing access to the project on Vercel.
The Hobby Plan does not support collaboration for private repositories.
```

**原因**: Vercel Hobby Plan 不支援私有倉庫

**解決**: 將 GitHub 倉庫設為 **公開（Public）**

---

## 🔓 步驟 1: 將倉庫設為公開

### 快速連結

👉 **直接訪問**: https://github.com/cntk50951-eng/investment-path-tracker/settings

### 操作圖示

1. 訪問上方連結
2. 滾動到頁面 **最底部**
3. 找到 **"Danger Zone"** 區域（紅色邊框）
4. 點擊 **"Change visibility"** 按鈕
5. 選擇 **"Make public"**
6. 輸入確認信息：`cntk50951-eng/investment-path-tracker`
7. 點擊確認

**完成！** 倉庫現在是公開的。

---

## 🚀 步驟 2: 在 Vercel 重新部署

### 快速連結

👉 **Vercel Dashboard**: https://vercel.com/dashboard

### 操作步驟

1. 訪問 Vercel Dashboard
2. 找到 `investment-path-tracker` 項目
3. 點擊 **"..."** 菜單
4. 選擇 **"Redeploy"**
5. 等待部署完成（約 30-60 秒）

### 或者重新導入

如果 Redeploy 仍失敗：

1. 刪除當前項目（在 Vercel）
2. 訪問：https://vercel.com/new
3. Import: `cntk50951-eng/investment-path-tracker`
4. 配置環境變量（見下方）
5. Deploy

---

## 🔧 步驟 3: 配置環境變量

在 Vercel Dashboard → Settings → Environment Variables 添加：

### Firebase (7 個)

```
VITE_FIREBASE_API_KEY=AIzaSyA6LXCKT1kvOvna4oPHqQ4VgtiFSXSwgiM
VITE_FIREBASE_AUTH_DOMAIN=investmentpath-5ea2e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investmentpath-5ea2e
VITE_FIREBASE_STORAGE_BUCKET=investmentpath-5ea2e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=793664347438
VITE_FIREBASE_APP_ID=1:793664347438:web:4e609b2df64168fca7aebf
VITE_FIREBASE_MEASUREMENT_ID=G-6RQYZY4NDB
```

### 功能開關 (3 個)

```
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_MOCK_DATA=true
```

### 可選

```
VITE_APP_NAME="2026 美股投資路徑切換中心"
```

---

## ✅ 成功檢查清單

部署完成後，訪問生成的域名測試：

- [ ] 頁面正常加載（無 404）
- [ ] 宏觀數據欄顯示
- [ ] 警報系統顯示
- [ ] 流程圖動畫正常
- [ ] 切換表數據正確
- [ ] 新聞面板顯示
- [ ] 點擊路徑 → 顯示詳情
- [ ] 點擊切換 → 顯示詳情
- [ ] 點擊新聞 → 顯示詳情

---

## ⚠️ 常見問題

### Q1: 部署仍顯示 404

**解決**:
1. 確認 `vercel.json` 存在於根目錄
2. 確認已推送到 GitHub
3. 在 Vercel Redeploy

### Q2: 修改可見性後多久生效？

**答**: GitHub 同步需要 1-2 分鐘，請稍後再部署。

### Q3: Vercel 找不到倉庫

**解決**:
1. 確認倉庫已設為公開
2. 在 Vercel 重新授權 GitHub 訪問
3. 刷新頁面重試

### Q4: 環境變量不生效

**解決**:
1. 確認變量名稱正確（大寫）
2. 確認在正確的環境添加（Production/Development）
3. 重新部署使變量生效

---

## 📞 技術支持

**文檔**:
- `README.md` - 項目說明
- `VERCEL_QUICK_DEPLOY.md` - 快速部署指南
- `MAKE_PUBLIC.md` - 公開倉庫指南
- `DEPLOYMENT_GUIDE.md` - 詳細部署指南

**倉庫**: https://github.com/cntk50951-eng/investment-path-tracker

---

## 🎯 下一步

1. ✅ **立即執行**: 將倉庫設為公開
2. ⏳ **等待**: 1-2 分鐘讓 GitHub 同步
3. 🚀 **部署**: 在 Vercel 重新部署
4. ✅ **測試**: 訪問部署網址測試功能

---

**祝您部署成功！** 🎉
