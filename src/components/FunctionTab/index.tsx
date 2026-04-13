// ==========================================
// 功能切換 Tab 組件
// ==========================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FunctionTab.css';

type FunctionType = 'dashboard' | 'news';

interface FunctionOption {
  id: FunctionType;
  label: string;
  icon: string;
  path: string;
}

export const FunctionTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentFunction: FunctionType = location.pathname === '/news' ? 'news' : 'dashboard';

  const functions: FunctionOption[] = [
    {
      id: 'dashboard',
      label: '📊 路徑儀表板',
      icon: '📊',
      path: '/',
    },
    {
      id: 'news',
      label: '📰 新聞時間線',
      icon: '📰',
      path: '/news',
    },
  ];

  const handleClick = (func: FunctionOption) => {
    navigate(func.path);
  };

  return (
    <div className="function-tab">
      <div className="function-tab-list">
        {functions.map((func) => (
          <button
            key={func.id}
            className={`function-tab-btn ${currentFunction === func.id ? 'active' : ''}`}
            onClick={() => handleClick(func)}
          >
            <span className="function-tab-icon">{func.icon}</span>
            <span>{func.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
