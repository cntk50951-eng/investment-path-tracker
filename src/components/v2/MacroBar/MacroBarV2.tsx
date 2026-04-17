import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';
import { fetchMarketData } from '../../../hooks/useInvestmentData';
import './MacroBarV2.css';

const MACRO_ICONS: Record<string, string> = {
  vix: 'warning_amber',
  spx: 'show_chart',
  tnx: 'account_balance',
  dxy: 'currency_exchange',
  hsi: 'show_chart',
  vhsi: 'warning_amber',
};

const MACRO_COLORS: Record<string, { hot: string; warn: string; normal: string }> = {
  vix: { hot: '#ef4444', warn: '#f59e0b', normal: '#10b981' },
  spx: { hot: '#ef4444', warn: '#f59e0b', normal: '#10b981' },
  tnx: { hot: '#ef4444', warn: '#f59e0b', normal: '#7de9ff' },
  dxy: { hot: '#ef4444', warn: '#f59e0b', normal: '#7de9ff' },
  hsi: { hot: '#ef4444', warn: '#f59e0b', normal: '#10b981' },
  vhsi: { hot: '#ef4444', warn: '#f59e0b', normal: '#10b981' },
};

export const MacroBarV2: React.FC = () => {
  const marketData = useDataStore(s => s.marketData);
  const macros = useDataStore(s => s.macros);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchMarketData(currentMarket).then(() => {
      setLastUpdate(new Date());
    });
  }, [currentMarket]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await fetchMarketData(currentMarket);
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [currentMarket]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMarketData(currentMarket);
    setIsRefreshing(false);
    setLastUpdate(new Date());
  };

  const items = marketData && marketData.length > 0 ? marketData : (macros || []);
  if (items.length === 0) return null;

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="macro-bar-v2">
      {items.map((macro, index) => {
        const icon = MACRO_ICONS[macro.id] || 'trending_flat';
        const colors = MACRO_COLORS[macro.id] || { hot: '#ef4444', warn: '#f59e0b', normal: '#7de9ff' };
        const color = colors[macro.status as keyof typeof colors] || colors.normal;
        const trendIcon = macro.trend === 'up' ? 'trending_up' : macro.trend === 'down' ? 'trending_down' : 'trending_flat';

        return (
          <div key={macro.id || index} className={`macro-v2-item macro-v2-${macro.status || 'normal'}`}>
            <span className="macro-v2-label">{macro.label}</span>
            <span className="macro-v2-value" style={{ color }}>
              <b>{macro.value}</b>
            </span>
            {macro.changePercent != null && (
              <span className="macro-v2-change" style={{ color: macro.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
                {macro.changePercent >= 0 ? '+' : ''}{macro.changePercent}%
              </span>
            )}
            {macro.trend && (
              <span className="material-symbols-outlined macro-v2-icon" style={{ color }}>
                {macro.changePercent != null ? trendIcon : icon}
              </span>
            )}
            {macro.type === 'realtime' && (
              <span className="macro-v2-badge">RT</span>
            )}
          </div>
        );
      })}

      <div className="macro-v2-spacer" />

      <div className="macro-v2-meta">
        {lastUpdate && (
          <span className="macro-v2-time">{formatTime(lastUpdate)}</span>
        )}
        <button
          className={`macro-v2-refresh ${isRefreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="刷新即時數據"
        >
          <span className="material-symbols-outlined">
            {isRefreshing ? 'progress_activity' : 'refresh'}
          </span>
        </button>
      </div>
    </div>
  );
};