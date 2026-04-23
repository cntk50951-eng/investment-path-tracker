import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';
import { useInitialDataFetch } from '../../../hooks/useInvestmentData';

const SEVERITY_MAP: Record<string, { icon: string; dotClass: string }> = {
  critical: { icon: 'trending_down', dotClass: 'critical' },
  medium: { icon: 'policy', dotClass: 'neutral' },
  positive: { icon: 'trending_up', dotClass: 'positive' },
};

const PATH_COLORS: Record<string, string> = {
  a: '#43A047', b: '#EF6C00', c: '#E53935', d: '#8E24AA', e: '#D81B60',
  hka: '#43A047', hkb: '#EF6C00', hkc: '#E53935', hkd: '#8E24AA', hke: '#D81B60',
};

const PATH_LABELS: Record<string, string> = {
  a: 'Goldilocks', b: 'Stagflation', c: 'Hard Landing', d: 'Black Swan', e: 'Re-inflation',
  hka: 'Goldilocks', hkb: 'Stagflation', hkc: 'Hard Landing', hkd: 'Black Swan', hke: 'Re-inflation',
};

const NewsStreamV3: React.FC = () => {
  const news = useDataStore(s => s.news);
  const switches = useDataStore(s => s.switches);
  const selectNews = useDataStore(s => s.selectNews);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const { loadMoreNews } = useInitialDataFetch();
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const newsList = useMemo(() => {
    if (!news) return [];
    const filtered = currentMarket === 'HK'
      ? news.filter((n: any) => !n.market || n.market === 'HK')
      : news.filter((n: any) => !n.market || n.market === 'US');
    return filtered.slice(0, visibleCount);
  }, [news, currentMarket, visibleCount]);

  const totalAvailable = useMemo(() => {
    if (!news) return 0;
    return currentMarket === 'HK'
      ? news.filter((n: any) => !n.market || n.market === 'HK').length
      : news.filter((n: any) => !n.market || n.market === 'US').length;
  }, [news, currentMarket]);

  const getRelPaths = (item: any): string[] => {
    const paths: string[] = [];
    if (item.relatedPaths && item.relatedPaths.length > 0) {
      item.relatedPaths.forEach((p: string) => { if (!paths.includes(p)) paths.push(p); });
    }
    if (item.affects && item.affects.length > 0) {
      item.affects.forEach((a: string) => {
        const sw: any = switches?.[a];
        if (sw) {
          if (!paths.includes(sw.from)) paths.push(sw.from);
          if (!paths.includes(sw.to)) paths.push(sw.to);
        }
      });
    }
    return paths;
  };

  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
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

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMoreNews();
      setVisibleCount(prev => prev + 8);
    } catch {
      setVisibleCount(prev => prev + 8);
    } finally {
      setLoadingMore(false);
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
          const iconName = severity === 'critical' ? 'trending_down' : severity === 'positive' ? 'trending_up' : 'policy';
          const relPaths = getRelPaths(item);
          const primaryPath = relPaths[0] || '';
          const borderColor = PATH_COLORS[primaryPath] || (severity === 'critical' ? '#D81B60' : severity === 'positive' ? '#43A047' : '#767586');

          return (
            <div
              key={item.id || idx}
              className="v3-news-item"
              onClick={() => selectNews(item)}
              style={{ borderLeft: `4px solid ${borderColor}` }}
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
                {/* Severity + Path color tags */}
                <div className="v3-news-tags">
                  {/* Severity tag */}
                  {severity === 'critical' && (
                    <span className="v3-news-tag critical">HIGH IMPACT</span>
                  )}
                  {severity === 'positive' && (
                    <span className="v3-news-tag positive">POSITIVE</span>
                  )}
                  {/* Path tags */}
                  {relPaths.slice(0, 3).map((pathId: string, i: number) => {
                    const color = PATH_COLORS[pathId] || '#767586';
                    const label = PATH_LABELS[pathId] || pathId.toUpperCase();
                    return (
                      <span
                        key={i}
                        className="v3-news-path-tag"
                        style={{
                          background: `${color}15`,
                          color: color,
                          borderColor: `${color}40`,
                        }}
                      >
                        <span className="v3-news-path-dot" style={{ background: color }} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="v3-news-footer">
        <button
          className="v3-news-load-btn"
          onClick={handleLoadMore}
          disabled={loadingMore || visibleCount >= totalAvailable}
          style={{ opacity: visibleCount >= totalAvailable ? 0.5 : 1 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {loadingMore ? 'progress_activity' : 'expand_more'}
          </span>
          {loadingMore ? 'Loading...' : visibleCount >= totalAvailable ? 'All Loaded' : 'Load More'}
        </button>
      </div>
    </div>
  );
};

export { NewsStreamV3 };