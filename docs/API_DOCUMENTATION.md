# Investment Path Tracker - API 文檔

## 📋 目錄

- [概述](#概述)
- [基礎信息](#基礎信息)
- [認證方式](#認證方式)
- [速率限制](#速率限制)
- [讀取 API](#讀取-api)
- [寫入 API](#寫入-api)
- [錯誤碼](#錯誤碼)
- [使用示例](#使用示例)

---

## 概述

投資路徑追蹤器 API 提供 RESTful 接口，用於獲取和更新投資路徑、新聞、宏觀指標等數據。

**Base URL**: `https://your-domain.com/api/v1`

**過渡期方案**：本地開發時使用靜態 JSON 文件（`/data/latest.json`），生產環境使用 API。

---

## 基礎信息

### 響應格式

所有 API 響應均為 JSON 格式：

**成功響應**：
```json
{
  "success": true,
  "data": { /* 數據內容 */ },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "version": "1.0.0",
    "market": "US",
    "count": 13
  }
}
```

**錯誤響應**：
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "請求頻率過高，請稍後再試",
    "retryAfter": 3600
  }
}
```

### HTTP 方法

- `GET` - 讀取數據
- `POST` - 更新數據（需要 API Key）

---

## 認證方式

### 讀取 API（公開）

無需認證，但受速率限制約束。

### 寫入 API（團隊專用）

需要在請求 Header 中攜帶 API Key：

```
X-API-Key: your_api_key_here
```

**API Key 申請**：請聯繫項目管理員獲取。

---

## 速率限制

| 用戶類型 | 限制 | 時間窗口 |
|---------|------|---------|
| 匿名用戶 | 100 請求 | 每小時 |
| API Key 用戶 | 1000 請求 | 每小時 |

超過限制會返回 `429 Too Many Requests` 錯誤。

---

## 讀取 API

### 1. GET /paths

獲取投資路徑數據（節點、切換、警報）。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| market | string | 否 | 市場標識（US / HK），默认 US |

**響應示例**：
```json
{
  "success": true,
  "data": {
    "nodes": {
      "a": { "id": "a", "name": "A 金髮女孩", "prob": 13, ... },
      "b": { "id": "b", "name": "B 滯脹迷霧", "prob": 35, ... }
    },
    "switches": {
      "be": { "from": "b", "to": "e", "trigger": "...", ... }
    },
    "alert": { "active": true, "level": "warning", ... },
    "thresholdAlert": { "switchId": "be", "progress": 0.38, ... }
  },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "version": "2.0.0",
    "market": "US",
    "lastUpdated": "2026-04-12T10:18:00+08:00"
  }
}
```

---

### 2. GET /news

獲取新聞事件列表。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| market | string | 否 | 市場（US / HK） |
| limit | number | 否 | 返回數量限制 |
| severity | string | 否 | 嚴重性篩選（critical / medium / positive） |
| tag | string | 否 | 標籤篩選 |
| path | string | 否 | 路徑篩選（a / b / c / d / e） |
| startDate | string | 否 | 開始日期（YYYY-MM-DD） |
| endDate | string | 否 | 結束日期（YYYY-MM-DD） |

**響應示例**：
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": "news-001",
        "market": "US",
        "date": "2026-04-12",
        "title": "以色列批准 34 個新定居點",
        "source": "Al Jazeera",
        "severity": "medium",
        "summary": "...",
        "impact": "...",
        "affects": ["bd"],
        "relatedPaths": ["d"],
        "tags": ["地緣政治", "中東"]
      }
    ],
    "total": 13
  },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "market": "US",
    "filters": { "severity": null, "tag": null }
  }
}
```

---

### 3. GET /macros

獲取宏觀指標數據。

**請求參數**：無

**響應示例**：
```json
{
  "success": true,
  "data": {
    "macros": [
      { "name": "CPI YoY", "value": "3.3%", "trend": "up", "status": "hot" },
      { "name": "核心 PCE", "value": "2.8%", "trend": "up", "status": "hot" }
    ]
  },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "count": 9
  }
}
```

---

### 4. GET /switches

獲取路徑切換信息。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| market | string | 否 | 市場（US / HK） |

**響應示例**：
```json
{
  "success": true,
  "data": {
    "switches": {
      "be": {
        "from": "b",
        "to": "e",
        "time": "8-12 週",
        "trigger": "CPI 環比連續 3 個月>0.5%",
        "confirms": [...],
        "desc": "...",
        "nextCheck": "4 月 15 日 CPI 詳細數據"
      }
    }
  },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "market": "US",
    "count": 12
  }
}
```

---

### 5. GET /market

獲取完整市場數據（包含所有信息）。

**請求參數**：

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| market | string | 否 | 市場（US / HK） |

**響應示例**：
```json
{
  "success": true,
  "data": {
    "nodes": { ... },
    "switches": { ... },
    "macros": [ ... ],
    "news": [ ... ],
    "alert": { ... }
  },
  "meta": {
    "timestamp": "2026-04-12T10:18:00Z",
    "market": "US"
  }
}
```

---

## 寫入 API

### 6. POST /admin/paths

更新路徑數據（需要 API Key）。

**請求 Header**：
```
X-API-Key: your_api_key
```

**請求 Body**：
```json
{
  "nodes": {
    "a": { "id": "a", "name": "A 金髮女孩", "prob": 15 },
    "b": { "id": "b", "prob": 33 }
  },
  "switches": {
    "be": { "trigger": "更新後的觸發條件" }
  },
  "alert": {
    "active": true,
    "level": "critical",
    "message": "新警報信息"
  },
  "thresholdAlert": {
    "switchId": "be",
    "progress": 0.55
  },
  "version": "2.0.1"
}
```

**響應示例**：
```json
{
  "success": true,
  "message": "路徑數據更新成功",
  "data": {
    "lastUpdated": "2026-04-12T10:18:00Z",
    "version": "2.0.1"
  }
}
```

---

### 7. POST /admin/news

更新新聞數據（需要 API Key）。

**請求 Header**：
```
X-API-Key: your_api_key
```

**請求 Body**：
```json
{
  "news": [
    {
      "id": "news-014",
      "market": "US",
      "date": "2026-04-13",
      "title": "新新聞標題",
      "source": "來源",
      "severity": "critical",
      "summary": "摘要（100 字內）",
      "impact": "影響分析（200 字內）",
      "affects": ["be"],
      "relatedPaths": ["e", "b"],
      "tags": ["通膨", "CPI"],
      "url": "https://..."
    }
  ]
}
```

**響應示例**：
```json
{
  "success": true,
  "message": "新聞數據更新成功",
  "data": {
    "count": 14,
    "lastUpdated": "2026-04-12T10:18:00Z"
  }
}
```

---

## 錯誤碼

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|-----------|------|
| `RATE_LIMIT_EXCEEDED` | 429 | 請求頻率過高 |
| `UNAUTHORIZED` | 401 | API Key 無效或缺失 |
| `INVALID_DATA` | 400 | 數據格式無效 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `INTERNAL_ERROR` | 500 | 服務器內部錯誤 |
| `TIMEOUT` | 408 | 請求超時 |
| `NETWORK_ERROR` | - | 網絡錯誤 |

---

## 使用示例

### cURL 示例

**獲取路徑數據**：
```bash
curl -X GET "https://your-domain.com/api/v1/paths?market=US"
```

**獲取新聞列表**：
```bash
curl -X GET "https://your-domain.com/api/v1/news?limit=10&severity=critical"
```

**更新路徑數據**：
```bash
curl -X POST "https://your-domain.com/api/v1/admin/paths" \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": {
      "b": { "id": "b", "prob": 33 }
    }
  }'
```

### JavaScript 示例

```javascript
// 獲取路徑數據
const response = await fetch('https://your-domain.com/api/v1/paths?market=US');
const data = await response.json();

if (data.success) {
  console.log('路徑數據:', data.data);
} else {
  console.error('錯誤:', data.error);
}

// 更新新聞數據
const updateResponse = await fetch('https://your-domain.com/api/v1/admin/news', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    news: [
      {
        id: 'news-014',
        market: 'US',
        date: '2026-04-13',
        title: '新新聞',
        source: '來源',
        severity: 'critical',
        summary: '摘要...',
        impact: '影響分析...',
        affects: ['be'],
        relatedPaths: ['e', 'b'],
        tags: ['通膨']
      }
    ]
  })
});
```

### TypeScript 客戶端

項目已提供 TypeScript API 客戶端：

```typescript
import { apiClient } from './src/api/client';

// 獲取路徑數據
const paths = await apiClient.getPaths('US');

// 獲取新聞（帶篩選）
const news = await apiClient.getNews({
  market: 'US',
  limit: 10,
  severity: 'critical'
});

// 更新路徑數據
const result = await apiClient.updatePaths({
  nodes: { b: { id: 'b', prob: 33 } }
});
```

---

## 環境變量配置

在 `.env` 文件中配置：

```env
# API 配置
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_API_KEY=your_api_key_here
VITE_USE_MOCK_API=false  # true=使用 JSON 文件過渡
```

---

## 過渡期方案

在 API 尚未就緒時，可使用靜態 JSON 文件過渡：

```typescript
// 自動從 /data/latest.json 讀取
import { apiClient } from './src/api/client';

// 設置使用 Mock 模式
apiClient.setUseMock(true);

// 調用方式相同
const data = await apiClient.getMockData();
```

---

## 更新日期

- 2026-04-13: 初始版本（v1.0.0）
- API 設計：RESTful
- 認證：API Key + 速率限制
