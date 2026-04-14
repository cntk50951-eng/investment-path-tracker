import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvestmentData } from '../hooks/useInvestmentData';
import { useKeyboard } from '../hooks/useKeyboard';
import { useAuthStore } from '../store/useAuthStore';
import { useDebugStore } from '../store/useDebugStore';
import { useMarketStore } from '../store/useMarketStore';
import { MacroBarV2 } from '../components/v2/MacroBar/MacroBarV2';
import { FlowDiagramV2 } from '../components/v2/FlowDiagram/FlowDiagramV2';
import { SwitchTableV2 } from '../components/v2/SwitchTable/SwitchTableV2';
import { NewsPanelV2 } from '../components/v2/NewsPanel/NewsPanelV2';
import { DetailPanelV2 } from '../components/v2/DetailPanel/DetailPanelV2';
import { SidebarNav } from '../components/v2/SidebarNav/SidebarNav';
import { UpgradePrompt } from '../components/common/UpgradePrompt';
import { ComplianceFooter } from '../components/common/ComplianceFooter';
import { ComplianceModal } from '../components/common/ComplianceModal';
import { FlowDiagramSkeleton, NewsPanelSkeleton, SwitchTableSkeleton } from '../components/common/Skeleton';
import './DashboardV2.css';

const MARKET_TITLES: Record<string, string> = {
  US: '🦍 2026 美股投資路徑',
  HK: '🦍 2026 港股投資路徑',
};

const DashboardV2: React.FC = () => {
  const { loadingModules, error, refresh } = useInvestmentData();
  const { user, logout } = useAuthStore();
  const { isDebugMode } = useDebugStore();
  const { currentMarket, setMarket } = useMarketStore();
  const navigate = useNavigate();

  useKeyboard({ enabled: true });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (error) {
    return (
      <div className="v2-error">
        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--error, #ff6e84)' }}>error_outline</span>
        <h3>加載失敗</h3>
        <p>{error}</p>
        <button className="v2-error-btn" onClick={refresh}>重新加載</button>
      </div>
    );
  }

  return (
    <div className="v2-dashboard">
      {isDebugMode && (
        <div className="v2-debug-banner">
          🔧 DEBUG MODE — 所有付費內容已解鎖
        </div>
      )}

      <header className="v2-header">
        <div className="v2-header-left">
          <div className="v2-logo">{MARKET_TITLES[currentMarket] || MARKET_TITLES.US}</div>
          <nav className="v2-nav">
            <a className="v2-nav-link active" href="#">Dashboard</a>
            <a className="v2-nav-link" href="#">Timeline</a>
          </nav>
        </div>

        <div className="v2-header-center">
          <div className="v2-search">
            <span className="material-symbols-outlined v2-search-icon">search</span>
            <input
              className="v2-search-input"
              type="text"
              placeholder="搜索市場..."
            />
          </div>
        </div>

        <div className="v2-header-right">
          <div className="v2-market-toggle">
            <button
              className={`v2-market-btn ${currentMarket === 'US' ? 'active' : ''}`}
              onClick={() => setMarket('US')}
            >
              US
            </button>
            <button
              className={`v2-market-btn ${currentMarket === 'HK' ? 'active' : ''}`}
              onClick={() => setMarket('HK')}
            >
              HK
            </button>
          </div>

          <div className="v2-header-actions">
            <button className="v2-icon-btn" title="通知">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="v2-icon-btn" title="設定">
              <span className="material-symbols-outlined">settings</span>
            </button>
            {user && (
              <div className="v2-user">
                <div className="v2-user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <span>{user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button className="v2-icon-btn" onClick={handleLogout} title="登出">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SidebarNav />

      <MacroBarV2 />

      <main className="v2-main">
        <div className="v2-content">
          <div className="v2-flow-card">
            {loadingModules.paths ? <FlowDiagramSkeleton /> : <FlowDiagramV2 />}
          </div>

          <div className="v2-switch-card">
            {loadingModules.paths ? <SwitchTableSkeleton /> : <SwitchTableV2 />}
          </div>

          <div className="v2-detail-card">
            <DetailPanelV2 />
          </div>
        </div>

        <aside className="v2-sidebar" id="newsPanel">
          {loadingModules.news ? <NewsPanelSkeleton /> : <NewsPanelV2 />}
        </aside>
      </main>

      <ComplianceFooter />
      <UpgradePrompt />
      <ComplianceModal />
    </div>
  );
};

export default DashboardV2;