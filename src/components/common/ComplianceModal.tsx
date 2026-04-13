// ==========================================
// 首次訪問合規提示組件
// ==========================================

import React, { useEffect, useState } from 'react';
import { FIRST_VISIT_MODAL } from '../utils/complianceTexts';
import './ComplianceModal.css';

export const ComplianceModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('complianceAccepted');
    if (!hasAccepted) {
      setShowModal(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('complianceAccepted', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="compliance-modal-overlay">
      <div className="compliance-modal">
        <div className="compliance-modal-header">
          <h2>{FIRST_VISIT_MODAL.title}</h2>
        </div>
        
        <div className="compliance-modal-content">
          <p style={{ whiteSpace: 'pre-line' }}>{FIRST_VISIT_MODAL.content}</p>
        </div>

        <div className="compliance-modal-footer">
          <button className="compliance-accept-btn" onClick={handleAccept}>
            {FIRST_VISIT_MODAL.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
