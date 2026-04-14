import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SidebarNav.css';

const NAV_ITEMS = [
  { id: 'overview', icon: 'dashboard', label: 'Overview', path: '/v2' },
  { id: 'markets', icon: 'show_chart', label: 'Markets', path: '/v2' },
  { id: 'indicators', icon: 'analytics', label: 'Indicators', path: '/v2' },
  { id: 'history', icon: 'history_edu', label: 'History', path: '/v2' },
  { id: 'strategy', icon: 'account_balance_wallet', label: 'Strategy', path: '/v2' },
];

export const SidebarNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeId, setActiveId] = React.useState('overview');

  const handleClick = (item: typeof NAV_ITEMS[number]) => {
    setActiveId(item.id);
    if (item.path !== location.pathname) {
      navigate(item.path);
    }
  };

  return (
    <nav className="sidenav-v2">
      <div className="sidenav-v2-items">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidenav-v2-btn ${activeId === item.id ? 'active' : ''}`}
            onClick={() => handleClick(item)}
            title={item.label}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        ))}
      </div>
      <div className="sidenav-v2-bottom">
        <button className="sidenav-v2-btn" title="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>
    </nav>
  );
};