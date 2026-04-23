import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInitialDataFetch } from '../hooks/useInvestmentData';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useDebugStore } from '../store/useDebugStore';
import { useMarketStore } from '../store/useMarketStore';
import { MacroBarV3 } from '../components/v3/MacroBarV3/MacroBarV3';
import { FlowDiagramV3 } from '../components/v3/FlowDiagramV3/FlowDiagramV3';
import { SwitchTableV3 } from '../components/v3/SwitchTableV3/SwitchTableV3';
import { NewsStreamV3 } from '../components/v3/NewsStreamV3/NewsStreamV3';
import { DetailPanelV3 } from '../components/v3/DetailPanelV3/DetailPanelV3';
import { ComplianceFooter } from '../components/common/ComplianceFooter';
import { NewsChat } from '../components/NewsChat/NewsChat';
import './DashboardV3.css';

const DashboardV3: React.FC = () => {
  const { refresh } = useInitialDataFetch();
  const loadingModules = useDataStore(s => s.loadingModules);
  const error = useDataStore(s => s.error);
  const { user, isGuest, logout } = useAuthStore();
  const { isDebugMode, debugVisibilityMode, toggleDebugVisibility } = useDebugStore();
  const { currentMarket, setMarket } = useMarketStore();
  const navigate = useNavigate();
  const location = useLocation();
  const activeNav = location.pathname === '/v3' ? 'dashboard' : 'dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="v3-dashboard">
      {isDebugMode && (
        <div className="v3-debug-banner">
          🔧 DEBUG MODE — {debugVisibilityMode === 'all' ? 'All features visible' : 'Subscription only'}
          {toggleDebugVisibility && (
            <button
              onClick={toggleDebugVisibility}
              style={{ marginLeft: 12, padding: '2px 8px', background: 'rgba(70, 72, 212, 0.15)', border: '1px solid rgba(70, 72, 212, 0.3)', borderRadius: 4, color: '#4648d4', cursor: 'pointer', fontSize: '0.7em' }}
            >
              Toggle: {debugVisibilityMode === 'all' ? 'Show All' : 'Sub Only'}
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header className="v3-header">
        <div className="v3-header-inner">
          <div className="v3-brand" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined v3-brand-icon">hexagon</span>
            <span className="v3-brand-text">Aether Command</span>
          </div>

          <nav className="v3-nav">
            <a className={`v3-nav-link ${activeNav === 'dashboard' ? 'active' : ''}`} href="#">Dashboard</a>
            <a className="v3-nav-link" href="#">Timeline</a>
          </nav>

          <div className="v3-header-actions">
            <div className="v3-market-toggle">
              <button
                className={`v3-market-btn ${currentMarket === 'US' ? 'active' : ''}`}
                onClick={() => setMarket('US')}
              >
                US
              </button>
              <button
                className={`v3-market-btn ${currentMarket === 'HK' ? 'active' : ''}`}
                onClick={() => setMarket('HK')}
              >
                HK
              </button>
            </div>

            <button className="v3-icon-btn" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="v3-notification-dot" />
            </button>

            <button className="v3-icon-btn" title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="v3-user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    <span>{user.displayName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button className="v3-icon-btn" onClick={handleLogout} title="Logout">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            ) : isGuest ? (
              <button className="v3-login-btn" onClick={() => navigate('/login')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
                Login
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div style={{ padding: '80px 24px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--v3-error)' }}>error_outline</span>
          <h3 style={{ color: 'var(--v3-error)', marginTop: 8 }}>Load Failed</h3>
          <p style={{ color: 'var(--v3-on-surface-variant)', marginBottom: 16 }}>{error}</p>
          <button
            className="v3-news-load-btn"
            style={{ maxWidth: 200, margin: '0 auto' }}
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!error && (
        <main className="v3-main">
          {/* Macro Bar */}
          <MacroBarV3 />

          {/* Content Grid */}
          <div className="v3-grid">
            {/* Left/Center Content */}
            <div className="v3-content">
              {loadingModules.paths ? (
                <div className="v3-card" style={{ padding: 24 }}>
                  <div className="v3-skeleton v3-skeleton-title" />
                  <div className="v3-skeleton v3-skeleton-text" style={{ width: '70%' }} />
                  <div style={{ height: 220, marginTop: 16 }} className="v3-skeleton" />
                </div>
              ) : (
                <FlowDiagramV3 />
              )}

              {loadingModules.paths ? (
                <div className="v3-card" style={{ padding: 24 }}>
                  <div className="v3-skeleton v3-skeleton-title" />
                  <div style={{ height: 120, marginTop: 16 }} className="v3-skeleton" />
                </div>
              ) : (
                <SwitchTableV3 />
              )}
            </div>

            {/* Right Sidebar */}
            <NewsStreamV3 />
          </div>
        </main>
      )}

      {/* Detail Panel Overlay */}
      <DetailPanelV3 />

      {/* Shared Components */}
      <ComplianceFooter />
      <NewsChat variant="v3" />

      {/* Version Badge */}
      <a className="v3-version-badge" href="/" title="Switch to V2">V3 β</a>
    </div>
  );
};

export default DashboardV3;