# 📊 數據更新指南

**重要**: 數據文件 `public/data/latest.json` 已恢復並推送到 GitHub。

## 🔄 更新流程

### 1. 編輯數據文件

```bash
# 打開文件
code data/latest.json
```

### 2. 更新內容

主要更新字段：
- `meta.lastUpdated` - 更新時間
- `nodes.{id}.prob` - 路徑概率
- `switches.{id}.confirms[].status` - 確認信號狀態
- `news` - 添加新新聞

### 3. 驗證格式

```bash
npm run validate-data  # 如已添加此腳本
```

### 4. 提交並推送

```bash
git add data/latest.json
git commit -m "update: YYYY-MM-DD 數據更新"
git push origin main
```

### 5. 等待部署

Vercel 會自動重新部署（約 30 秒）

## ⚠️ 注意事項

1. **概率總和必須為 100%**
2. **使用合法的 JSON 格式**
3. **不要提交 `.env` 文件**
4. **新聞按日期降序排列**

## 📋 常見更新場景

### CPI 數據發布
1. 更新 `macros` 中的 CPI 值
2. 更新相關切換的 `confirms`
3. 添加 CPI 新聞
4. 調整路徑概率

### 地緣政治事件
1. 添加新聞到 `news` 數組
2. 更新 `alert` (如需要)
3. 更新相關切換的 `confirms`
4. 調整路徑 D 概率

---

**當前數據文件**: `public/data/latest.json` ✅
