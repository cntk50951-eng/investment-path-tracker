// ==========================================
// 合規提示橫幅組件（頁面頂部明顯提示）
// ==========================================

import React from 'react';
import './ComplianceBanner.css';

export const ComplianceBanner: React.FC = () => {
  return (
    <div className="compliance-banner">
      <div className="compliance-banner-content">
        {/* 左側：警告圖標 */}
        <div className="compliance-banner-icon">⚠️</div>
        
        {/* 中間：提示內容 */}
        <div className="compliance-banner-text">
          <div className="compliance-banner-title">
            重要合規提示
          </div>
          <div className="compliance-banner-items">
            <span className="compliance-banner-item">
              <strong>非投資建議：</strong>本內容僅供資訊參考，不構成任何投資建議、要約或招攬
            </span>
            <span className="compliance-banner-divider">|</span>
            <span className="compliance-banner-item">
              <strong>地區限制：</strong>本服務不向中國大陸居民或身處中國大陸人士提供
            </span>
            <span className="compliance-banner-divider">|</span>
            <span className="compliance-banner-item">
              <strong>風險自負：</strong>投資涉及風險，證券價格可升可跌
            </span>
          </div>
        </div>
        
        {/* 右側：關閉按鈕 */}
        <button 
          className="compliance-banner-close"
          onClick={(e) => {
            const banner = (e.target as HTMLElement).closest('.compliance-banner');
            if (banner) {
              (banner as HTMLElement).style.display = 'none';
              localStorage.setItem('complianceBannerDismissed', 'true');
            }
          }}
          title="關閉提示"
        >
          ✕
        </button>
      </div>
      
      {/* 二級提示（可展開） */}
      <details className="compliance-banner-details">
        <summary className="compliance-banner-summary">
          📋 查看完整合規披露
        </summary>
        <div className="compliance-banner-disclosure">
          <div className="disclosure-grid">
            <div className="disclosure-item">
              <div className="disclosure-item-title">🔒 監管狀態</div>
              <div className="disclosure-item-content">
                本網站並非香港證監會（SFC）持牌機構，不提供受規管的投資顧問服務。內容屬於宏觀經濟研究出版物。
              </div>
            </div>
            <div className="disclosure-item">
              <div className="disclosure-item-title">🌏 用戶資格</div>
              <div className="disclosure-item-content">
                用戶必須年滿 18 歲，非中國大陸居民，且身處於中國大陸以外地區。違反者後果自負。
              </div>
            </div>
            <div className="disclosure-item">
              <div className="disclosure-item-title">⚠️ 風險因素</div>
              <div className="disclosure-item-content">
                過往表現並不代表未來結果。宏觀預測存在不確定性。投資者可能損失部分或全部本金。
              </div>
            </div>
            <div className="disclosure-item">
              <div className="disclosure-item-title">📜 法律依據</div>
              <div className="disclosure-item-content">
                香港《證券及期貨條例》第 103 條 | 中國大陸《外匯管理條例》| SFC 跨境證券服務監管規定
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
