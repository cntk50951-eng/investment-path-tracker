// ==========================================
// 合規頁腳組件（SFC 監管要求）
// ==========================================

import React from 'react';
import { FULL_FOOTER, MAINLAND_CHINA_RESTRICTION } from '../../utils/complianceTexts';
import './ComplianceFooter.css';

export const ComplianceFooter: React.FC = () => {
  return (
    <footer className="compliance-footer">
      {/* 主要免責聲明 */}
      <div className="footer-section">
        <div className="footer-section-title">⚠️ 重要聲明</div>
        <div className="footer-section-content">
          {FULL_FOOTER.sections[0].content}
        </div>
      </div>

      {/* 監管披露 */}
      <div className="footer-section">
        <div className="footer-section-title">📋 監管披露</div>
        <div className="footer-section-content">
          {FULL_FOOTER.sections[1].content}
        </div>
      </div>

      {/* 地區限制 */}
      <div className="footer-section">
        <div className="footer-section-title">🌏 服務地區</div>
        <div className="footer-section-content">
          <span style={{ color: '#f59e0b' }}>{MAINLAND_CHINA_RESTRICTION.warning}</span>
        </div>
      </div>

      {/* 風險警告 */}
      <div className="footer-section">
        <div className="footer-section-title">⚠️ 風險提示</div>
        <div className="footer-section-content">
          {FULL_FOOTER.sections[3].content}
        </div>
      </div>

      {/* 版權信息 */}
      <div className="footer-copyright">
        {FULL_FOOTER.copyright}
      </div>
    </footer>
  );
};
