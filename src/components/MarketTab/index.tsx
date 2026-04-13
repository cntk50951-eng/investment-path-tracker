// ==========================================
// 市場切換 Tab 組件
// ==========================================

import React from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import './MarketTab.css';

export const MarketTab: React.FC = () => {
  const { currentMarket, setMarket } = useMarketStore();

  const markets = [
    { id: 'US', label: '🇺🇸 美股', comingSoon: false },
    { id: 'HK', label: '🇭🇰 港股', comingSoon: true },
  ] as const;

  return (
    <div className="market-tab">
      <div className="market-tab-list">
        {markets.map((market) => (
          <button
            key={market.id}
            className={`market-tab-btn ${currentMarket === market.id ? 'active' : ''}`}
            onClick={() => setMarket(market.id)}
            disabled={market.comingSoon}
          >
            {market.label}
            {market.comingSoon && (
              <span className="coming-soon-badge">即將上線</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
