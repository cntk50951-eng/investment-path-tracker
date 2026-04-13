# 投研團隊 - 數據更新 API 使用指南

## 📋 快速開始

**API Endpoint**: `https://investment-path-tracker.vercel.app/api/v1`  
**API Key**: `f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720`

---

## 🔑 認證方式

所有寫入 API 請求必須在 Header 中包含 API Key：

```
X-API-Key: f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720
```

---

## 📝 更新數據流程

### 方法一：使用 cURL（推薦）

#### 1. 更新路徑數據

```bash
#!/bin/bash

API_KEY="f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL="https://investment-path-tracker.vercel.app/api/v1"

# 準備更新數據
cat > paths_update.json << EOF
{
  "nodes": {
    "b": {
      "id": "b",
      "prob": 33
    },
    "e": {
      "id": "e",
      "prob": 34
    }
  },
  "alert": {
    "active": true,
    "level": "warning",
    "message": "最新警報：CPI 數據超預期"
  },
  "version": "3.0.1"
}
EOF

# 發送請求
curl -X POST "$BASE_URL/admin/paths" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @paths_update.json
```

**預期響應**：
```json
{
  "success": true,
  "message": "路徑數據更新成功",
  "data": {
    "lastUpdated": "2026-04-13T10:18:00Z",
    "version": "3.0.1"
  }
}
```

---

#### 2. 更新新聞數據

```bash
#!/bin/bash

API_KEY="f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL="https://investment-path-tracker.vercel.app/api/v1"

# 準備新聞數據
cat > news_update.json << EOF
{
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
      "tags": ["CPI", "通膨", "宏觀數據"],
      "url": "https://www.bls.gov/..."
    }
  ]
}
EOF

# 發送請求
curl -X POST "$BASE_URL/admin/news" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @news_update.json
```

---

### 方法二：使用 Python 腳本（推薦批量更新）

```python
#!/usr/bin/env python3
# update_data.py

import requests
import json
from datetime import datetime

API_KEY = "f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL = "https://investment-path-tracker.vercel.app/api/v1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def update_paths(nodes=None, alert=None, version=None):
    """更新路徑數據"""
    
    data = {}
    if nodes:
        data["nodes"] = nodes
    if alert:
        data["alert"] = alert
    if version:
        data["version"] = version
    
    response = requests.post(
        f"{BASE_URL}/admin/paths",
        headers=headers,
        json=data
    )
    
    result = response.json()
    if result.get("success"):
        print(f"✅ 路徑數據更新成功：{result['data']}")
    else:
        print(f"❌ 更新失敗：{result['error']}")
    
    return result

def update_news(news_list):
    """更新新聞數據"""
    
    response = requests.post(
        f"{BASE_URL}/admin/news",
        headers=headers,
        json={"news": news_list}
    )
    
    result = response.json()
    if result.get("success"):
        print(f"✅ 新聞數據更新成功：{result['data']}")
    else:
        print(f"❌ 更新失敗：{result['error']}")
    
    return result

# ============ 使用示例 ============

if __name__ == "__main__":
    # 示例 1: 更新路徑概率
    update_paths(
        nodes={
            "b": {"prob": 33},
            "e": {"prob": 34}
        },
        version="3.0.1"
    )
    
    # 示例 2: 添加新聞
    new_news = [
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
    update_news(new_news)
```

**使用方式**：
```bash
python update_data.py
```

---

### 方法三：使用 Postman（可選）

#### 1. 導入集合

下載 Postman 集合文件（已在 `tools/` 目錄）：
```bash
# 或使用以下 JSON
```

#### 2. 設置環境變量

在 Postman 中設置：
- `base_url`: `https://investment-path-tracker.vercel.app/api/v1`
- `api_key`: `f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720`

#### 3. 發送請求

選擇對應的 Endpoint，點擊 Send。

---

## 📚 數據格式參考

### 路徑數據格式

```json
{
  "nodes": {
    "a": {
      "id": "a",
      "name": "A 金髮女孩",
      "sub": "軟著陸+AI 加速",
      "color": "#4ade80",
      "x": 400,
      "y": 55,
      "prob": 13,
      "current": false,
      "alloc": [
        {"n": "AI 半導體板塊", "tier": "overweight"},
        {"n": "雲計算/數位廣告板塊", "tier": "overweight"}
      ]
    }
  },
  "alert": {
    "active": true,
    "level": "warning",
    "title": "人猿警報",
    "message": "警報內容",
    "action": "建議行動"
  },
  "version": "3.0.1"
}
```

