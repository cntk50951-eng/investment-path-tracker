# 數據更新指南

> 給另一個團隊的數據更新操作說明

## 📁 文件位置

所有需要更新的數據都在 `data/latest.json` 文件中。

## 🔄 更新流程

### 步驟 1: 打開數據文件

```bash
# 在項目根目錄
code data/latest.json
# 或使用其他編輯器
```

### 步驟 2: 更新元數據

```json
{
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2026-04-15T10:00:00+08:00",  // 更新為當前時間
    "nextScheduledUpdate": "2026-04-16T08:30:00+08:00",
    "dataSource": "人猿團隊"
  }
}
```

### 步驟 3: 更新路徑概率

```json
{
  "nodes": {
    "a": { "prob": 13 },  // A 金髮女孩概率
    "b": { "prob": 35 },  // B 滯脹迷霧概率 (當前路徑)
    "c": { "prob": 10 },  // C 硬著陸概率
    "d": { "prob": 10 },  // D 黑天鵝概率
    "e": { "prob": 32 }   // E 再通膨概率
  }
}
```

**注意**: 所有概率總和必須為 100%

### 步驟 4: 更新切換確認信號

```json
{
  "switches": {
    "be": {
      "confirms": [
        {
          "text": "CPI 環比>0.5%（需連續 3 月）",
          "status": "near",  // 可選：'yes' | 'near' | 'no'
          "actual": "3 月 +0.87% ✅ 第 1 個月確認",
          "note": "最重要信號"
        }
      ]
    }
  }
}
```

**狀態說明**:
- `yes`: 已確認
- `near`: 接近門檻
- `no`: 未達到

**進度計算**: 
- yes = 1 分
- near = 0.5 分
- no = 0 分
- 進度 = 總分 / 信號數量

### 步驟 5: 添加新新聞

```json
{
  "news": [
    {
      "id": "news-014",
      "date": "2026-04-15",
      "title": "4 月 CPI 數據發布",
      "source": "BLS",
      "severity": "critical",  // 可選：'critical' | 'medium' | 'positive'
      "summary": "CPI 環比 +0.6%，連續第 2 個月超預期...",
      "affects": ["be", "ba"]  // 影響的切換 ID
    }
  ]
}
```

**新聞排序**: 按 date 字段降序排列 (最新的在前)

### 步驟 6: 更新警報 (可選)

```json
{
  "alert": {
    "active": true,  // 是否顯示警報
    "level": "warning",  // 可選：'warning' | 'critical' | 'info'
    "timestamp": "2026-04-15T10:18:00+08:00",
    "title": "人猿警報",
    "message": "路徑 E 概率升至 40%...",
    "action": "執行 P0 預備清單"
  }
}
```

### 步驟 7: 更新閾值警報

```json
{
  "thresholdAlert": {
    "switchId": "be",  // 當前最重要的切換
    "progress": 0.55,  // 進度 0-1 之間
    "tier": "initial_confirm",  // 層級
    "nextTrigger": "4 月 15 日 CPI 環比>0.5% → 進度升至~70%"
  }
}
```

**閾值層級**:
- `noise`: < 35%
- `early_warning`: 35-50%
- `initial_confirm`: 50-60%
- `strong`: 60-75%
- `locked`: > 75%

### 步驟 8: 驗證數據

```bash
npm run validate-data
```

如果沒有此命令，可以手動檢查:
1. 概率總和 = 100%
2. 所有切換的 from/to 都存在
3. 新聞 affects 指向有效的切換 ID

### 步驟 9: 提交 & Push

```bash
git add data/latest.json
git commit -m "update: 2026-04-15 CPI 數據更新

- 更新路徑概率：E 升至 40%
- 更新 B→E 切換進度：55%
- 添加 4 月 CPI 新聞"
git push
```

### 步驟 10: 驗證部署

訪問 Vercel 部署的網址，確認數據已更新。

## 📋 常見更新場景

### 場景 1: CPI 數據發布

1. 更新 `macros` 中的 CPI 值
2. 更新相關切換的 `confirms`
3. 添加 CPI 新聞
4. 可能調整路徑概率

### 場景 2: 地緣政治事件

1. 添加新聞到 `news` 數組
2. 更新 `alert` (如需要)
3. 更新相關切換的 `confirms`
4. 可能調整路徑 D 概率

### 場景 3: Fed 會議

1. 更新 `macros` 中的 Fed Rate
2. 更新相關切換的 `confirms`
3. 添加會議結果新聞
4. 調整路徑概率

## ⚠️ 注意事項

1. **JSON 格式**: 確保 JSON 格式正確，使用編輯器的 JSON 驗證功能
2. **概率總和**: 所有路徑概率必須 = 100%
3. **時間格式**: 使用 ISO 8601 格式 `YYYY-MM-DDTHH:mm:ss+08:00`
4. **ID 唯一性**: 新聞 ID 必須唯一
5. **切換引用**: `affects` 必須指向存在的切換 ID

## 🆘 問題排查

### 問題：頁面顯示空白

1. 檢查 JSON 格式是否正確
2. 查看瀏覽器控制台錯誤
3. 確認概率總和為 100%

### 問題：數據未更新

1. 確認已 Push 到 GitHub
2. 檢查 Vercel 部署狀態
3. 清除瀏覽器緩存

### 問題：驗證失敗

1. 檢查錯誤訊息
2. 確認所有引用都存在
3. 對比 `schema.json`

## 📞 技術支持

如有問題，請聯繫開發團隊。
