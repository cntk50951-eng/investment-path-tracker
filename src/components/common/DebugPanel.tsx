// ==========================================
// 調試面板組件（增強版）
// ==========================================

import React from 'react';
import { useDebugStore } from '../../store/useDebugStore';
import './DebugPanel.css';

export const DebugPanel: React.FC = () => {
  const {
    isDebugMode, canToggleDebug,
    mockPremium, useMockData, mockApiLatency, mockApiError,
    showBlurDebug, showPaywallPreview, showComplianceHighlight,
    toggleDebug, toggleMockPremium, setMockApiLatency,
    toggleMockApiError, toggleBlurDebug, togglePaywallPreview,
    toggleComplianceHighlight, resetAll,
  } = useDebugStore();

  if (!canToggleDebug) return null;

  return (
    <div className={`debug-panel ${!isDebugMode ? 'debug-panel-collapsed' : ''}`}>
      <div className="debug-panel-header">
        <h3>🔧 Debug Mode</h3>
        <button onClick={toggleDebug} className="debug-toggle-btn">
          {isDebugMode ? '▼' : '▲'}
        </button>
      </div>

      {isDebugMode && (
        <div className="debug-panel-content">
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
