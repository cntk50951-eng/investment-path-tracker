import React from 'react';
import { useDataStore } from '../../../store/useDataStore';
import './MacroBarV2.css';

export const MacroBarV2: React.FC = () => {
  const { macros } = useDataStore();

  if (!macros || macros.length === 0) return null;

  const getIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'hot': return 'macro-v2-hot';
      case 'warn': return 'macro-v2-warn';
      default: return 'macro-v2-normal';
    }
  };

  return (
    <div className="macro-bar-v2">
      {macros.map((macro, index) => (
        <div key={index} className={`macro-v2-item ${getStatusClass(macro.status)}`}>
          <span className="macro-v2-label">{macro.name}</span>
          <span className="macro-v2-value">
            <b>{macro.value}</b>
          </span>
          {macro.trend && (
            <span className="material-symbols-outlined macro-v2-icon">
              {getIcon(macro.trend)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};