import React, { useEffect, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';
import { fetchMarketData } from '../../../hooks/useInvestmentData';
import './MacroBarV2.css';

interface MacroData {
  id: string;
  label: string;
  value: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'flat';
  status?: 'hot' | 'warn' | 'normal';
  type?: string;
}

const MACRO_META: Record<string, { label: string }> = {
  vix: { label: 'VIX' },
  spx: { label: 'S&P 500' },
  tnx: { label: '10Y' },
  dxy: { label: 'DXY' },
  hsi: { label: 'HSI' },
  vhsi: { label: 'VHSI' },
};

const STATUS_DOT: Record<string, string> = {
  hot: '#f85149',
  warn: '#d29922',
  normal: '#3fb950',
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

  const items: MacroData[] = marketData && marketData.length > 0 ? marketData : (macros || []);
  if (items.length === 0) return null;

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="macro-bar-v3">
      <div className="macro-bar-v3-scroll">
        <div className="macro-bar-v3-items">
          {items.map((macro, index) => {
            const meta = MACRO_META[macro.id] || { label: macro.label };
            const dotColor = STATUS_DOT[macro.status || 'normal'] || STATUS_DOT.normal;
            const isUp = macro.changePercent != null && macro.changePercent >= 0;
            const isDown = macro.changePercent != null && macro.changePercent < 0;

            return (
              <React.Fragment key={macro.id || index}>
                {index > 0 && <div className="macro-v3-sep" />}
                <div className="macro-v3-item">
                  <span className="macro-v3-dot" style={{ backgroundColor: dotColor }} />
                  <span className="macro-v3-card-label">{meta.label}</span>
                  <span className="macro-v3-value">{macro.value}</span>
                  {macro.changePercent != null && (
                    <span className={`macro-v3-change ${isUp ? 'up' : isDown ? 'down' : ''}`}>
                      <span className="material-symbols-outlined macro-v3-trend-icon">
                        {isUp ? 'arrow_upward' : isDown ? 'arrow_downward' : 'remove'}
                      </span>
                      {Math.abs(macro.changePercent)}%
                    </span>
                  )}
                  {macro.type === 'realtime' && (
                    <span className="macro-v3-live">
                      <span className="macro-v3-live-dot" />
                      LIVE
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="macro-v3-divider" />

      <div className="macro-v3-meta">
        <span className="macro-v3-time">{lastUpdate ? formatTime(lastUpdate) : '--:--'}</span>
        <button
          className={`macro-v3-refresh ${isRefreshing ? 'spinning' : ''}`}
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
