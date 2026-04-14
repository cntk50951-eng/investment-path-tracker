# Google Stitch MCP 配置指南

## 概述

已為 opencode AI agent 配置 Google Stitch MCP 服務器，用於 UI/UX 設計生成和前端代碼導出。

## 配置位置

- **MCP 配置文件**: `~/.opencode/mcp.json`
- **API Key**: 需設置 `STITCH_API_KEY` 環境變量（**不要提交到 Git**）

## 設置步驟

### 1. 設置環境變量

在 `.env` 或 `.env.local` 中設置：

```bash
STITCH_API_KEY=your-api-key-here
```

或通過終端：

```bash
export STITCH_API_KEY="your-api-key-here"
```

### 2. 安裝依賴

```bash
cd /Users/yuki/Desktop/jupyter/investmentpath
npm install --save-dev stitch-mcp @booplex/stitch-kit
```

### 3. 驗證配置

```bash
./node_modules/.bin/stitch-mcp doctor
```

## 可用的 Stitch 工具

### 核心設計工具
- `stitch_generate` - 從文本提示生成 UI 設計
- `stitch_edit` - 編輯現有設計
- `stitch_export` - 導出設計為 React/Vue/Next.js 代碼
- `stitch_preview` - 預覽設計效果

### 設計分析工具
- `stitch_analyze` - 分析設計模式和可用性
- `stitch_suggest` - 獲取設計改進建議

### 工作流工具
- `stitch_list` - 列出所有設計項目
- `stitch_delete` - 刪除設計
- `stitch_duplicate` - 複製設計進行迭代

## 使用示例

### 生成新的 UI 設計

```
請使用 Stitch 生成一個投資路徑追蹤儀表板的設計，要求：
- 深色主題
- 包含宏觀指標欄、路徑流程圖、新聞面板
- 現代化的金融科技風格
```

### 編輯現有設計

```
使用 Stitch 編輯當前設計，將主色調從藍色改為紫色漸變
```

### 導出代碼

```
使用 Stitch 將設計導出為 React + Tailwind CSS 代碼
```

## MCP 配置

opencode 的 MCP 配置位於 `~/.opencode/mcp.json`：

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      },
      "transportType": "stdio"
    }
  }
}
```

## 故障排除

### 認證失敗

```bash
# 檢查 API key 是否正確設置
echo $STITCH_API_KEY

# 重新運行診斷
./node_modules/.bin/stitch-mcp doctor --verbose
```

### 設計生成失敗

檢查：
1. Google Cloud 項目已啟用 Stitch API
2. 配額和限額未超出
3. 提示詞描述足夠清晰

## 相關資源

- [Stitch 官方文檔](https://stitch.withgoogle.com/)
- [stitch-mcp GitHub](https://github.com/nicepkg/stitch-mcp)
- [stitch-kit 文檔](https://github.com/booplex/stitch-kit)

## 投資路徑項目設計需求

### 當前狀態
- 深色主題（`#080c18` 背景）
- 5 條路徑流程圖（A/B/C/D/E 或 HK-A 至 HK-E）
- 概率條顯示
- 新聞事件流面板
- 宏觀指標欄
- 切換進度表
- 合規提示組件（SFC 監管要求）
- Free/Pro 用戶權限控制

### 下一階段設計目標
1. 優化路徑切換的視覺反饋
2. 改進 Free/Pro 用戶的視覺區分
3. 增強移动端適配
4. 添加數據可視化改進（概率變化趨勢圖）
5. 優化新聞時間線展示

使用 Stitch 時可以參考這些設計方向。

---

## ⚠️ 安全提示

**不要將 API Key 提交到 Git！**

API Key 已配置在 `~/.opencode/mcp.json` 並引用環境變量 `${STITCH_API_KEY}`。

確保：
- `.env` 和 `.env.local` 已加入 `.gitignore`
- 不在提交中包含 `STITCH_API_KEY=xxx` 的硬編碼值