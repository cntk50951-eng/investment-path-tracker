// ==========================================
// 付費牆 Modal 組件
// ==========================================

import React from 'react';
import { motion } from 'framer-motion';
import { usePremiumStore } from '../../store/usePremiumStore';
import './PaywallModal.css';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose }) => {
  const { hideUpgradePrompt } = usePremiumStore();

  if (!isOpen) return null;

  const handleClose = () => {
    hideUpgradePrompt();
    onClose();
  };

  return (
    <motion.div
      className="paywall-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="paywall-content"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button className="paywall-close" onClick={handleClose}>✕</button>

        <div className="paywall-header">
          <h2>🔒 解鎖完整投資情報</h2>
        </div>

        <div className="paywall-section">
          <h3>免費賬戶限制</h3>
          <ul className="paywall-list">
            <li className="limitation">僅查看當前路徑 (B 滯脹迷霧)</li>
            <li className="limitation">路徑切換信號模糊</li>
            <li className="limitation">新聞摘要限制 (前 15 字)</li>
            <li className="limitation">無法查看板塊配置詳情</li>
          </ul>
        </div>

        <div className="paywall-section">
          <h3>Pro 會員解鎖</h3>
          <ul className="paywall-list">
            <li className="benefit">5 條路徑完整詳情 + 概率實時追蹤</li>
            <li className="benefit">12 條切換信號進度 (提前 1-2 週預警)</li>
            <li className="benefit">完整新聞分析 + 影響路徑標籤</li>
            <li className="benefit">人猿團隊獨家解讀 + 倉位建議</li>
            <li className="benefit">郵件提醒 (CPI/非農/FOMC 前推送)</li>
          </ul>
        </div>

        <div className="pricing-preview">
          <div className="price">$29<span>/月</span></div>
          <p>首 7 天免費試用 · 隨時取消</p>
        </div>

        <div className="paywall-actions">
          <button className="primary">🚀 免費試用 7 天</button>
          <button className="secondary">查看定價方案</button>
        </div>

        <div className="paywall-dismiss">
          <a href="#" onClick={(e) => { e.preventDefault(); handleClose(); }}>
            暫時不需要，返回面板
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};
