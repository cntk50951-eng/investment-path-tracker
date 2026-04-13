# API 寫入限制說明與解決方案

## ⚠️ 問題說明

**現狀**：讀取 API（GET）正常工作，但寫入 API（POST）無法在 Vercel 上運行。

**原因**：Vercel Serverless Functions 是**無狀態**的，函數執行完畢後所有文件修改都會丟失，無法持久化寫入 `public/data/latest.json`。

---

## ✅ 解決方案

### 方案一：Git 工作流（推薦，立即可用）

這是目前最簡單可靠的方案：

#### 工作流程
1. 團隊編輯 `public/data/latest.json`
2. Git Commit
3. Git Push 到 GitHub
4. Vercel 自動部署（約 30-60 秒）

#### 優點
- ✅ 簡單可靠
- ✅ 有版本控制（Git 歷史）
- ✅ 可回滾
- ✅ 無需額外服務

#### 缺點
- ❌ 需要 1-2 分鐘部署時間
- ❌ 無法實時更新

#### 使用示例

```bash
# 1. 克隆倉庫
git clone https://github.com/cntk50951-eng/investment-path-tracker.git
cd investment-path-tracker

# 2. 編輯數據文件
vi public/data/latest.json

# 3. 提交並推送
git add public/data/latest.json
git commit -m "update: 更新新聞數據 - 2026-04-13"
git push origin main

# 4. 等待 Vercel 自動部署
```

#### 自動化腳本

```python
#!/usr/bin/env python3
# update_via_git.py
import json
import subprocess
from datetime import datetime

def update_news_via_git(news_list):
    """通過 Git 工作流更新新聞"""
    
    # 讀取當前數據
    with open('public/data/latest.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 更新新聞
    data['news'] = news_list
    data['meta']['lastUpdated'] = datetime.now().isoformat()
    
    # 寫入文件
    with open('public/data/latest.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Git 提交
    subprocess.run(['git', 'add', 'public/data/latest.json'])
    subprocess.run(['git', 'commit', '-m', f'update: 更新新聞數據 - {datetime.now().strftime("%Y-%m-%d")}'])
    subprocess.run(['git', 'push', 'origin', 'main'])
    
    print("✅ 數據已提交，等待 Vercel 自動部署...")

# 使用示例
if __name__ == '__main__':
    news = [
        {
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
        }
    ]
    update_news_via_git(news)
```

---

### 方案二：GitHub API（自動化推薦）

通過 GitHub API 自動創建 Pull Request：

```python
from github import Github
import json

# 配置
GITHUB_TOKEN = "your_github_token"
REPO_NAME = "cntk50951-eng/investment-path-tracker"

def update_via_github_api(news_list):
    """通過 GitHub API 更新數據"""
    
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)
    
    # 獲取文件
    file_path = "public/data/latest.json"
    file_content = repo.get_contents(file_path)
    
    # 更新內容
    data = json.loads(file_content.decoded_content.decode())
    data['news'] = news_list
    
    # 提交
    repo.update_file(
        file_path,
        f"update: 更新新聞數據 - {datetime.now().strftime('%Y-%m-%d')}",
        json.dumps(data, indent=2, ensure_ascii=False),
        file_content.sha
    )
    
    print("✅ 數據已更新，等待 Vercel 自動部署...")
```

**需要的權限**：
- 創建 GitHub Personal Access Token
- 權限：`repo` (Full control of private repositories)

---

### 方案三：Vercel KV + 外部存儲（高級，需額外成本）

使用 Vercel KV（Redis）存儲數據：

**成本**：$10/月起（Vercel Pro + Vercel KV）

**實施步驟**：
1. 升級 Vercel 到 Pro Plan
2. 創建 Vercel KV 數據庫
3. 修改 API 讀取 KV 而非文件
4. 寫入 API 寫入 KV

**優點**：
- ✅ 實時更新
- ✅ 無需部署

**缺點**：
- ❌ 需要額外成本
- ❌ 需要重構代碼

---

## 🎯 推薦方案

### 當前階段（過渡期）
**使用方案一：Git 工作流**
- 成本低
- 可靠性高
- 有版本控制

### 未來擴展（如果需要實時更新）
**使用方案三：Vercel KV**
- 需要升級到 Pro Plan
- 需要重構 API

---

## 📋 Git 工作流快速指南

### 投研團隊操作步驟

1. **克隆倉庫**
   ```bash
   git clone https://github.com/cntk50951-eng/investment-path-tracker.git
   cd investment-path-tracker
   ```

2. **準備更新數據**
   - 編輯 `public/data/latest.json`
   - 或使用工具腳本

3. **提交更新**
   ```bash
   git add public/data/latest.json
   git commit -m "update: 更新新聞 - 2026-04-13"
   git push origin main
   ```

4. **等待部署**
   - 訪問：https://vercel.com/investment-path-tracker/deployments
   - 約 30-60 秒完成

5. **驗證更新**
   ```bash
   curl https://investment-path-tracker.vercel.app/api/v1/news?limit=5
   ```

---

## 🛠️ 實用工具

### 工具 1：Python 更新腳本

已在 `tools/update_via_git.py` 提供

### 工具 2：數據驗證腳本

```python
# tools/validate_data.py
import json

def validate_news(news_list):
    """驗證新聞數據格式"""
    required_fields = ['id', 'market', 'date', 'title', 'source', 
                      'severity', 'summary', 'impact', 'affects', 
                      'relatedPaths', 'tags']
    
    errors = []
    for i, news in enumerate(news_list):
        for field in required_fields:
            if field not in news:
                errors.append(f"新聞 {i}: 缺少必填字段 {field}")
    
    return errors
```

---

## 📞 常見問題

### Q: 為什麼不能直接寫入文件？

**A**: Vercel Serverless Functions 運行在無狀態容器中，每次請求可能在不同的容器執行，文件修改無法持久化。

### Q: Git 工作流是否安全？

**A**: 是的，倉庫是私有的，只有團隊成員可以推送。所有更改都有 Git 歷史記錄，可追溯、可回滾。

### Q: 能否自動部署？

**A**: 是的，Git Push 後 Vercel 會自動檢測並部署，無需手動操作。

### Q: 部署需要多久？

**A**: 通常 30-60 秒，取決於項目大小。

---

## ✅ 立即行動

**當前最佳實踐**：

1. **讀取 API**：正常使用（GET 請求）
   ```bash
   curl https://investment-path-tracker.vercel.app/api/v1/paths
   ```

2. **寫入數據**：使用 Git 工作流
   ```bash
   # 編輯文件 → Git Commit → Git Push
   ```

3. **驗證更新**：使用讀取 API
   ```bash
   curl https://investment-path-tracker.vercel.app/api/v1/news
   ```

---

**如有疑問，請查看 `tools/` 目錄中的實用工具！** 🚀
