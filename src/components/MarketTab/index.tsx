// ==========================================
// 市場切換 Tab 組件
// ==========================================

import React from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import './MarketTab.css';

export const MarketTab: React.FC = () => {
  const { currentMarket, setMarket } = useMarketStore();

  const markets = [
    { id: 'US' as const, label: '🇺🇸 美股' },
    { id: 'HK' as const, label: '🇭🇰 港股' },
  ];

  return (
    <div className="market-tab">
      <div className="market-tab-list">
        {markets.map((market) => (
          <button
            key={market.id}
            className={`market-tab-btn ${currentMarket === market.id ? 'active' : ''}`}
            onClick={() => setMarket(market.id)}
          >
            {market.label}
          </button>
        ))}
      </div>
    </div>
  );
};
