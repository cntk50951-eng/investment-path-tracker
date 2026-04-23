import React, { useRef } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';

const MACRO_LABELS: Record<string, Record<string, string>> = {
  US: {
    sp500: 'S&P 500',
    vix: 'VIX',
    us10y: 'US 10Y Yield',
    dxy: 'DXY',
    gold: 'Gold',
    oil: 'Brent Crude',
  },
  HK: {
    hsi: 'HSI',
    vhsi: 'VHSI',
    usdhkd: 'USD/HKD',
    hk10y: 'HK 10Y',
    gold: 'Gold',
    hsi_tech: 'HangSeng Tech',
  },
};

function generateSparkline(trend: string): string {
  const points = [];
  const seed = trend === 'up' ? 1 : trend === 'down' ? -1 : 0;
  let y = 10 + seed * 3;
  for (let i = 0; i <= 100; i += 10) {
    const noise = Math.sin(i * 0.3 + seed * 2) * 4;
    y = Math.max(2, Math.min(18, y + noise + seed * 0.5));
    points.push(`${i},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

const MacroBarV3: React.FC = () => {
  const marketData = useDataStore(s => s.marketData);
  const macros = useDataStore(s => s.macros);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = marketData && marketData.length > 0
    ? marketData
    : macros || [];

  const labels = MACRO_LABELS[currentMarket] || MACRO_LABELS.US;

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <section className="v3-macro-section">
      <div className="v3-macro-scroll-wrapper">
        <button className="v3-macro-scroll-btn" onClick={scrollLeft} title="Scroll left">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="v3-macro-scroll" ref={scrollRef}>
          {items.slice(0, 6).map((item: any, idx: number) => {
            const id = item.id || item.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || `macro-${idx}`;
            const label = item.label || labels[id] || item.name;
            const value = item.value || '—';
            const changePercent = item.changePercent ?? item.change ?? null;
            const trend = item.trend || item.status === 'hot' ? 'down' : 'up';
            const isPositive = changePercent != null ? changePercent >= 0 : trend === 'up';
            const isNeg = changePercent != null ? changePercent < 0 : trend === 'down';
            const sparkColor = isNeg ? '#ba1a1a' : isPositive ? '#b55d00' : '#4648d4';
            const sparkPath = generateSparkline(trend);

            return (
              <div key={id} className="v3-macro-card">
                <div className="v3-macro-header">
                  <span className="v3-macro-label">{label}</span>
                  {changePercent != null && (
                    <span className={`v3-macro-badge ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{typeof changePercent === 'number' ? changePercent.toFixed(2) : changePercent}%
                    </span>
                  )}
                </div>
                <span className="v3-macro-value">{value}</span>
                <div className="v3-macro-sparkline">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d={`M${sparkPath}`} fill="none" stroke={sparkColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        <button className="v3-macro-scroll-btn" onClick={scrollRight} title="Scroll">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  );
};

export { MacroBarV3 };