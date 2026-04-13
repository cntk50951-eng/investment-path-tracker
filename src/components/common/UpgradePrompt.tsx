// ==========================================
// 升級引導組件 — 輕量 inline 浮層，不阻斷瀏覽
// 只在用戶主動點擊鎖定內容時出現
// ==========================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumStore } from '../../store/usePremiumStore';
import './UpgradePrompt.css';

export const UpgradePrompt: React.FC = () => {
  const { upgradePrompt, hideUpgradePrompt } = usePremiumStore();
  const { visible, reason } = upgradePrompt;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="upgrade-prompt"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="upgrade-prompt-inner">
            <div className="upgrade-icon">💎</div>
            <div className="upgrade-body">
              <div className="upgrade-reason">{reason}</div>
              <div className="upgrade-sub">Pro 會員 · $29/月 · 首 7 天免費</div>
            </div>
            <div className="upgrade-actions">
              <button className="upgrade-cta" onClick={() => {/* TODO: 接入支付 */}}>
                升級
              </button>
              <button className="upgrade-dismiss" onClick={hideUpgradePrompt}>
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