### 新聞數據格式

```json
{
  "news": [
    {
      "id": "news-014",
      "market": "US",
      "date": "2026-04-13",
      "title": "標題（≤40 字）",
      "source": "來源",
      "severity": "critical",
      "summary": "摘要（≤100 字）",
      "impact": "影響分析（≤200 字）",
      "affects": ["be"],
      "relatedPaths": ["e", "b"],
      "tags": ["通膨", "CPI"],
      "url": "https://..."
    }
  ]
}
```

---

## 🔧 常用場景示例

### 場景 1：每日盤後更新

```python
# daily_update.py

from datetime import datetime

# 更新路徑概率
update_paths(
    nodes={
        "b": {"prob": 35},
        "e": {"prob": 32},
        "a": {"prob": 13},
        "c": {"prob": 10},
        "d": {"prob": 10}
    }
)

# 添加盤後新聞
update_news([
    {
        "id": f"news-{datetime.now().strftime('%Y%m%d')}",
        "market": "US",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": "盤後快評",
        "source": "人猿團隊",
        "severity": "medium",
        "summary": "今日盤後點評...",
        "affects": ["be"],
        "relatedPaths": ["b", "e"],
        "tags": ["盤後", "點評"]
    }
])
```

---

### 場景 2：突發新聞更新

```python
# breaking_news.py

def add_breaking_news(title, summary, impact, severity="critical"):
    """添加突發新聞"""
    
    breaking = {
        "id": f"breaking-{int(datetime.now().timestamp())}",
        "market": "US",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": f"🔴 突發：{title}",
        "source": "快訊",
        "severity": severity,
        "summary": summary,
        "impact": impact,
        "affects": ["be", "bd"],
        "relatedPaths": ["b", "e", "d"],
        "tags": ["突發", "快訊"]
    }
    
    return update_news([breaking])

# 使用示例
add_breaking_news(
    title="Fed 緊急降息 50bps",
    summary="Fed 宣布緊急降息 50bps 至 3.00-3.25% 區間",
    impact="歷史上緊急降息通常引發市場恐慌，路徑 C 概率可能上升"
)
```

---

### 場景 3：批量導入歷史新聞

```python
# batch_import.py

import pandas as pd

# 從 CSV 導入
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
        "affects": eval(row['affects']),
        "relatedPaths": eval(row['relatedPaths']),
        "tags": eval(row['tags'])
    })

update_news(news_list)
```

---

## ⚠️ 注意事項

### 1. 數據驗證

所有數據會經過以下驗證：
- ✅ JSON 格式正確
- ✅ 必填字段完整
- ✅ 字段類型正確
- ✅ 數值在合理範圍

### 2. 速率限制

- **寫入 API**: 1000 請求/小時
- **讀取 API**: 100 請求/小時

### 3. 錯誤處理

常見錯誤碼：
- `200`: 成功
- `400`: 數據格式錯誤
- `401`: API Key 無效
- `429`: 超過速率限制
- `500`: 服務器錯誤

### 4. 最佳實踐

- ✅ 使用版本號（語義化版本）
- ✅ 記錄每次更新的日誌
- ✅ 批量更新時先測試小數據集
- ✅ 定期備份數據

---

## 🧪 測試腳本

```bash
#!/bin/bash
# test_api.sh

API_KEY="f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL="https://investment-path-tracker.vercel.app/api/v1"

echo "🧪 測試 API 連接..."

# 測試讀取 API
echo -e "\n1. 測試讀取路徑數據..."
curl -s "$BASE_URL/paths" | jq '.success'

# 測試寫入 API
echo -e "\n2. 測試寫入 API..."
curl -s -X POST "$BASE_URL/admin/paths" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"nodes": {}}' | jq '.success'

echo -e "\n✅ 測試完成！"
```

---

## 📞 技術支持

- 📧 技術支持郵箱：`support@investmentpath.com`
- 📚 API 文檔：`docs/API_DOCUMENTATION.md`
- 💬 問題反饋：GitHub Issues

---

**祝使用愉快！** 🚀
