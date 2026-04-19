// ==========================================
// 調試面板組件 — 管理員開關：控制所有功能可視 / 僅訂閱可視
// ==========================================

import React from 'react';
import { useDebugStore } from '../../store/useDebugStore';
import { useAuthStore } from '../../store/useAuthStore';
import { isAdminEmail } from '../../store/useAuthStore';
import './DebugPanel.css';

export const DebugPanel: React.FC = () => {
  const {
    isDebugMode, canToggleDebug, isAdmin,
    debugVisibilityMode,
    mockPremium, useMockData, mockApiLatency, mockApiError,
    showBlurDebug, showPaywallPreview, showComplianceHighlight,
    toggleDebug, toggleMockPremium, setMockApiLatency,
    toggleMockApiError, toggleBlurDebug, togglePaywallPreview,
    toggleComplianceHighlight, toggleDebugVisibility, resetAll,
  } = useDebugStore();
  const { user } = useAuthStore();

  // 只有管理員帳戶可以看到完整的調試面板
  const isUserAdmin = isAdmin || isAdminEmail(user?.email);

  if (!canToggleDebug) return null;

  return (
    <div className={`debug-panel ${!isDebugMode ? 'debug-panel-collapsed' : ''}`}>
      <div className="debug-panel-header">
        <h3>🔧 Debug Mode {isUserAdmin ? '(Admin)' : ''}</h3>
        <button onClick={toggleDebug} className="debug-toggle-btn">
          {isDebugMode ? '▼' : '▲'}
        </button>
      </div>

      {isDebugMode && (
        <div className="debug-panel-content">
          {/* 管理員專屬：可見性模式開關 */}
          {isUserAdmin && (
            <div className="debug-section debug-admin-section">
              <div className="debug-admin-title">👑 管理員開關</div>
              <label className="debug-label">
                <span>可見性模式：{debugVisibilityMode === 'all' ? '🔓 所有功能可視' : '🔐 僅訂閱可視'}</span>
                <button 
                  className="debug-visibility-btn"
                  onClick={toggleDebugVisibility}
                >
                  切換為 {debugVisibilityMode === 'all' ? '訂閱可視' : '全部可視'}
                </button>
              </label>
            </div>
          )}

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={mockPremium} onChange={toggleMockPremium} />
              <span>💎 Mock Premium</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={showComplianceHighlight} onChange={toggleComplianceHighlight} />
              <span>📋 合規高亮</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={useMockData} onChange={() => {}} disabled />
              <span>📊 Use Mock Data</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={mockApiError} onChange={toggleMockApiError} />
              <span>⚠️ Mock API Error</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={showBlurDebug} onChange={toggleBlurDebug} />
              <span>👁️ Show Blur Debug</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <input type="checkbox" checked={showPaywallPreview} onChange={togglePaywallPreview} />
              <span>🔒 Paywall Preview</span>
            </label>
          </div>

          <div className="debug-section">
            <label className="debug-label">
              <span>⏱️ API Latency: {mockApiLatency}ms</span>
              <input
                type="range" min="0" max="3000" step="100"
                value={mockApiLatency}
                onChange={(e) => setMockApiLatency(Number(e.target.value))}
                className="debug-slider"
              />
            </label>
          </div>

          <div className="debug-section">
            <button onClick={resetAll} className="debug-reset-btn">🔄 Reset All</button>
          </div>

          <div className="debug-shortcuts">
            <strong>快捷鍵:</strong>
            <div>Ctrl+Shift+D: Toggle Debug</div>
            <div>Ctrl+Shift+P: Toggle Premium</div>
            <div>Ctrl+Shift+R: Reset All</div>
            <div>URL: ?debug=true</div>
          </div>
        </div>
      )}
    </div>
  );
};