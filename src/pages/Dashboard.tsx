// ==========================================
// 主儀表板頁面（含骨架屏 + Debug 標識 + 合規頁腳）
// ==========================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvestmentData } from '../hooks/useInvestmentData';
import { useKeyboard } from '../hooks/useKeyboard';
import { useAuthStore } from '../store/useAuthStore';
import { useDebugStore } from '../store/useDebugStore';
import { MarketTab } from '../components/MarketTab';
import { FunctionTab } from '../components/FunctionTab';
import { MacroBar } from '../components/MacroBar';
import { AlertBanner } from '../components/AlertBanner';
import { FlowDiagram } from '../components/FlowDiagram';
import { SwitchTable } from '../components/SwitchTable';
import { NewsPanel } from '../components/NewsPanel';
import { DetailPanel } from '../components/DetailPanel';
import { ThresholdBanner } from '../components/ThresholdBanner';
import { UpgradePrompt } from '../components/common/UpgradePrompt';
import { DebugPanel } from '../components/common/DebugPanel';
import { ComplianceFooter } from '../components/common/ComplianceFooter';
import { ComplianceModal } from '../components/common/ComplianceModal';
import { FlowDiagramSkeleton, NewsPanelSkeleton, SwitchTableSkeleton, MacroBarSkeleton } from '../components/common/Skeleton';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { loadingModules, error, refresh } = useInvestmentData();
  const { user, logout } = useAuthStore();
  const { isDebugMode } = useDebugStore();
  const navigate = useNavigate();

  useKeyboard({ enabled: true });

  // 處理登出
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>⚠️ 加載失敗</h3>
        <p>{error}</p>
        <button onClick={refresh}>重新加載</button>
      </div>
    );
  }

  // 計算是否有足夠數據顯示

  return (
    <div className="dashboard">
      {/* Debug 模式標識 */}
      {isDebugMode && (
        <div className="debug-mode-banner">
          🔧 DEBUG MODE — 所有付費內容已解鎖，合規審查結果見 Console
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>🦍 2026 美股投資路徑切換中心</h1>
            <p className="dashboard-subtitle">
              宏觀研究 · 路徑追蹤 · 風險監測
              {!loadingModules.paths && ` | 更新：${new Date().toISOString().split('T')[0]}`}
            </p>
          </div>
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} />
                ) : (
                  <span>{user.displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{user.displayName}</span>
                <span className="user-tier">{user.premiumTier === 'pro' ? '💎 Pro' : '🆓 Free'}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="登出">
                🚪
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 市場和功能切換 Tab */}
      <MarketTab />
      <FunctionTab />

      {/* 增量加載 - 每個模塊獨立顯示 */}
      <>
        {/* Macros - 優先加載 */}
        {loadingModules.macros ? <MacroBarSkeleton /> : <MacroBar />}

        <main className="dashboard-main">
          <div className="dashboard-left">
            {/* Flow Diagram */}
            <div className="flow-card">
              {loadingModules.paths ? <FlowDiagramSkeleton /> : <FlowDiagram />}
            </div>
            
            {/* Switch Table */}
            <div className="switch-card">
              {loadingModules.paths ? <SwitchTableSkeleton /> : <SwitchTable />}
            </div>
            
            {/* Detail Panel */}
            <div className="detail-row">
              <div className="detail-card">
                <DetailPanel />
              </div>
            </div>
          </div>
          
          {/* News Panel */}
          <aside className="news-panel-wrapper" id="newsPanel">
            {loadingModules.news ? <NewsPanelSkeleton /> : <NewsPanel />}
          </aside>
        </main>
      </>

      {/* Alert Banners - 數據加載後顯示 */}
      {!loadingModules.paths && <AlertBanner />}
      {!loadingModules.paths && <ThresholdBanner />}

      {/* 合規頁腳（SFC 監管要求） */}
      <ComplianceFooter />

      <UpgradePrompt />
      {isDebugMode && <DebugPanel />}
      <ComplianceModal />
    </div>
  );
};

export default Dashboard;
