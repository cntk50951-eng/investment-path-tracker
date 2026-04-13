#!/bin/bash
# 投研團隊快速更新腳本
# Usage: ./update_quick.sh

set -e

# ============ 配置 ============
API_KEY="f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL="https://investment-path-tracker.vercel.app/api/v1"

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=============================================="
echo "🦍 投資路徑追蹤器 - 快速更新工具"
echo "=============================================="

# 函數：更新路徑數據
update_paths() {
    echo -e "${BLUE}📡 正在更新路徑數據...${NC}"
    
    # 創建臨時 JSON 文件
    cat > /tmp/paths_update.json << EOF
{
  "nodes": {
    "a": {"id": "a", "prob": $PROB_A},
    "b": {"id": "b", "prob": $PROB_B},
    "c": {"id": "c", "prob": $PROB_C},
    "d": {"id": "d", "prob": $PROB_D},
    "e": {"id": "e", "prob": $PROB_E}
  },
  "version": "$VERSION"
}
EOF
    
    # 發送請求
    RESPONSE=$(curl -s -X POST "$BASE_URL/admin/paths" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d @/tmp/paths_update.json)
    
    # 解析響應
    SUCCESS=$(echo $RESPONSE | jq -r '.success')
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ 路徑數據更新成功！${NC}"
        echo "   版本：$(echo $RESPONSE | jq -r '.data.version')"
        echo "   更新時間：$(echo $RESPONSE | jq -r '.data.lastUpdated')"
    else
        echo -e "${RED}❌ 更新失敗：$(echo $RESPONSE | jq -r '.error.message')${NC}"
    fi
    
    # 清理
    rm /tmp/paths_update.json
}

# 函數：添加新聞
add_news() {
    echo -e "${BLUE}📡 正在添加新聞...${NC}"
    
    # 創建臨時 JSON 文件
    cat > /tmp/news_update.json << EOF
{
  "news": [
    {
      "id": "$NEWS_ID",
      "market": "US",
      "date": "$NEWS_DATE",
      "title": "$NEWS_TITLE",
      "source": "$NEWS_SOURCE",
      "severity": "$NEWS_SEVERITY",
      "summary": "$NEWS_SUMMARY",
      "impact": "$NEWS_IMPACT",
      "affects": $NEWS_AFFECTS,
      "relatedPaths": $NEWS_PATHS,
      "tags": $NEWS_TAGS
    }
  ]
}
EOF
    
    # 發送請求
    RESPONSE=$(curl -s -X POST "$BASE_URL/admin/news" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d @/tmp/news_update.json)
    
    # 解析響應
    SUCCESS=$(echo $RESPONSE | jq -r '.success')
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ 新聞添加成功！${NC}"
        echo "   總數：$(echo $RESPONSE | jq -r '.data.count')"
    else
        echo -e "${RED}❌ 添加失敗：$(echo $RESPONSE | jq -r '.error.message')${NC}"
    fi
    
    # 清理
    rm /tmp/news_update.json
}

# 主菜單
echo ""
echo "請選擇操作："
echo "1. 快速更新路徑概率"
echo "2. 添加新聞"
echo "3. 查看當前數據"
echo "4. 退出"
echo ""

read -p "輸入選項 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "請輸入各路徑概率（總和應為 100）："
        read -p "路徑 A 概率: " PROB_A
        read -p "路徑 B 概率: " PROB_B
        read -p "路徑 C 概率: " PROB_C
        read -p "路徑 D 概率: " PROB_D
        read -p "路徑 E 概率: " PROB_E
        
        TOTAL=$((PROB_A + PROB_B + PROB_C + PROB_D + PROB_E))
        echo ""
        echo "總和：$TOTAL%"
        
        if [ $TOTAL -ne 100 ]; then
            echo -e "${RED}⚠️  警告：概率總和不是 100%${NC}"
            read -p "是否繼續？(y/n): " confirm
            if [ "$confirm" != "y" ]; then
                exit 0
            fi
        fi
        
        VERSION="3.0.$(date +%Y%m%d)"
        echo ""
        echo "版本號：$VERSION"
        
        update_paths
        ;;
    
    2)
        echo ""
        echo "請輸入新聞信息："
        read -p "新聞 ID (例如 news-014): " NEWS_ID
        read -p "日期 (YYYY-MM-DD): " NEWS_DATE
        read -p "標題： " NEWS_TITLE
        read -p "來源： " NEWS_SOURCE
        read -p "嚴重性 (critical/medium/positive): " NEWS_SEVERITY
        read -p "摘要： " NEWS_SUMMARY
        read -p "影響分析： " NEWS_IMPACT
        read -p "影響的切換 (JSON 數組，例如 [\"be\"]: " NEWS_AFFECTS
        read -p "關聯路徑 (JSON 數組，例如 [\"b\",\"e\"]: " NEWS_PATHS
        read -p "標籤 (JSON 數組，例如 [\"通膨\"]: " NEWS_TAGS
        
        add_news
        ;;
    
    3)
        echo ""
        echo -e "${BLUE}📥 正在獲取當前數據...${NC}"
        
        PATHS=$(curl -s "$BASE_URL/paths")
        echo -e "${GREEN}✅ 當前路徑概率:${NC}"
        echo "$PATHS" | jq -r '.data.nodes | to_entries[] | "   \(.key | ascii_upcase): \(.value.prob)%"'
        
        echo ""
        echo -e "${GREEN}✅ 最新新聞:${NC}"
        curl -s "$BASE_URL/news?limit=5" | jq -r '.data.news[] | "   \(.date): \(.title)"'
        ;;
    
    4)
        echo -e "${BLUE}👋 再見！${NC}"
        exit 0
        ;;
    
    *)
        echo -e "${RED}❌ 無效選項${NC}"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "✅ 操作完成！"
echo "=============================================="
