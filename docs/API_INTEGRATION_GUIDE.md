# Investment Path Tracker - API 集成指南

## 📋 目錄

- [快速開始](#快速開始)
- [API Key 申請](#api-key-申請)
- [工具準備](#工具準備)
- [使用場景](#使用場景)
- [常見問題](#常見問題)

---

## 快速開始

### 1. 獲取 API Key

聯繫項目管理員獲取 API Key，格式如下：
```
X-API-Key: sk_live_xxxxxxxxxxxxxxxxxxxx
```

### 2. 測試連接

使用 curl 測試 API 連接：

```bash
# 測試讀取 API（無需認證）
curl https://your-domain.com/api/v1/paths

# 測試寫入 API（需要 API Key）
curl -X POST https://your-domain.com/api/v1/admin/paths \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"nodes": {}}'
```

### 3. 開始更新數據

參考下方的使用場景示例進行數據更新。

---

## API Key 申請

### 申請流程

1. 發送郵件至：`admin@investmentpath.com`
2. 郵件內容：
   - 申請人姓名
   - 所屬團隊
   - 使用目的
   - 預計更新頻率
3. 獲取 API Key（1-2 個工作日）

### API Key 保管

- ⚠️ **不要**將 API Key 上傳到 GitHub
- ⚠️ **不要**在前端代碼中硬編碼 API Key
- ✅ 使用環境變量存儲 API Key
- ✅ 定期輪換 API Key（建議每 90 天）

---

## 工具準備

### Postman（推薦）

1. 下載安裝：[Postman](https://www.postman.com/downloads/)
2. 導入集合：掃描下方二維碼或下載 JSON 文件
3. 設置環境變量：
   - `base_url`: `https://your-domain.com/api/v1`
   - `api_key`: `your_api_key`

**Postman 集合下載**：
```json
{
  "info": {
    "name": "Investment Path Tracker API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Read APIs",
      "item": [
        {
          "name": "Get Paths",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/paths"
          }
        },
        {
          "name": "Get News",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/news"
          }
        }
      ]
    },
    {
      "name": "Write APIs",
      "item": [
        {
          "name": "Update Paths",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{api_key}}"
              }
            ],
            "url": "{{base_url}}/admin/paths"
          }
        }
      ]
    }
  ]
}
```

### cURL（命令行）

適合自動化腳本：

```bash
#!/bin/bash

API_KEY="your_api_key"
BASE_URL="https://your-domain.com/api/v1"

# 獲取路徑數據
curl -s "$BASE_URL/paths" | jq .

# 更新新聞
curl -X POST "$BASE_URL/admin/news" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @news_update.json
```

### Python 腳本

```python
import requests
import json

API_KEY = "your_api_key"
BASE_URL = "https://your-domain.com/api/v1"

# 獲取路徑數據
response = requests.get(f"{BASE_URL}/paths")
data = response.json()
print(data)

# 更新新聞
news_data = {
    "news": [
        {
            "id": "news-014",
            "market": "US",
            "date": "2026-04-13",
            "title": "新新聞標題",
            "source": "來源",
            "severity": "critical",
            "summary": "摘要...",
            "impact": "影響分析...",
            "affects": ["be"],
            "relatedPaths": ["e", "b"],
            "tags": ["通膨", "CPI"]
        }
    ]
}

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

response = requests.post(
    f"{BASE_URL}/admin/news",
    headers=headers,
    json=news_data
)

print(response.json())
```

---

## 使用場景

### 場景 1：每日數據更新

**頻率**：每個交易日更新

**內容**：
- 更新路徑概率（nodes.prob）
- 更新宏觀指標（macros）
- 添加最新新聞（news）

**示例**：
```python
# 更新路徑概率
paths_update = {
    "nodes": {
        "b": {"prob": 33},
        "e": {"prob": 34}
    },
    "alert": {
        "active": True,
        "message": "最新警報信息"
    }
}

requests.post(
    f"{BASE_URL}/admin/paths",
    headers=headers,
    json=paths_update
)
```

---

### 場景 2：突發新聞更新

**頻率**：即時

**內容**：
- 添加突發新聞到 news 數組頂部
- 更新 alert 字段

**示例**：
```python
# 獲取當前新聞
response = requests.get(f"{BASE_URL}/news")
current_news = response.json()["data"]["news"]

# 添加新新聞
breaking_news = {
    "id": f"news-{len(current_news) + 1:03d}",
    "market": "US",
    "date": "2026-04-13",
    "title": "突發：Fed 緊急降息 50bps",
    "source": "Fed",
    "severity": "critical",
    "summary": "Fed 宣布緊急降息 50bps 至 3.00-3.25% 區間",
    "impact": "歷史上緊急降息通常引發市場恐慌，路徑 C 概率可能上升",
    "affects": ["bc", "ba"],
    "relatedPaths": ["c", "b"],
    "tags": ["Fed", "降息", "突發"]
}

# 更新新聞列表
requests.post(
    f"{BASE_URL}/admin/news",
    headers=headers,
    json={"news": [breaking_news] + current_news}
)
```

---

### 場景 3：港股數據上線

**準備工作**：
1. 準備港股路徑數據（nodes）
2. 準備港股新聞（news，market="HK"）
3. 測試港股篩選功能

**示例**：
```python
hk_paths = {
    "nodes": {
        "a": {
            "id": "a",
            "market": "HK",
            "name": "A 南向通",
            "sub": "內地資金流入",
            "color": "#4ade80",
            "x": 400,
            "y": 55,
            "prob": 30,
            "current": True,
            "alloc": [
                {"n": "科網股板塊", "tier": "overweight"},
                {"n": "內房股板塊", "tier": "neutral"}
            ]
        }
    }
}

requests.post(
    f"{BASE_URL}/admin/paths",
    headers=headers,
    json=hk_paths
)
```

---

### 場景 4：批量歷史新聞導入

**使用场景**：系統上線時導入歷史新聞

**示例**：
```python
import json

# 從 CSV 導入
import pandas as pd

df = pd.read_csv('historical_news.csv')

news_list = []
for _, row in df.iterrows():
    news_list.append({
        "id": f"news-{row['id']:03d}",
        "market": "US",
        "date": row['date'],
        "title": row['title'],
        "source": row['source'],
        "severity": row['severity'],
        "summary": row['summary'],
        "impact": row['impact'],
        "affects": json.loads(row['affects']),
        "relatedPaths": json.loads(row['relatedPaths']),
        "tags": json.loads(row['tags'])
    })

requests.post(
    f"{BASE_URL}/admin/news",
    headers=headers,
    json={"news": news_list}
)
```

---

## 常見問題

### Q1: API Key 無效怎麼辦？

**A**: 
1. 檢查 API Key 是否正確複製（無前後空格）
2. 確認 Header 名稱為 `X-API-Key`（區分大小寫）
3. 聯繫管理員確認 API Key 是否過期

---

### Q2: 遇到速率限制怎麼辦？

**A**:
- 匿名用戶：每小時 100 請求，建議申請 API Key（1000 請求/小時）
- 如需更高限額，聯繫管理員申請企業版

---

### Q3: 數據格式錯誤怎麼辦？

**A**:
1. 檢查 JSON 格式是否正確
2. 確認必填字段是否齊全
3. 查看錯誤響應中的詳細信息

---

### Q4: 如何回滾錯誤的數據更新？

**A**:
1. 從 Git 歷史恢復 `public/data/latest.json`
2. 使用 API 重新推送正確數據
3. 建議在測試環境先驗證

---

### Q5: 本地開發如何測試？

**A**:
```bash
# 使用 Mock 模式
export VITE_USE_MOCK_API=true
npm run dev

# 本地數據文件：public/data/latest.json
# 修改後刷新頁面即可看到效果
```

---

## 支持聯繫

- 📧 技術支持：`support@investmentpath.com`
- 📚 文檔：`https://investmentpath.com/docs`
- 💬 Discord: `https://discord.gg/investmentpath`

---

## 更新日誌

- 2026-04-13: 初始版本
  - API v1 上線
  - 支持美股數據
  - 速率限制功能

- 即將上線:
  - 港股數據支持
  - WebSocket 實時推送
  - Webhook 回調功能
