// ==========================================
// 主儀表板頁面
// ==========================================

import React from 'react';
import { useInvestmentData } from '../hooks/useInvestmentData';
import { useKeyboard } from '../hooks/useKeyboard';
import { useDataStore } from '../store/useDataStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { useDebugStore } from '../store/useDebugStore';
import { MacroBar } from '../components/MacroBar';
import { AlertBanner } from '../components/AlertBanner';
import { PaywallModal } from '../components/common/PaywallModal';
import { DebugPanel } from '../components/common/DebugPanel';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refresh } = useInvestmentData();
  const { selectedPath, selectedSwitch, selectedNews } = useDataStore();
  const { isPremium, paywallCount, shouldShowPaywall } = usePremiumStore();
  const { isDebugMode } = useDebugStore();
  const [showPaywall, setShowPaywall] = React.useState(false);

  // 快捷鍵支持
  useKeyboard({ enabled: true });

  // 檢查是否需要顯示付費牆
  React.useEffect(() => {
    if (!isPremium && shouldShowPaywall() && paywallCount > 0) {
      setShowPaywall(true);
    }
  }, [selectedPath, selectedSwitch, isPremium, shouldShowPaywall, paywallCount]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>加載投資路徑數據中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>⚠️ 加載失敗</h3>
        <p>{error}</p>
        <button onClick={refresh}>重新加載</button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🦍 2026 美股投資路徑切換中心</h1>
        <p className="dashboard-subtitle">
          人猿決策 · 鷹眼宏觀 · 獵豹情報 · 蝮蛇風控 | 更新：{data.meta.lastUpdated.split('T')[0]}
        </p>
      </header>

      <MacroBar />
      <AlertBanner />

      <main className="dashboard-main">
        <div className="dashboard-left">
          {/* 流程圖區域 - 待實現 */}
          <div className="flow-card">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              流程圖組件開發中...
            </p>
          </div>

          {/* 切換表區域 - 待實現 */}
          <div className="switch-card">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              切換表組件開發中...
            </p>
          </div>

          {/* 詳情面板區域 - 待實現 */}
          <div className="detail-row">
            <div className="detail-card">
              <h3>⚡ 切換詳情</h3>
              {selectedSwitch ? (
                <p>切換 {selectedSwitch} 詳情</p>
              ) : (
                <p style={{ color: 'var(--text-muted' }}>點擊切換查看詳情</p>
              )}
            </div>
            <div className="detail-card">
              <h3>📊 路徑配置</h3>
              {selectedPath ? (
                <p>路徑 {selectedPath} 配置</p>
              ) : (
                <p style={{ color: 'var(--text-muted' }}>點擊路徑查看配置</p>
              )}
            </div>
          </div>
        </div>

        {/* 新聞面板區域 - 待實現 */}
        <aside className="news-panel" id="newsPanel">
          <div className="news-header">
            📰 新聞事件流
            <span className="news-count">{data.news.length} 條</span>
          </div>
          <div className="news-list">
            {data.news.slice(0, 5).map((news, index) => (
              <div key={index} className="news-item">
                <div className="news-date">{news.date}</div>
                <div className="news-title">{news.title}</div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="dashboard-footer">
        ⚠️ 僅供參考，不構成投資建議 | 數據來源：BLS、BEA、FRED、Yahoo Finance
      </footer>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {isDebugMode && <DebugPanel />}
    </div>
  );
};

export default Dashboard;
