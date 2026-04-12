// ==========================================
// 主儀表板頁面（含骨架屏 + Debug 標識 + 合規頁腳）
// ==========================================

import React from 'react';
import { useInvestmentData } from '../hooks/useInvestmentData';
import { useKeyboard } from '../hooks/useKeyboard';
import { useDataStore } from '../store/useDataStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { useDebugStore } from '../store/useDebugStore';
import { MacroBar } from '../components/MacroBar';
import { AlertBanner } from '../components/AlertBanner';
import { FlowDiagram } from '../components/FlowDiagram';
import { SwitchTable } from '../components/SwitchTable';
import { NewsPanel } from '../components/NewsPanel';
import { DetailPanel } from '../components/DetailPanel';
import { ThresholdBanner } from '../components/ThresholdBanner';
import { PaywallModal } from '../components/common/PaywallModal';
import { DebugPanel } from '../components/common/DebugPanel';
import { FlowDiagramSkeleton, NewsPanelSkeleton, SwitchTableSkeleton, MacroBarSkeleton } from '../components/common/Skeleton';
import { FOOTER_DISCLAIMER } from '../utils/complianceChecker';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refresh } = useInvestmentData();
  const { selectedPath, selectedSwitch } = useDataStore();
  const { isPremium, paywallCount, shouldShowPaywall } = usePremiumStore();
  const { isDebugMode } = useDebugStore();
  const [showPaywall, setShowPaywall] = React.useState(false);

  useKeyboard({ enabled: true });

  React.useEffect(() => {
    if (!isPremium && shouldShowPaywall() && paywallCount > 0) {
      setShowPaywall(true);
    }
  }, [selectedPath, selectedSwitch, isPremium, shouldShowPaywall, paywallCount]);

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>⚠️ 加載失敗</h3>
        <p>{error}</p>
        <button onClick={refresh}>重新加載</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Debug 模式標識 */}
      {isDebugMode && (
        <div className="debug-mode-banner">
          🔧 DEBUG MODE — 所有付費內容已解鎖，合規審查結果見 Console
        </div>
      )}

      <header className="dashboard-header">
        <h1>🦍 2026 美股投資路徑切換中心</h1>
        <p className="dashboard-subtitle">
          人猿決策 · 鷹眼宏觀 · 獵豹情報 · 蝮蛇風控
          {data && ` | 更新：${data.meta.lastUpdated.split('T')[0]}`}
        </p>
      </header>

      {/* 骨架屏 or 真實內容 */}
      {isLoading ? (
        <>
          <MacroBarSkeleton />
          <main className="dashboard-main">
            <div className="dashboard-left">
              <div className="flow-card"><FlowDiagramSkeleton /></div>
              <div className="switch-card"><SwitchTableSkeleton /></div>
            </div>
            <aside className="news-panel-wrapper"><NewsPanelSkeleton /></aside>
          </main>
        </>
      ) : data ? (
        <>
          <MacroBar />
          <AlertBanner />
          <ThresholdBanner />

          <main className="dashboard-main">
            <div className="dashboard-left">
              <div className="flow-card">
                <FlowDiagram />
              </div>
              <div className="switch-card">
                <SwitchTable />
              </div>
              <div className="detail-row">
                <div className="detail-card">
                  <DetailPanel />
                </div>
              </div>
            </div>
            <aside className="news-panel-wrapper" id="newsPanel">
              <NewsPanel />
            </aside>
          </main>
        </>
      ) : null}

      {/* 合規強制頁腳免責聲明 */}
      <footer className="dashboard-footer">
        <div className="footer-disclaimer">{FOOTER_DISCLAIMER}</div>
      </footer>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
      {isDebugMode && <DebugPanel />}
    </div>
  );
};

export default Dashboard;
