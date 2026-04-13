# 🔐 安全指南 - 防止 Credential 洩露

## ⚠️ GitGuardian 警告處理

如果您收到 GitGuardian 警告，請立即執行以下步驟：

### 1. 立即行動

1. **不要驚慌** - 已實施修復
2. **檢查 Git 歷史** - 確認洩露的文件
3. **移除敏感信息** - 從文檔和代碼中刪除
4. **考慮輪換密碼** - 如果已公開暴露

---

## 🚫 絕對不要提交的文件

### 包含敏感信息的文件

```bash
# 環境變量文件
.env
.env.local
.env.*.local
*.env

# 包含密碼的配置文件
config/secrets.json
credentials.json
```

### .gitignore 規則

確保以下內容在 `.gitignore` 中：

```gitignore
# 環境變量
.env
.env.local
.env.*.local
*.local

# 敏感配置
*.pem
*.key
credentials.json
```

---

## ✅ 安全的 Credential 管理

### 方法 1：Vercel 環境變量（推薦）

1. 在 Vercel Dashboard 配置
2. 不在代碼中硬編碼
3. 不在文檔中寫真實值

**示例**：
```markdown
❌ 錯誤：
POSTGRES_URL=postgresql://user:realpassword123@host/db

✅ 正確：
POSTGRES_URL=postgresql://user:[YOUR_PASSWORD]@host/db
（在 Vercel Dashboard 配置真實值）
```

### 方法 2：使用佔位符

在文檔中使用：
```
POSTGRES_URL=postgresql://username:[YOUR_PASSWORD]@host/database
```

**說明**：
- `[YOUR_PASSWORD]` 是佔位符
- 真實密碼在 Vercel 配置
- 不提交到 Git

---

## 🔑 API Key 管理

### 可以公開的 Key

- ✅ 前端 API Key（如 Firebase）
- ✅ 只讀 API Key
- ✅ 已限制權限的 Key

### 不能公開的 Key

- ❌ 數據庫密碼
- ❌ 寫入 API Key
- ❌ 管理員 Key
- ❌ 服務帳號 Key

---

## 📋 當前項目 Credential 狀態

### 已安全配置

| Credential | 類型 | 存儲位置 | 狀態 |
|-----------|------|---------|------|
| Firebase Config | 公開 | .env.example | ✅ 安全 |
| API_KEY (f1d7...) | 寫入 | Vercel Env | ✅ 安全 |
| POSTGRES_URL | 敏感 | Vercel Env | ✅ 安全 |

### 需要保護的

- ⚠️ **POSTGRES_URL 密碼部分**
  - 不在代碼中硬編碼
  - 不在文檔中寫真實值
  - 僅在 Vercel Dashboard 配置

---

## 🛠️ 最佳實踐

### 1. 環境變量

```bash
# 本地開發
cp .env.example .env.local
# 編輯 .env.local（不會提交到 Git）
# 填入真實值

# 生產環境
# 在 Vercel Dashboard 配置
# Settings → Environment Variables
```

### 2. 文檔撰寫

```markdown
❌ 錯誤：寫真實密碼
POSTGRES_URL=postgresql://user:secret123@host/db

✅ 正確：使用佔位符
POSTGRES_URL=postgresql://user:[YOUR_PASSWORD]@host/db
說明：在 Vercel Dashboard 配置
```

### 3. 代碼審查

提交前檢查：
```bash
# 搜索可能的 credential
git diff | grep -i "password\|secret\|key\|token"

# 檢查是否有 .env 文件
git status | grep ".env"
```

---

## 🚨 如果 Credential 洩露

### 立即執行

1. **確認洩露範圍**
   - 哪個文件？
   - 什麼類型的 credential？
   - 是否已推送到遠程？

2. **移除敏感信息**
   - 從代碼中刪除
   - 從文檔中刪除
   - 提交修復

3. **輪換 Credential**（如果必要）
   - 更改數據庫密碼
   - 重新生成 API Key
   - 更新 Vercel 環境變量

4. **通知團隊**
   - 告知洩露情況
   - 提供新 credential
   - 更新文檔

---

## 📞 緊急聯繫

如果遇到 credential 洩露問題：

1. 查看本指南
2. 立即移除敏感信息
3. 考慮輪換 credential
4. 通知項目管理員

---

**安全第一！保護好您的 credential！** 🔒

