// ==========================================
// 模糊鎖定組件 — hover 顯示升級引導，風格克制
// ==========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumStore } from '../../store/usePremiumStore';
import './BlurLock.css';

interface BlurLockProps {
  children: React.ReactNode;
  /** 已解鎖時直接渲染子內容 */
  unlocked?: boolean;
  /** 升級提示文案 */
  reason?: string;
  /** 觸發來源，用於 analytics */
  anchor?: 'path' | 'switch' | 'news';
  /** 模糊強度 */
  blur?: 'soft' | 'hard';
  /** 是否顯示輪廓（讓用戶感知內容存在） */
  showOutline?: boolean;
}

export const BlurLock: React.FC<BlurLockProps> = ({
  children,
  unlocked = false,
  reason = '升級 Pro 解鎖此內容',
  anchor = 'path',
  blur = 'hard',
  showOutline = true,
}) => {
  const { showUpgradePrompt } = usePremiumStore();
  const [hovered, setHovered] = useState(false);

  if (unlocked) return <>{children}</>;

  return (
    <div
      className={`blur-lock-wrap ${showOutline ? 'blur-lock-outline' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => showUpgradePrompt(reason, anchor)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && showUpgradePrompt(reason, anchor)}
      aria-label={reason}
    >
      {/* 模糊內容層 */}
      <div className={`blur-lock-content blur-${blur}`} aria-hidden="true">
        {children}
      </div>

      {/* Hover 升級提示浮層 */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="blur-lock-hover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="blur-lock-badge">
              <span className="blur-lock-icon">💎</span>
              <span className="blur-lock-text">Pro</span>
            </div>
            <div className="blur-lock-hint">{reason}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 靜態鎖圖標（不 hover 時） */}
      {!hovered && (
        <div className="blur-lock-static">
          <span className="blur-lock-static-icon">🔒</span>
        </div>
      )}
    </div>
  );
};
