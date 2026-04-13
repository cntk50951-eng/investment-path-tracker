# 投研團隊 - 數據庫更新指南

## 📋 快速開始

**重要**：所有數據現在存儲在 PostgreSQL 數據庫中，支持**實時更新**（<1 秒）

**數據庫**：Neon PostgreSQL (Vercel Postgres)  
**更新方式**：通過 API 實時寫入數據庫

---

## 🔑 認證信息

### API Key
```
f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

### API Endpoint
```
https://investment-path-tracker.vercel.app/api/v1
```

### 數據庫連接（僅管理員）
```
POSTGRES_URL=postgresql://neondb_owner:npg_rKid9vaZs2jl@ep-calm-poetry-a1jj4oil-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

---

## 📝 更新操作

### 操作 1：更新路徑概率

**使用場景**：調整 5 條路徑（A/B/C/D/E）的概率

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/paths \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "nodes": {
        "b": {"prob": 33},
        "e": {"prob": 34},
        "a": {"prob": 13},
        "c": {"prob": 10},
        "d": {"prob": 10}
      }
    }
  }'
```

**響應**：
```json
{
  "success": true,
  "message": "路徑數據更新成功（實時寫入數據庫）",
  "data": {
    "lastUpdated": "2026-04-13T...",
    "source": "PostgreSQL"
  }
}
```

---

### 操作 2：更新單條路徑的板塊配置

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/paths \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "nodes": {
        "b": {
          "prob": 35,
          "alloc": [
            {"n": "公用事業板塊", "tier": "overweight"},
            {"n": "必需消費板塊", "tier": "overweight"},
            {"n": "精選 AI 龍頭", "tier": "neutral"}
          ]
        }
      }
    }
  }'
```

---

### 操作 3：添加/更新新聞

**使用場景**：添加最新市場新聞

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/news \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{
    "news": [
      {
        "id": "news-014",
        "market": "US",
        "date": "2026-04-13",
        "title": "3 月 CPI 同比 3.3%，近兩年最高",
        "source": "BLS",
        "severity": "critical",
        "summary": "CPI 330.293，環比 +0.87%，同比 3.3% 為 2024 年 4 月以來最高",
        "impact": "CPI 環比 +0.87% 遠超正常水平，為路徑 E 最核心觸發條件的第 1/3 月確認",
        "affects": ["be"],
        "relatedPaths": ["e", "b"],
        "tags": ["CPI", "通膨", "宏觀數據"]
      }
    ]
  }'
```

**響應**：
```json
{
  "success": true,
  "message": "新聞數據更新成功（實時寫入數據庫）",
  "data": {
    "count": 1,
    "lastUpdated": "2026-04-13T...",
    "source": "PostgreSQL"
  }
}
```

---

### 操作 4：添加突發新聞

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/news \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{
    "news": [
      {
        "id": "breaking-20260413143000",
        "market": "US",
        "date": "2026-04-13",
        "title": "🔴 突發：Fed 緊急降息 50bps",
        "source": "Fed",
        "severity": "critical",
        "summary": "Fed 宣布緊急降息 50bps 至 3.00-3.25% 區間",
        "impact": "歷史上緊急降息通常引發市場恐慌，路徑 C 概率可能上升",
        "affects": ["bc", "ba"],
        "relatedPaths": ["c", "b"],
        "tags": ["突發", "Fed", "降息"]
      }
    ]
  }'
```

---

### 操作 5：更新警報

```bash
curl -X POST https://investment-path-tracker.vercel.app/api/v1/admin/paths \
  -H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "alert": {
        "active": true,
        "level": "critical",
        "title": "人猿警報",
        "message": "路徑 E 概率升至 32%，B→E 切換進度 38%",
        "action": "當前觀察重點：4 月 15 日 CPI 數據為關鍵驗證節點"
      }
    }
  }'
```

---

## 📊 數據格式規範

### 路徑概率格式

