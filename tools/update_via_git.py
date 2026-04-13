#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
投研團隊數據更新工具（Git 工作流）
Usage: python tools/update_via_git.py
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ============ 配置 ============
DATA_FILE = Path("public/data/latest.json")
REPO_BRANCH = "main"

# ============ 顏色 ============
RED = "\033[0;31m"
GREEN = "\033[0;32m"
BLUE = "\033[0;34m"
YELLOW = "\033[1;33m"
NC = "\033[0m"

# ============ 函數 ============

def print_step(message):
    """打印步驟信息"""
    print(f"\n{BLUE}➜ {message}{NC}")

def print_success(message):
    """打印成功信息"""
    print(f"{GREEN}✅ {message}{NC}")

def print_error(message):
    """打印錯誤信息"""
    print(f"{RED}❌ {message}{NC}")

def print_warning(message):
    """打印警告信息"""
    print(f"{YELLOW}⚠️  {message}{NC}")

def validate_news(news_list):
    """驗證新聞數據格式"""
    required_fields = [
        'id', 'market', 'date', 'title', 'source',
        'severity', 'summary', 'impact', 'affects',
        'relatedPaths', 'tags'
    ]
    
    errors = []
    severity_options = ['critical', 'medium', 'positive']
    
    for i, news in enumerate(news_list):
        for field in required_fields:
            if field not in news:
                errors.append(f"新聞 {i}: 缺少必填字段 '{field}'")
        
        if 'severity' in news and news['severity'] not in severity_options:
            errors.append(f"新聞 {i}: severity 必須是 {severity_options}")
        
        if 'market' in news and news['market'] not in ['US', 'HK']:
            errors.append(f"新聞 {i}: market 必須是 'US' 或 'HK'")
        
        if 'affects' in news and not isinstance(news['affects'], list):
            errors.append(f"新聞 {i}: affects 必須是數組")
        
        if 'relatedPaths' in news and not isinstance(news['relatedPaths'], list):
            errors.append(f"新聞 {i}: relatedPaths 必須是數組")
    
    return errors

