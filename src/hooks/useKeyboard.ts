// ==========================================
// 快捷鍵 Hook
// ==========================================

import { useEffect, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useMarketStore } from '../store/useMarketStore';
import { fetchAllData } from './useInvestmentData';

interface UseKeyboardOptions {
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { enabled = true } = options;
  const { selectPath, selectSwitch, selectedPath, selectedSwitch } = useDataStore();
  const currentMarket = useMarketStore(s => s.currentMarket);

  const refresh = useCallback(() => {
    fetchAllData(currentMarket);
  }, [currentMarket]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

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
      selectPath(selectedPath === pathId ? null : pathId);
    }

    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      refresh();
    }

    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      const newsPanel = document.getElementById('newsPanel');
      if (newsPanel) {
        newsPanel.scrollIntoView({ behavior: 'smooth' });
      }
    }

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