```json
{
  "nodes": {
    "a": {"prob": 13},  // A 金髮女孩
    "b": {"prob": 35},  // B 滯脹迷霧（當前）
    "c": {"prob": 10},  // C 硬著陸
    "d": {"prob": 10},  // D 黑天鵝
    "e": {"prob": 32}   // E 再通膨
  }
}
```

**注意**：概率總和應為 100%

---

### 新聞格式

| 字段 | 類型 | 必填 | 說明 | 示例 |
|------|------|------|------|------|
| id | string | ✅ | 唯一標識 | `news-014` |
| market | string | ✅ | 市場 | `US` 或 `HK` |
| date | string | ✅ | 日期 | `2026-04-13` |
| title | string | ✅ | 標題（≤40 字） | `3 月 CPI 同比 3.3%` |
| source | string | ✅ | 來源 | `BLS` |
| severity | string | ✅ | 嚴重性 | `critical`/`medium`/`positive` |
| summary | string | ✅ | 摘要（≤100 字） | `CPI 330.293，環比 +0.87%` |
| impact | string | ✅ | 影響分析（≤200 字） | `CPI 環比 +0.87% 遠超正常...` |
| affects | array | ✅ | 影響的切換 | `["be"]` |
| relatedPaths | array | ✅ | 關聯路徑 | `["e", "b"]` |
| tags | array | ✅ | 標籤 | `["CPI", "通膨"]` |
| url | string | ❌ | 原文鏈接 | `https://...` |

---

### 嚴重性等級

- `critical` 🔴：關鍵事件（重大數據、突發事件）
- `medium` 🟡：中等影響（重要但非緊急）
- `positive` 🟢：正面消息（利好市場）

---

## 🛠️ Python 更新工具

```python
#!/usr/bin/env python3
# update_via_db.py

import requests
import json

API_KEY = "f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL = "https://investment-path-tracker.vercel.app/api/v1"

def update_paths(nodes):
    """更新路徑概率"""
    response = requests.post(
        f"{BASE_URL}/admin/paths",
        headers={"X-API-Key": API_KEY},
        json={"data": {"nodes": nodes}}
    )
    return response.json()

def update_news(news_list):
    """更新新聞"""
    response = requests.post(
        f"{BASE_URL}/admin/news",
        headers={"X-API-Key": API_KEY},
        json={"news": news_list}
    )
    return response.json()

# 使用示例
if __name__ == "__main__":
    # 更新路徑
    result = update_paths({
        "b": {"prob": 33},
        "e": {"prob": 34}
    })
    print(result)
    
    # 更新新聞
    result = update_news([{
        "id": "news-014",
        "market": "US",
        "date": "2026-04-13",
        "title": "新新聞",
        "source": "來源",
        "severity": "critical",
        "summary": "摘要",
        "impact": "影響分析",
        "affects": ["be"],
        "relatedPaths": ["e", "b"],
        "tags": ["通膨"]
    }])
    print(result)
```

---

## 🧪 驗證更新

### 方法 1：測試 API

```bash
# 查看路徑概率
curl https://investment-path-tracker.vercel.app/api/v1/paths

# 查看新聞列表
curl https://investment-path-tracker.vercel.app/api/v1/news?limit=5
```

### 方法 2：訪問網頁

- 主頁：https://investment-path-tracker.vercel.app/
- 新聞時間線：https://investment-path-tracker.vercel.app/news

---

## ⚠️ 常見錯誤

### 錯誤 1：401 Unauthorized

**原因**：API Key 錯誤或缺失

**解決**：
```bash
# 確保 Header 正確
-H "X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
```

---

### 錯誤 2：400 Invalid Data

**原因**：數據格式錯誤

**解決**：檢查 JSON 格式，確保必填字段完整

---

### 錯誤 3：500 Internal Error

**原因**：數據庫連接問題

**解決**：等待 1-2 分鐘後重試，或聯繫管理員

---

## 📞 技術支持

- 📧 技術支持：`support@investmentpath.com`
- 📚 完整文檔：`docs/` 目錄
- 🔗 GitHub: https://github.com/cntk50951-eng/investment-path-tracker

---

**所有數據現在存儲在 PostgreSQL 數據庫中，支持實時更新！** 🚀
