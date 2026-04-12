# 🔓 將倉庫設為公開的步驟

**問題**: Vercel Hobby Plan 不支援私有倉庫的協作部署

**解決方案**: 將 GitHub 倉庫設為公開（Public）

---

## 📋 操作步驟

### 步驟 1: 訪問 GitHub 倉庫

🔗 連結：https://github.com/cntk50951-eng/investment-path-tracker

### 步驟 2: 進入 Settings

1. 點擊頂部導航欄的 **"Settings"** 標籤
2. 滾動到頁面底部

### 步驟 3: 修改可見性

找到 **"Danger Zone"** 區域：

1. 找到 **"Change repository visibility"**
2. 點擊 **"Change visibility"**
3. 選擇 **"Make public"**
4. 確認操作（需要輸入倉庫名稱確認）

### 步驟 4: 確認修改

確認後，倉庫將變為公開可見。

---

## ⚠️ 重要提醒

### 公開倉庫的影響

**優點**:
- ✅ Vercel Hobby Plan 可以部署
- ✅ 其他人可以查看代碼
- ✅ 可以添加協作者

**注意**:
- ⚠️ 代碼對所有人可見
- ⚠️ 不要提交敏感信息（密碼、API Key 等）
- ⚠️ `.env` 文件已在 `.gitignore` 中，不會提交

### 已保護的敏感信息

以下文件已在 `.gitignore` 中，**不會**提交到 GitHub：

```
.env
.env.local
.env.*.local
```

**Firebase 配置** 在代碼中使用 `import.meta.env`，從環境變量讀取，**不會**暴露在公開代碼中。

---

## 🚀 修改後的部署步驟

### 1. 等待 GitHub 同步

修改為公開後，等待 1-2 分鐘讓 GitHub 同步。

### 2. 在 Vercel 重新部署

1. 訪問：https://vercel.com/dashboard
2. 找到 `investment-path-tracker` 項目
3. 點擊 **"Redeploy"**
4. 等待部署完成

### 3. 如果還是失敗

1. 進入 Vercel 項目設置
2. 點擊 **"Git"**
3. 點擊 **"Disconnect Repository"**
4. 重新連接：選擇 `investment-path-tracker`
5. 點擊 **"Deploy"**

---

## ✅ 檢查清單

- [ ] 訪問 GitHub 倉庫 Settings
- [ ] 修改為 Public
- [ ] 確認修改成功
- [ ] 等待 1-2 分鐘
- [ ] 在 Vercel 重新部署
- [ ] 檢查部署狀態
- [ ] 測試功能

---

## 📞 遇到問題？

如果在 Vercel 部署時仍有問題，請檢查：

1. **環境變量是否正確配置**
   - 見 `VERCEL_QUICK_DEPLOY.md`
   
2. **vercel.json 是否存在**
   - 已推送到根目錄
   
3. **構建是否成功**
   - 查看 Vercel 部署日誌

---

**請立即將倉庫設為公開，然後在 Vercel 重新部署！** 🚀
