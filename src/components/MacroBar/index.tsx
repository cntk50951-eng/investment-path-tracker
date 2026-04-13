// ==========================================
// 宏觀數據欄組件
// ==========================================

import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import './MacroBar.css';

export const MacroBar: React.FC = () => {
  const { macros } = useDataStore();

  if (!macros || macros.length === 0) return null;

  return (
    <div className="macro-bar">
      {macros.map((macro, index) => (
        <div key={index} className={`macro-item macro-${macro.status}`}>
          <span className="macro-name">{macro.name}</span>
          <span className="macro-value">
            <b>{macro.value}</b>
            {macro.trend && (
              <span className="macro-trend">
                {macro.trend === 'up' ? ' ↑' : macro.trend === 'down' ? ' ↓' : ''}
              </span>
            )}
          </span>
          {macro.note && <span className="macro-note">{macro.note}</span>}
        </div>
      ))}
    </div>
  );
};
