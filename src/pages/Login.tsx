// ==========================================
// 登錄頁面 — 支持遊客訪問 + Google 登錄切換帳戶
// ==========================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleLoginButton } from '../components/common/GoogleLoginButton';
import { ComplianceBanner } from '../components/common/ComplianceBanner';
import { motion } from 'framer-motion';
import './Login.css';

export const Login: React.FC = () => {
  const { user, error, enterAsGuest } = useAuthStore();
  const navigate = useNavigate();

  // 如果已登錄，跳轉到主頁
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h1>🦍 2026 美股投資路徑切換中心</h1>
          <p className="login-subtitle">
            宏觀研究 · 路徑追蹤 · 風險監測
          </p>
        </div>

        {/* 合規提示橫幅 */}
        <ComplianceBanner />

        <div className="login-content">
          {/* 功能介紹 */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>5 條投資路徑</h3>
              <p>金髮女孩、滯脹迷霧、硬著陸、黑天鵝、再通膨</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>12 條切換追蹤</h3>
              <p>實時監控路徑切換進度與確認信號</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📰</div>
              <h3>新聞事件流</h3>
              <p>嚴重性分級與影響路徑標籤</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚠️</div>
              <h3>閾值預警系統</h3>
              <p>5 層級預警（噪音/預警/確認/強信號/鎖定）</p>
            </div>
          </div>

          {/* 登錄區域 */}
          <div className="login-section">
            <h2>歡迎登入</h2>
            <p className="login-description">
              使用 Google 帳戶快速登入，開始追蹤投資路徑
            </p>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <GoogleLoginButton size="lg" text="使用 Google 帳戶登入" />

            <div className="login-divider">
              <span>或</span>
            </div>

            <button className="guest-btn" onClick={() => { enterAsGuest(); navigate('/'); }}>
              🧑‍💻 以遊客身份繼續
            </button>
            <p className="guest-hint">遊客可查看所有免費內容，訂閱 Pro 功能時需要登入</p>

            <div className="login-benefits">
              <h4>免費註冊即可使用：</h4>
              <ul>
                <li>✅ 查看當前投資路徑</li>
                <li>✅ 宏觀數據實時追蹤</li>
                <li>✅ 基礎新聞事件流</li>
                <li>✅ AI 新聞助手查詢</li>
              </ul>
            </div>

            <div className="pro-upsell">
              <h4>💎 Pro 會員解鎖：</h4>
              <ul>
                <li>✨ 5 條路徑完整詳情 + 概率實時追蹤</li>
                <li>✨ 12 條切換信號進度 (提前 1-2 週預警)</li>
                <li>✨ 完整新聞分析 + 影響路徑標籤</li>
                <li>✨ 深度研究解讀 + 倉位分析</li>
                <li>✨ 郵件提醒 (CPI/非農/FOMC 前推送)</li>
              </ul>
              <p className="pro-price">$29/月 · 首 7 天免費試用</p>
            </div>
          </div>
        </div>

        <footer className="login-footer">
          <div className="footer-disclaimer">
            <p>⚠️ 僅供參考，不構成投資建議</p>
            <p>🌏 本服務不向中國大陸用戶提供</p>
            <p>📊 數據來源：BLS、BEA、FRED、Yahoo Finance</p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};