// ==========================================
// 路徑解讀說明組件（美股/港股共用）
// ==========================================

import React, { useState } from 'react';
import './PathLegend.css';

export const PathLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="path-legend">
      <button
        className="path-legend-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="路徑解讀說明"
      >
        <span className="path-legend-icon">📖</span>
        <span className="path-legend-label">路徑解讀說明</span>
        <span className={`path-legend-arrow ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {isOpen && (
        <div className="path-legend-content">
          <div className="legend-section">
            <div className="legend-title">⚡ 基準路徑（⭐ 標記）</div>
            <div className="legend-desc">
              標記為 ⭐ 的路徑是<strong>當前基準路徑</strong>，代表目前宏觀環境最符合的情景。
              基準路徑位於流程圖中央，是所有切換的<strong>出發點</strong>。
            </div>
            <div className="legend-note">
              ⚠️ 基準路徑不一定是概率最高的路徑。當其他路徑的概率接近或超過基準路徑時，
              表示宏觀環境正在發生變化，切換信號需要密切關注。
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-title">📊 概率含義</div>
            <div className="legend-desc">
              每條路徑的概率表示<strong>當前宏觀環境匹配該情景的可能性</strong>。
              概率之和為 100%，代表所有可能的宏觀情景。
            </div>
            <div className="legend-examples">
              <div className="legend-example">
                <span className="example-badge" style={{ background: '#fbbf2420', color: '#fbbf24' }}>⭐ B 35%</span>
                <span>基準路徑，但目前概率低於 E</span>
              </div>
              <div className="legend-example">
                <span className="example-badge" style={{ background: '#f472b620', color: '#f472b6' }}>🔺 E 37%</span>
                <span>概率最高，表示切換方向最可能的目標</span>
              </div>
            </div>
            <div className="legend-note">
              概率基於確認信號的完成度動態調整，非固定預測。
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-title">🔀 路徑切換</div>
            <div className="legend-desc">
              流程圖中的<strong>箭頭</strong>表示從基準路徑到目標路徑的切換。
              箭頭越粗、越亮，表示切換進度越高（確認信號完成越多）。
            </div>
            <div className="legend-tiers">
              <div className="legend-tier">
                <span className="tier-dot" style={{ background: '#475569' }}></span>
                <span>&lt;35% 噪音 — 不足以行動</span>
              </div>
              <div className="legend-tier">
                <span className="tier-dot" style={{ background: '#fbbf24' }}></span>
                <span>35-50% 早期預警 — 方向信號出現</span>
              </div>
              <div className="legend-tier">
                <span className="tier-dot" style={{ background: '#f97316' }}></span>
                <span>50-60% 初步確認 — 宏觀特徵開始顯現</span>
              </div>
              <div className="legend-tier">
                <span className="tier-dot" style={{ background: '#f87171' }}></span>
                <span>60-75% 強信號 — 多數確認已觸發</span>
              </div>
              <div className="legend-tier">
                <span className="tier-dot" style={{ background: '#f472b6' }}></span>
                <span>&gt;75% 路徑鎖定 — 新路徑成為投資主線</span>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-title">✅✅❌ 確認信號</div>
            <div className="legend-desc">
              每條切換有一組<strong>確認信號</strong>，是判斷路徑切換是否發生的客觀指標：
            </div>
            <div className="legend-signals">
              <div className="legend-signal yes">
                <span>✅ 已確認</span> — 門檻已達成
              </div>
              <div className="legend-signal near">
                <span>🔶 接近</span> — 方向正確，接近門檻
              </div>
              <div className="legend-signal no">
                <span>❌ 未觸發</span> — 條件不具備
              </div>
            </div>
            <div className="legend-note">
              切換進度 = (已確認×1 + 接近×0.5) / 總信號數
            </div>
          </div>

          <div className="legend-disclaimer">
            ⚠️ 以上內容為宏觀經濟環境研究與情景分析，所有路徑判斷及板塊特徵描述均基於歷史數據規律，
            不構成任何投資建議，亦不針對任何讀者的具體持倉或財務狀況。
          </div>
        </div>
      )}
    </div>
  );
};