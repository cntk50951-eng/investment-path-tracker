# 港股數據庫更新指南

本文件指導團隊如何更新港股（HK）數據庫中的路徑數據。

## 數據庫結構

港股和美股**共用同一組資料庫表**，通過 `market` 欄位（值為 `'HK'` 或 `'US'`）區分。

### 核心表

| 表名 | 說明 | market 欄位 |
|------|------|-------------|
| `nodes` | 路徑節點（A-E 五條路徑） | ✅ |
| `allocations` | 板塊配置（通過 node_id 關聯） | 間接（node_id 前綴為 hk） |
| `switches` | 路徑切換（含確認信號） | ✅ |
| `confirm_signals` | 確認信號（通過 switch_id 關聯） | 間接（switch_id 前綴為 hk） |
| `news` | 新聞事件 | ✅ |
| `news_affects` | 新聞影響的切換 | 間接 |
| `news_related_paths` | 新聞關聯路徑 | 間接 |
| `news_tags` | 新聞標籤 | 間接 |
| `macros` | 宏觀指標 | ✅ |
| `alerts` | 警報 | ✅ |
| `threshold_alerts` | 閾值警報 | ✅ |

### 港股 ID 命名規則

港股數據使用 `hk` 前綴，避免與美股主鍵衝突：

| 類型 | 美股 ID | 港股 ID |
|------|---------|---------|
| 節點 | a, b, c, d, e | hka, hkb, hkc, hkd, hke |
| 切換 | be, bd, bc, ... | hkbe, hkbd, hkbc, ... |
| 新聞 | us-20260412-001 | hk-20260414-001 |

## 常用更新操作

### 1. 更新路徑概率

```sql
-- 更新單個路徑概率
UPDATE nodes SET prob = 37, updated_at = NOW() WHERE id = 'hke' AND market = 'HK';

-- 批量更新所有港股路徑概率
UPDATE nodes SET prob = CASE id
  WHEN 'hka' THEN 10
  WHEN 'hkb' THEN 33
  WHEN 'hkc' THEN 8
  WHEN 'hkd' THEN 12
  WHEN 'hke' THEN 37
END, updated_at = NOW()
WHERE id IN ('hka','hkb','hkc','hkd','hke') AND market = 'HK';
```

### 2. 切換當前基準路徑

```sql
-- 取消舊基準
UPDATE nodes SET current = false, updated_at = NOW() WHERE market = 'HK';

-- 設定新基準
UPDATE nodes SET current = true, updated_at = NOW() WHERE id = 'hke' AND market = 'HK';
```

### 3. 更新確認信號

```sql
-- 更新單個確認信號狀態
UPDATE confirm_signals SET status = 'near', actual = '3月CPI+0.87%', note = '方向正確'
WHERE switch_id = 'hkbe' AND text LIKE '%社零%';

-- 批量更新某個切換的所有確認信號
-- （建議先刪除再重新插入）
DELETE FROM confirm_signals WHERE switch_id = 'hkbe';

INSERT INTO confirm_signals (switch_id, text, status, actual, note) VALUES
('hkbe', '社零同比>8% 連續 3 月', 'near', '3月+2.1%', '方向正確'),
('hkbe', '出口同比>10% 連續 3 月', 'no', '3月出口低於預期', ''),
('hkbe', '人民幣升值至 USD/CNY<7.0', 'no', '當前 7.2-7.3', ''),
('hkbe', '南向資金連續 30 日淨流入', 'yes', '已連續 35 日', '確認'),
('hkbe', '恆指突破 26,000', 'yes', '當前 26,150', '已突破');
```

### 4. 更新切換描述和下次檢查

```sql
UPDATE switches SET
  description = '新的切換描述',
  next_check = '5月1日 中國PMI數據',
  updated_at = NOW()
WHERE id = 'hkbe' AND market = 'HK';
```

### 5. 更新宏觀指標

```sql
-- 更新單個指標
UPDATE macros SET value = '26,150 ↑0.8%', trend = 'up', status = 'hot', note = '持續上漲'
WHERE name = '恆指' AND market = 'HK';

-- 添加新指標
INSERT INTO macros (name, value, trend, status, note, market)
VALUES ('新指標', '值', 'stable', 'normal', '備註', 'HK');

-- 刪除指標
DELETE FROM macros WHERE name = '舊指標' AND market = 'HK';
```

### 6. 添加新聞

```sql
INSERT INTO news (id, market, date, title, source, severity, summary, impact, url)
VALUES ('hk-20260415-001', 'HK', '2026-04-15', '新聞標題', '來源',
        'positive', '摘要', '影響路徑：hkbe', 'https://example.com');

-- 關聯新聞到切換
INSERT INTO news_affects (news_id, switch_id) VALUES ('hk-20260415-001', 'hkbe');

-- 關聯新聞到路徑
INSERT INTO news_related_paths (news_id, path_id) VALUES ('hk-20260415-001', 'hke');

-- 添加標籤
INSERT INTO news_tags (news_id, tag) VALUES ('hk-20260415-001', '宏觀經濟');
```

### 7. 更新警報

```sql
-- 確保只有一條活躍警報
DELETE FROM alerts WHERE market = 'HK';

INSERT INTO alerts (active, level, timestamp, title, message, action, market)
VALUES (true, 'warning', NOW(),
        '宏觀研究警報',
        '警報內容',
        '建議行動',
        'HK');
```

### 8. 更新閾值警報

```sql
DELETE FROM threshold_alerts WHERE market = 'HK';

INSERT INTO threshold_alerts (switch_id, progress, tier, next_trigger, market)
VALUES ('hkbe', 0.35, 'early_warning', '下次檢查點描述', 'HK');
```

### 9. 更新板塊配置

```sql
-- 先刪除舊配置
DELETE FROM allocations WHERE node_id = 'hke';

-- 插入新配置
INSERT INTO allocations (node_id, name, tier) VALUES
('hke', '互聯網/科技龍頭', 'overweight'),
('hke', '新能源板塊', 'overweight'),
('hke', '消費板塊', 'overweight'),
('hke', '金融板塊', 'overweight'),
('hke', '能源板塊', 'neutral'),
('hke', '地產板塊', 'avoid');
```

## API 端點

前端通過以下 API 獲取港股數據，所有 API 支持 `market=HK` 參數：

| 端點 | 說明 | market 參數 |
|------|------|-------------|
| `/api/v1/paths?market=HK` | 路徑數據（節點+切換+警報+閾值） | ✅ |
| `/api/v1/news?market=HK` | 新聞數據 | ✅ |
| `/api/v1/macros?market=HK` | 宏觀指標 | ✅ |

更新 DB 後，刷新頁面即可看到新數據（無緩存）。

## 執行遷移腳本（首次部署時使用）

```bash
# 環境變量需要包含 POSTGRES_URL
node --experimental-vm-modules db/migrate-hk.js
```

## 注意事項

1. **ID 前綴**：港股節點用 `hk` 前綴（hka, hkb...），切換用 `hk` 前綴（hkbe, hkbd...），新聞用 `hk-` 前綴
2. **market 欄位**：所有更新操作必須包含 `WHERE market = 'HK'`，避免影響美股數據
3. **排查問題**：如港股數據未顯示，檢查 API 調用的 `market=HK` 參數是否正確傳遞
4. **概率之和**：5 條路徑的概率之和應為 100%
5. **板塊配置 tier 值**：`overweight`（高配）、`neutral`（標配）、`underweight`（低配）、`avoid`（規避）