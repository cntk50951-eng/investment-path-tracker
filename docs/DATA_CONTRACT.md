# Investment Path Tracker - 數據契約文檔

## 📋 目錄

- [概述](#概述)
- [數據結構總覽](#數據結構總覽)
- [字段詳細說明](#字段詳細說明)
- [數據更新流程](#數據更新流程)
- [合規規範](#合規規範)
- [示例數據](#示例數據)

---

## 概述

本文檔定義了投資路徑追蹤器的 JSON 數據契約，供投研團隊更新數據時參考。

**數據文件位置**：`public/data/latest.json`

**版本**：2.0.0

---

## 數據結構總覽

```json
{
  "meta": {},
  "macros": [],
  "alert": {},
  "nodes": {},
  "switches": {},
  "news": [],
  "thresholdAlert": {}
}
```

---

## 字段詳細說明

### 1. meta（元數據）

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| version | string | ✅ | 數據版本號（語義化版本：主版本。次版本.修訂號） |
| lastUpdated | string | ✅ | 最後更新時間（ISO 8601 格式） |
| nextScheduledUpdate | string | ❌ | 下次預定更新時間 |
| dataSource | string | ❌ | 數據來源說明 |

**示例**：
```json
{
  "version": "2.0.0",
  "lastUpdated": "2026-04-12T10:18:00+08:00",
  "nextScheduledUpdate": "2026-04-15T08:30:00+08:00",
  "dataSource": "人猿團隊"
}
```

---

### 2. macros（宏觀指標）

**類型**：數組

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| name | string | ✅ | 指標名稱（英文或中文） |
| value | string | ✅ | 當前值（帶單位） |
| trend | string | ❌ | 趨勢（up / down / stable） |
| status | string | ✅ | 狀態（hot / warn / normal） |
| note | string | ❌ | 備註說明 |

**示例**：
```json
{
  "name": "CPI YoY",
  "value": "3.3%",
  "trend": "up",
  "status": "hot",
  "note": "近兩年最高"
}
```

**合規要求**：
- ✅ 僅展示客觀數據
- ❌ 不可包含主觀判斷詞（如「應該買入」）

---

### 3. nodes（投資路徑）

**類型**：對象（Key 為路徑 ID）

**路徑 ID**：`a`, `b`, `c`, `d`, `e`

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | ✅ | 路徑 ID（單字符：a/b/c/d/e） |
| market | string | ✅ | 市場（US / HK）- **新增** |
| name | string | ✅ | 路徑名稱（如「A 金髮女孩」） |
| sub | string | ✅ | 副標題（如「軟著陸+AI 加速」） |
| color | string | ✅ | Hex 顏色值（如 #4ade80） |
| x | number | ✅ | 流程圖 X 坐標 |
| y | number | ✅ | 流程圖 Y 坐標 |
| prob | number | ✅ | 概率（0-100） |
| current | boolean | ✅ | 是否為當前路徑 |
| alloc | array | ✅ | 板塊分配（見下方） |

**alloc 結構**：
```json
{
  "n": "AI 半導體板塊",
  "tier": "overweight"
}
```

**tier 可選值**：
- `overweight` - 超配
- `neutral` - 中性
- `underweight` - 低配
- `avoid` - 迴避

**示例**：
```json
{
  "b": {
    "id": "b",
    "market": "US",
    "name": "B 滯脹迷霧",
    "sub": "高通膨 + 溫和增長",
    "color": "#fbbf24",
    "x": 400,
    "y": 215,
    "prob": 35,
    "current": true,
    "alloc": [
      { "n": "公用事業板塊", "tier": "overweight" },
      { "n": "必需消費板塊", "tier": "overweight" },
      { "n": "精選 AI 龍頭", "tier": "neutral" }
    ]
  }
}
```

**合規要求**：
- ✅ 板塊名稱不包含個股代號
- ✅ tier 僅為方向性描述，不含具體百分比
- ❌ 不可使用行動動詞（如「買入」「賣出」）

---

### 4. switches（路徑切換）

**類型**：對象（Key 為切換 ID）

**切換 ID**：格式為 `{from}{to}`，如 `be` 表示 B→E 切換

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| from | string | ✅ | 起始路徑 ID |
| to | string | ✅ | 目標路徑 ID |
| time | string | ✅ | 預計時間（如「8-12 週」） |
| trigger | string | ✅ | 觸發條件描述 |
| path | string | ✅ | SVG 路徑（前端可視化使用） |
| confirms | array | ✅ | 確認信號列表（見下方） |
| desc | string | ✅ | 切換描述 |
| nextCheck | string | ✅ | 下次檢查時間點 |

**confirms 結構**：
```json
{
  "text": "CPI 環比>0.5%（需連續 3 月）",
  "status": "near",
  "actual": "3 月 +0.87% ✅ 第 1 個月確認，需再 2 個月",
  "note": "最重要信號，已觸發 1/3"
}
```

**status 可選值**：
- `yes` - 已確認
- `near` - 接近確認
- `no` - 未確認

**示例**：
```json
{
  "be": {
    "from": "b",
    "to": "e",
    "time": "8-12 週",
    "trigger": "CPI 環比連續 3 個月>0.5%",
    "path": "M 455,238 C 510,278 570,320 638,358",
    "confirms": [
      {
        "text": "CPI 環比>0.5%（需連續 3 月）",
        "status": "near",
        "actual": "3 月 +0.87% ✅ 第 1 個月確認",
        "note": "最重要信號"
      }
    ],
    "desc": "當前最高優先級切換...",
    "nextCheck": "4 月 15 日 CPI 詳細數據"
  }
}
```

---

### 5. news（新聞事件）

**類型**：數組

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | string | ✅ | 唯一標識（建議格式：news-XXX） |
| market | string | ✅ | 市場（US / HK）- **新增** |
| date | string | ✅ | 日期（YYYY-MM-DD） |
| title | string | ✅ | 標題（≤40 字） |
| source | string | ✅ | 來源（媒體名稱） |
| severity | string | ✅ | 嚴重性（critical / medium / positive） |
| summary | string | ✅ | 摘要（≤100 字，免費用戶模糊） |
| impact | string | ✅ | 影響分析（≤200 字，Pro 專屬） |
| affects | array | ✅ | 影響的切換 ID 列表 |
| relatedPaths | array | ✅ | 關聯路徑 ID 列表 |
| tags | array | ✅ | 標籤列表 |
| url | string | ❌ | 原文鏈接 |

**示例**：
```json
{
  "id": "news-014",
  "market": "US",
  "date": "2026-04-13",
  "title": "3 月 CPI 同比 3.3%，近兩年最高",
  "source": "BLS",
  "severity": "critical",
  "summary": "CPI 330.293，環比 +0.87%，同比 3.3% 為 2024 年 4 月以來最高。",
  "impact": "CPI 環比 +0.87% 遠超正常水平，為路徑 E 最核心觸發條件的第 1/3 月確認。",
  "affects": ["be", "ba"],
  "relatedPaths": ["e", "b"],
  "tags": ["CPI", "通膨", "宏觀數據"],
  "url": "https://www.bls.gov/..."
}
```

**合規要求**：
- ✅ 標題客觀陳述事實
- ✅ 摘要不包含行動建議
- ✅ 影響分析使用「歷史上...」「此類環境下...」等中性表述
- ❌ 不可包含「應該買入 X 股票」「建議賣出 Y 板塊」等個人化建議
- ❌ 不可包含具體百分比建議（如「配置 30% 科技股」）

---

### 6. alert（人猿警報）

**類型**：對象（可選）

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| active | boolean | ✅ | 是否激活 |
| level | string | ✅ | 級別（warning / critical / info） |
| timestamp | string | ✅ | 時間戳 |
| title | string | ✅ | 標題 |
| message | string | ✅ | 消息內容 |
| action | string | ✅ | 建議行動（方向性，非具體操作） |

**示例**：
```json
{
  "active": true,
  "level": "warning",
  "timestamp": "2026-04-12T10:18:00+08:00",
  "title": "人猿警報",
  "message": "路徑 E 概率升至 32%，B→E 切換進度 38%。",
  "action": "當前觀察重點：4 月 15 日 CPI 數據為關鍵驗證節點。"
}
```

---

### 7. thresholdAlert（閾值警報）

**類型**：對象（可選）

| 字段 | 類型 | 必填 | 說明 |
|------|------|------|------|
| switchId | string | ✅ | 切換 ID |
| progress | number | ✅ | 進度（0-1） |
| tier | string | ✅ | 閾值層級 |
| nextTrigger | string | ✅ | 下次觸發描述 |

**tier 可選值**：
- `noise` - 噪音
- `early_warning` - 預警
- `initial_confirm` - 初步確認
- `strong` - 強信號
- `locked` - 鎖定

**示例**：
```json
{
  "switchId": "be",
  "progress": 0.38,
  "tier": "early_warning",
  "nextTrigger": "4 月 15 日 CPI 環比>0.5% → 進度升至~55%"
}
```

---

## 數據更新流程

### 方法一：直接編輯 JSON 文件（過渡期）

1. 打開 `public/data/latest.json`
2. 修改對應字段
3. 更新 `meta.lastUpdated` 時間
4. 更新 `meta.version` 版本號
5. 保存並 Git Commit
6. Git Push → Vercel 自動部署

### 方法二：使用 API（推薦）

```bash
curl -X POST "https://your-domain.com/api/v1/admin/news" \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "news": [ ... ]
  }'
```

---

## 合規規範

### ✅ 允許的表述

- 方向性建議：「超配科技板塊」「低配債券」
- 歷史對比：「歷史上此類環境下黃金表現突出」
- 條件陳述：「若 CPI 連續 3 月>0.5%，將觸發路徑 E」
- 客觀數據：「CPI 同比 3.3%」「失業率 4.3%」

### ❌ 禁止的表述

- 具體行動指令：「立即買入 NVDA」「賣出 TSLA」
- 具體百分比：「配置 30% 科技股」「持有 50% 現金」
- 個股推薦：「建議關注 AAPL、MSFT」
- 個人化建議：「您應該...」「您的組合應...」
- 保證性表述：「一定會上漲」「 guaranteed return」

---

## 示例數據

完整示例請參考：`public/data/latest.json`

---

## 更新日期

- 2026-04-13: 版本 2.0.0（新增港股市場支持）
- 數據格式：JSON
- 合規標準：香港 SFC 指引
