import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';

const SEVERITY_MAP: Record<string, { icon: string; dotClass: string }> = {
  critical: { icon: 'trending_down', dotClass: 'critical' },
  medium: { icon: 'policy', dotClass: 'neutral' },
  positive: { icon: 'trending_up', dotClass: 'positive' },
};

const NEWS_ICONS: Record<string, string> = {
  monetary_policy: 'policy',
  inflation: 'trending_down',
  trade_war: 'gavel',
  geopolitics: 'public',
  earnings: 'analytics',
  default: 'newspaper',
};

const NewsStreamV3: React.FC = () => {
  const news = useDataStore(s => s.news);
  const switches = useDataStore(s => s.switches);
  const selectNews = useDataStore(s => s.selectNews);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const [visibleCount, setVisibleCount] = useState(8);

  const newsList = useMemo(() => {
    if (!news) return [];
    const filtered = currentMarket === 'HK'
      ? news.filter((n: any) => !n.market || n.market === 'HK')
      : news.filter((n: any) => !n.market || n.market === 'US');
    return filtered.slice(0, visibleCount);
  }, [news, currentMarket, visibleCount]);

  const resolveTagName = (affects: string | string[]): string => {
    if (!affects || (Array.isArray(affects) && affects.length === 0)) return '';
    const id = Array.isArray(affects) ? affects[0] : affects;
    const sw: any = switches?.[id];
    if (sw) return `${sw.from?.toUpperCase()} → ${sw.to?.toUpperCase()}`;
    return id;
  };

  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (!news || newsList.length === 0) {
    return (
      <div className="v3-card v3-news-card">
        <div className="v3-news-header-inner">
          <h3 className="v3-news-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--v3-primary)', fontSize: 20 }}>stream</span>
            Event Stream
          </h3>
          <div className="v3-news-live">
            <span className="v3-news-live-dot" />
            <span className="v3-news-live-text">Live</span>
          </div>
        </div>
        <div className="v3-card-body v3-empty-state">
          <span className="material-symbols-outlined">newspaper</span>
          <p>暫無新聞數據</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v3-card v3-news-card">
      <div className="v3-news-header-inner">
        <h3 className="v3-news-title">
          <span className="material-symbols-outlined" style={{ color: 'var(--v3-primary)', fontSize: 20 }}>stream</span>
          Event Stream
        </h3>
        <div className="v3-news-live">
          <span className="v3-news-live-dot" />
          <span className="v3-news-live-text">Live</span>
        </div>
      </div>

      <div className="v3-news-list">
        {newsList.map((item: any, idx: number) => {
          const severity = item.severity || 'medium';
          const severityInfo = SEVERITY_MAP[severity] || SEVERITY_MAP.medium;
          const iconName = NEWS_ICONS[item.tags?.[0]] || severityInfo.icon;
          const tags: string[] = [];
          if (item.affects && item.affects.length > 0) {
            item.affects.forEach((a: string) => {
              const name = resolveTagName(a);
              if (name) tags.push(name);
            });
          }
          if (severity === 'critical') tags.push('High Impact');

          return (
            <div
              key={item.id || idx}
              className="v3-news-item"
              onClick={() => selectNews(item)}
            >
              <div className={`v3-news-dot ${severityInfo.dotClass}`}>
                <span className="material-symbols-outlined">{iconName}</span>
              </div>
              <div className="v3-news-content">
                <div className="v3-news-item-header">
                  <span className="v3-news-item-title">{item.title}</span>
                  <span className="v3-news-item-time">{formatTime(item.date || item.publishedTime || '')}</span>
                </div>
                <p className="v3-news-item-desc">{item.summary || item.impact || ''}</p>
                {tags.length > 0 && (
                  <div className="v3-news-tags">
                    {tags.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className={`v3-news-tag ${(severity === 'critical' && i === tags.length - 1) ? 'severity' : ''}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {news && news.length > visibleCount && (
        <div className="v3-news-footer">
          <button
            className="v3-news-load-btn"
            onClick={() => setVisibleCount(prev => prev + 6)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export { NewsStreamV3 };