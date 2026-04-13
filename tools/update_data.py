#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
投研團隊數據更新工具
Usage: python update_data.py
"""

import requests
import json
from datetime import datetime

# ============ 配置 ============
API_KEY = "f1d73983e4856108a6c2ba7f2d550cf0e916cc596a166e2d4f41bccb6265b720"
BASE_URL = "https://investment-path-tracker.vercel.app/api/v1"

HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# ============ 函數 ============

def update_paths(nodes=None, alert=None, threshold_alert=None, version=None):
    """
    更新路徑數據
    
    Args:
        nodes: 路徑節點數據字典
        alert: 警報信息
        threshold_alert: 閾值警報
        version: 版本號
    """
    print("📡 正在更新路徑數據...")
    
    data = {}
    if nodes:
        data["nodes"] = nodes
    if alert:
        data["alert"] = alert
    if threshold_alert:
        data["thresholdAlert"] = threshold_alert
    if version:
        data["version"] = version
    
    if not data:
        print("❌ 錯誤：未提供更新數據")
        return
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/paths",
            headers=HEADERS,
            json=data,
            timeout=30
        )
        
        result = response.json()
        
        if result.get("success"):
            print(f"✅ 路徑數據更新成功！")
            print(f"   版本：{result['data'].get('version', 'N/A')}")
            print(f"   更新時間：{result['data'].get('lastUpdated', 'N/A')}")
        else:
            print(f"❌ 更新失敗：{result.get('error', {}).get('message', '未知錯誤')}")
        
        return result
        
    except Exception as e:
        print(f"❌ 請求失敗：{str(e)}")
        return None


def update_news(news_list):
    """
    更新新聞數據
    
    Args:
        news_list: 新聞列表
    """
    print(f"📡 正在更新新聞數據（{len(news_list)} 條）...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/news",
            headers=HEADERS,
            json={"news": news_list},
            timeout=30
        )
        
        result = response.json()
        
        if result.get("success"):
            print(f"✅ 新聞數據更新成功！")
            print(f"   總數：{result['data'].get('count', 'N/A')}")
            print(f"   更新時間：{result['data'].get('lastUpdated', 'N/A')}")
        else:
            print(f"❌ 更新失敗：{result.get('error', {}).get('message', '未知錯誤')}")
        
        return result
        
    except Exception as e:
        print(f"❌ 請求失敗：{str(e)}")
        return None


def add_breaking_news(title, summary, impact, severity="critical", affects=None, related_paths=None):
    """
    添加突發新聞
    
    Args:
        title: 標題
        summary: 摘要
        impact: 影響分析
        severity: 嚴重性（critical/medium/positive）
        affects: 影響的切換 ID 列表
        related_paths: 關聯路徑 ID 列表
    """
    print(f"🔴 添加突發新聞：{title}")
    
    news_item = {
        "id": f"breaking-{int(datetime.now().timestamp())}",
        "market": "US",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": f"🔴 突發：{title}",
        "source": "快訊",
        "severity": severity,
        "summary": summary,
        "impact": impact,
        "affects": affects or [],
        "relatedPaths": related_paths or [],
        "tags": ["突發", "快訊"]
    }
    
    return update_news([news_item])


def get_current_data():
    """
    獲取當前數據（用於參考）
    """
    print("📥 正在獲取當前數據...")
    
    try:
        response = requests.get(f"{BASE_URL}/paths", timeout=10)
        paths_data = response.json()
        
        response = requests.get(f"{BASE_URL}/news?limit=5", timeout=10)
        news_data = response.json()
        
        if paths_data.get("success"):
            print("✅ 當前路徑數據:")
            for node_id, node in paths_data["data"]["nodes"].items():
                current_marker = " ← 當前" if node.get("current") else ""
                print(f"   {node_id.upper()}: {node['prob']}%{current_marker}")
        
        if news_data.get("success"):
            print(f"\n✅ 最新新聞（前 5 條）:")
            for news in news_data["data"]["news"][:5]:
                print(f"   {news['date']}: {news['title']}")
        
        return paths_data, news_data
        
    except Exception as e:
        print(f"❌ 獲取數據失敗：{str(e)}")
        return None, None


# ============ 命令行界面 ============

def interactive_mode():
    """交互模式"""
    print("=" * 60)
    print("🦍 投資路徑追蹤器 - 數據更新工具")
    print("=" * 60)
    
    while True:
        print("\n請選擇操作：")
        print("1. 查看當前數據")
        print("2. 更新路徑概率")
        print("3. 添加突發新聞")
        print("4. 批量更新新聞")
        print("5. 退出")
        
        choice = input("\n輸入選項 (1-5): ").strip()
        
        if choice == "1":
            get_current_data()
        
        elif choice == "2":
            print("\n輸入路徑概率（格式：路徑 ID=概率，例如 b=35）:")
            nodes = {}
            while True:
                line = input("> ").strip()
                if not line:
                    break
                try:
                    path_id, prob = line.split("=")
                    nodes[path_id.strip()] = {"prob": int(prob.strip())}
                except:
                    print("格式錯誤，請重新輸入")
            
            if nodes:
                update_paths(nodes=nodes)
        
        elif choice == "3":
            title = input("標題：").strip()
            summary = input("摘要：").strip()
            impact = input("影響分析：").strip()
            severity = input("嚴重性 (critical/medium/positive): ").strip() or "critical"
            
            add_breaking_news(title, summary, impact, severity)
        
        elif choice == "4":
            print("\n請提供新聞 JSON 文件路徑:")
            file_path = input("> ").strip()
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    news_list = json.load(f)
                
                if isinstance(news_list, list):
                    update_news(news_list)
                else:
                    print("❌ 錯誤：JSON 必須是數組格式")
            except Exception as e:
                print(f"❌ 讀取文件失敗：{str(e)}")
        
        elif choice == "5":
            print("\n👋 再見！")
            break
        
        else:
            print("❌ 無效選項")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        interactive_mode()
    else:
        # 默認模式：查看當前數據
        get_current_data()
