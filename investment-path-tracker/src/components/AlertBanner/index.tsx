// ==========================================
// 警報橫幅組件
// ==========================================

import React, { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import './AlertBanner.css';

export const AlertBanner: React.FC = () => {
  const { investmentData } = useDataStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!investmentData?.alert || !investmentData.alert.active || isDismissed) {
    return null;
  }

  const alert = investmentData.alert;

  return (
    <AnimatePresence>
      <motion.div
        className={`alert-banner alert-${alert.level}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <span className="alert-icon">⚠️</span>
        <div className="alert-content">
          <strong>{alert.title}</strong>
          <span className="alert-time"> {alert.timestamp.split('T')[0].replace(/-/g, '-')} {alert.timestamp.split('T')[1]?.substring(0, 5)}</span>
          <p>{alert.message}</p>
          <div className="alert-action">
            <strong>當前決策：</strong>{alert.action}
          </div>
        </div>
        <button
          className="alert-dismiss"
          onClick={() => setIsDismissed(true)}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
