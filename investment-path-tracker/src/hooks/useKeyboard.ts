// ==========================================
// 快捷鍵 Hook
// ==========================================

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useInvestmentData } from './useInvestmentData';

interface UseKeyboardOptions {
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { enabled = true } = options;
  const { selectPath, selectSwitch, selectedPath, selectedSwitch } = useDataStore();
  const { refresh } = useInvestmentData();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略輸入框中的按鍵
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // 數字鍵 1-5：快速切換路徑
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const pathMap: Record<string, string> = {
        '1': 'a',
        '2': 'b',
        '3': 'c',
        '4': 'd',
        '5': 'e',
      };
      const pathId = pathMap[e.key];
      
      // 如果已選中則取消，否則選中
      selectPath(selectedPath === pathId ? null : pathId);
    }

    // R: 刷新數據
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      refresh();
    }

    // N: 跳到新聞面板
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      const newsPanel = document.getElementById('newsPanel');
      if (newsPanel) {
        newsPanel.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Esc: 關閉詳情面板
    if (e.key === 'Escape') {
      e.preventDefault();
      selectPath(null);
      selectSwitch(null);
    }
  }, [enabled, selectPath, selectSwitch, selectedPath, selectedSwitch, refresh]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}