def load_data():
    """加載當前數據"""
    if not DATA_FILE.exists():
        print_error(f"數據文件不存在：{DATA_FILE}")
        return None
    
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """保存數據"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print_success(f"數據已保存到 {DATA_FILE}")

def git_push(commit_message):
    """Git 提交並推送"""
    print_step("添加到 Git...")
    subprocess.run(['git', 'add', str(DATA_FILE)], check=True)
    
    print_step("提交更改...")
    subprocess.run(['git', 'commit', '-m', commit_message], check=True)
    
    print_step("推送到 GitHub...")
    subprocess.run(['git', 'push', 'origin', REPO_BRANCH], check=True)
    
    print_success("推送成功！Vercel 將自動部署...")

def update_news(news_list, auto_push=True):
    """
    更新新聞數據
    
    Args:
        news_list: 新聞列表
        auto_push: 是否自動推送
    """
    print(f"{GREEN}🦍 投資路徑追蹤器 - 新聞更新工具{NC}")
    print("=" * 60)
    
    # 驗證數據
    print_step("驗證新聞數據...")
    errors = validate_news(news_list)
    
    if errors:
        print_error("數據驗證失敗:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    print_success(f"驗證通過，共 {len(news_list)} 條新聞")
    
    # 加載當前數據
    print_step("加載當前數據...")
    data = load_data()
    if not data:
        return False
    
    old_count = len(data.get('news', []))
    print(f"   當前新聞數量：{old_count} 條")
    
    # 更新新聞
    print_step("更新新聞數據...")
    data['news'] = news_list
    data['meta']['lastUpdated'] = datetime.now().isoformat()
    
    # 保存
    save_data(data)
    
    # Git 推送
    if auto_push:
        commit_msg = f"update: 更新新聞數據 - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        git_push(commit_msg)
        
        print("\n" + "=" * 60)
        print(f"{GREEN}✅ 更新完成！{NC}")
        print(f"\n📊 摘要:")
        print(f"   - 新增新聞：{len(news_list)} 條")
        print(f"   - 更新時間：{data['meta']['lastUpdated']}")
        print(f"   - Vercel 部署：自動進行中（約 30-60 秒）")
        print(f"\n🔍 驗證更新:")
        print(f"   curl https://investment-path-tracker.vercel.app/api/v1/news")
    else:
        print("\n" + "=" * 60)
        print(f"{YELLOW}⚠️  數據已保存但未推送{NC}")
        print(f"\n請手動執行:")
        print(f"   git add {DATA_FILE}")
        print(f"   git commit -m '更新新聞數據'")
        print(f"   git push origin main")
    
    return True

def add_breaking_news(title, summary, impact, affects=None, related_paths=None, auto_push=True):
    """
    添加突發新聞
    
    Args:
        title: 標題
        summary: 摘要
        impact: 影響分析
        affects: 影響的切換
        related_paths: 關聯路徑
        auto_push: 是否自動推送
    """
    print(f"{GREEN}🔴 添加突發新聞{NC}")
    
    # 加載當前數據
    data = load_data()
    if not data:
        return False
    
    # 創建突發新聞
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    breaking_news = {
        "id": f"breaking-{timestamp}",
        "market": "US",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": f"🔴 突發：{title}",
        "source": "快訊",
        "severity": "critical",
        "summary": summary,
        "impact": impact,
        "affects": affects or [],
        "relatedPaths": related_paths or [],
        "tags": ["突發", "快訊"]
    }
    
    # 添加到新聞列表頂部
    data['news'].insert(0, breaking_news)
    data['meta']['lastUpdated'] = datetime.now().isoformat()
    
    # 保存
    save_data(data)
    
    print_success(f"突發新聞已添加：{title}")
    
    # Git 推送
    if auto_push:
        commit_msg = f"breaking: 突發新聞 - {title}"
        git_push(commit_msg)
    
    return True

def interactive_mode():
    """交互模式"""
    print(f"\n{GREEN}🦍 投資路徑追蹤器 - 交互更新模式{NC}")
    print("=" * 60)
    
    while True:
        print("\n請選擇操作：")
        print("1. 更新全部新聞")
        print("2. 添加突發新聞")
        print("3. 查看當前新聞")
        print("4. 驗證 JSON 文件")
        print("5. 退出")
        
        choice = input("\n輸入選項 (1-5): ").strip()
        
        if choice == "1":
            print("\n請提供新聞 JSON 文件路徑:")
            file_path = input("> ").strip()
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    news_list = json.load(f)
                
                if not isinstance(news_list, list):
                    print_error("JSON 必須是數組格式")
                    continue
                
                auto_push = input("是否自動推送？(y/n): ").strip().lower() == 'y'
                update_news(news_list, auto_push)
                
            except Exception as e:
                print_error(f"讀取文件失敗：{e}")
        
        elif choice == "2":
            title = input("標題：").strip()
            summary = input("摘要：").strip()
            impact = input("影響分析：").strip()
            
            affects_input = input("影響的切換 (例如 be,bd): ").strip()
            affects = [x.strip() for x in affects_input.split(',')] if affects_input else []
            
            paths_input = input("關聯路徑 (例如 b,e): ").strip()
            related_paths = [x.strip() for x in paths_input.split(',')] if paths_input else []
            
            auto_push = input("是否自動推送？(y/n): ").strip().lower() == 'y'
            
            add_breaking_news(title, summary, impact, affects, related_paths, auto_push)
        
        elif choice == "3":
            data = load_data()
            if data:
                print(f"\n📰 當前新聞（最新 5 條）:")
                for news in data.get('news', [])[:5]:
                    print(f"   {news['date']}: {news['title']} ({news['severity']})")
        
        elif choice == "4":
            file_path = input("JSON 文件路徑：").strip()
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    news_list = json.load(f)
                
                errors = validate_news(news_list)
                if errors:
                    print_error("驗證失敗:")
                    for error in errors:
                        print(f"  - {error}")
                else:
                    print_success(f"驗證通過！共 {len(news_list)} 條新聞")
            
            except Exception as e:
                print_error(f"讀取失敗：{e}")
        
        elif choice == "5":
            print(f"\n{BLUE}👋 再見！{NC}")
            break
        
        else:
            print_error("無效選項")

# ============ 命令行界面 ============

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive":
            interactive_mode()
        elif sys.argv[1] == "--help":
            print(f"""
🦍 投資路徑追蹤器 - 新聞更新工具

用法:
  python tools/update_via_git.py                    # 默認：查看幫助
  python tools/update_via_git.py --interactive     # 交互模式
  python tools/update_via_git.py --help            # 顯示幫助

功能:
  1. 更新全部新聞
  2. 添加突發新聞
  3. 驗證新聞格式
  4. 自動 Git 推送

文檔:
  docs/TEAM_API_GUIDE.md
  docs/API_WRITE_LIMITATIONS.md
""")
    else:
        interactive_mode()
