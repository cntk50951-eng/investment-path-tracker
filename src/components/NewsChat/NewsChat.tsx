// ==========================================
// AI 新聞詢問組件 — 新聞獵豹 AI 助手
// 只能基於系統收集的新聞數據回答問題
// ==========================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMarketStore } from '../../store/useMarketStore';
import './NewsChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cached?: boolean;
  newsCount?: number;
  totalNews?: number;
  keywords?: string[];
  subQueries?: string[];
  intent?: string;
}

export const NewsChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentMarket = useMarketStore(s => s.currentMarket);

  const toggleQueryExpand = (msgIdx: number) => {
    setExpandedQueries(prev => {
      const next = new Set(prev);
      if (next.has(msgIdx)) {
        next.delete(msgIdx);
      } else {
        next.add(msgIdx);
      }
      return next;
    });
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          market: currentMarket,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const answerText = data.answer?.trim() || '抱歉，未能獲取到回應，請稍後再試。';
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: answerText,
          timestamp: new Date(),
          cached: data.cached,
          newsCount: data.newsCount,
          totalNews: data.totalNews,
          keywords: data.keywords,
          subQueries: data.subQueries,
          intent: data.intent,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `❌ ${data.error?.message || '查詢失敗，請稍後重試'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ 網絡錯誤，請檢查連接後重試',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    '最近有哪些 critical 級別的新聞？',
    '影響金髮女孩路徑的新聞有哪些？',
    '總結本週最重要的市場事件',
    '有哪些關於利率的新聞？',
  ];

  return (
    <>
      <button
        className={`news-chat-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 新聞助手"
      >
        <span className="material-symbols-outlined">
          {isOpen ? 'close' : 'psychology'}
        </span>
      </button>

      {isOpen && (
        <div className="news-chat-panel glass-panel">
          <div className="news-chat-header">
            <div className="news-chat-header-left">
              <span className="material-symbols-outlined">psychology</span>
              <div>
                <h3>新聞獵豹 AI</h3>
                <span className="news-chat-subtitle">基於 {currentMarket} 市場新聞數據</span>
              </div>
            </div>
            <button className="news-chat-close" onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="news-chat-messages">
            {messages.length === 0 && (
              <div className="news-chat-welcome">
                <div className="news-chat-welcome-icon">🐆</div>
                <p>你好！我是新聞獵豹 AI 助手。</p>
                <p>我可以基於系統收集的財經新聞回答你的問題。請嘗試以下提問：</p>
                <div className="news-chat-suggestions">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="news-chat-suggestion"
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`news-chat-message news-chat-${msg.role}`}>
                <div className="news-chat-message-avatar">
                  {msg.role === 'assistant' ? '🐆' : '👤'}
                </div>
                <div className="news-chat-message-content">
                  {msg.role === 'assistant' ? (
                    <div className="news-chat-message-text news-chat-markdown">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="news-chat-message-text">{msg.content}</div>
                  )}
                  <div className="news-chat-message-meta">
                    {msg.cached && <span className="news-chat-cached">⚡ 快取回應</span>}
                    {msg.newsCount !== undefined && msg.totalNews !== undefined && (
                      <span className="news-chat-count">
                        📰 使用 {msg.newsCount}/{msg.totalNews} 條新聞
                      </span>
                    )}
                    {msg.intent && (
                      <span className="news-chat-intent">
                        🎯 {msg.intent}
                      </span>
                    )}
                    {msg.subQueries && msg.subQueries.length > 0 && (
                      <button
                        className="news-chat-subqueries"
                        onClick={() => toggleQueryExpand(idx)}
                      >
                        🔍 {msg.subQueries.length} 個搜索方向
                        <span className="news-chat-expand-icon">
                          {expandedQueries.has(idx) ? '▾' : '▸'}
                        </span>
                      </button>
                    )}
                  </div>
                  {expandedQueries.has(idx) && msg.subQueries && msg.subQueries.length > 0 && (
                    <div className="news-chat-subqueries-detail">
                      {msg.subQueries.map((sq, i) => (
                        <div key={i} className="news-chat-subquery-item">
                          <span className="news-chat-subquery-num">{i + 1}</span>
                          <span className="news-chat-subquery-text">{sq}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="news-chat-message news-chat-assistant">
                <div className="news-chat-message-avatar">🐆</div>
                <div className="news-chat-message-content">
                  <div className="news-chat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="news-chat-input-area">
            <textarea
              ref={inputRef}
              className="news-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入關於新聞的問題..."
              rows={2}
              disabled={isLoading}
            />
            <button
              className="news-chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>

          <div className="news-chat-footer">
            ⚠️ AI 基於新聞數據回答，不構成投資建議
          </div>
        </div>
      )}
    </>
  );
};