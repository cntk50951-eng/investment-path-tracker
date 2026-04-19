import React from 'react';
import { FULL_FOOTER, MAINLAND_CHINA_RESTRICTION } from '../../utils/complianceTexts';
import './ComplianceFooter.css';

export const ComplianceFooter: React.FC = () => {
  return (
    <footer className="compliance-footer">
      <div className="compliance-footer-inner">
        <div className="footer-row">
          <div className="footer-col">
            <div className="footer-label">⚠️ 重要聲明</div>
            <div className="footer-text">{FULL_FOOTER.sections[0].content}</div>
          </div>
          <div className="footer-col">
            <div className="footer-label">📋 監管披露</div>
            <div className="footer-text">{FULL_FOOTER.sections[1].content}</div>
          </div>
        </div>
        <div className="footer-row">
          <div className="footer-col">
            <div className="footer-label">🌏 服務地區</div>
            <div className="footer-text" style={{ color: '#f59e0b' }}>{MAINLAND_CHINA_RESTRICTION.warning}</div>
          </div>
          <div className="footer-col">
            <div className="footer-label">⚠️ 風險提示</div>
            <div className="footer-text">{FULL_FOOTER.sections[3].content}</div>
          </div>
        </div>
        <div className="footer-copyright">{FULL_FOOTER.copyright}</div>
      </div>
    </footer>
  );
};
