import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';

function SvgSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 36;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) + 2}`)
    .join(' ');
  const fillPts = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={`dash-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#dash-grad-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const formatValue = (val: number) => {
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
  return val.toFixed(2);
};

interface SparkEntry {
  values: number[];
  latest: number;
  latestYear: number;
  change: number;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('jode-favorites') || '[]'); } catch { return []; }
  });

  const [sparkData, setSparkData] = useState<Map<number, SparkEntry>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      try {
        const newFavs = JSON.parse(localStorage.getItem('jode-favorites') || '[]') as number[];
        setFavorites(newFavs);
      } catch {}
    };
    window.addEventListener('jode-favorites-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('jode-favorites-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const favoriteDatasets = useMemo(
    () => CATALOG_DATA.filter(d => favorites.includes(d.id)),
    [favorites]
  );

  useEffect(() => {
    if (favoriteDatasets.length === 0) { setSparkData(new Map()); return; }
    setLoading(true);
    dataService
      .fetchAll(favoriteDatasets.map(d => d.id))
      .then(allData => {
        const newMap = new Map<number, SparkEntry>();
        favoriteDatasets.forEach(d => {
          const series = allData.get(d.id) || [];
          if (series.length >= 2) {
            const recent = series.slice(-20);
            const latest = recent[recent.length - 1].value;
            const latestYear = recent[recent.length - 1].year;
            const fiveAgo = series.find(v => v.year === latestYear - 5);
            const change = fiveAgo ? ((latest - fiveAgo.value) / Math.abs(fiveAgo.value)) * 100 : 0;
            newMap.set(d.id, { values: recent.map(v => v.value), latest, latestYear, change });
          }
        });
        setSparkData(newMap);
        setLoading(false);
      });
  }, [favoriteDatasets]);

  const removeFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.filter(f => f !== id);
      localStorage.setItem('jode-favorites', JSON.stringify(next));
      window.dispatchEvent(new Event('jode-favorites-changed'));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 pt-8 pb-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">My Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {favorites.length > 0
                  ? `${favorites.length} starred dataset${favorites.length === 1 ? '' : 's'} — your personal view`
                  : 'Star datasets to build your personal view'}
              </p>
            </div>
            {favoriteDatasets.length > 0 && (
              <div className="flex items-center gap-2">
                <Link
                  to="/datasets"
                  className="px-3 py-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  Browse More
                </Link>
                <Link
                  to={`/compare?ids=${favorites.slice(0, 4).join(',')}`}
                  className="px-3 py-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Compare All
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {favoriteDatasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No starred datasets yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Click the star icon on any dataset card or chart page to add it to your dashboard.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/datasets"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Browse Datasets
              </Link>
              <Link
                to="/overview"
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                Overview
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteDatasets.map(ds => {
              const spark = sparkData.get(ds.id);
              const color = CATEGORY_COLORS[ds.category];
              const isPositive = (spark?.change ?? 0) >= 0;
              const sparkColor = isPositive
                ? (isDark ? '#34d399' : '#10b981')
                : (isDark ? '#f87171' : '#ef4444');

              return (
                <Link
                  key={ds.id}
                  to={`/datasets/${ds.id}`}
                  className="group relative rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col"
                >
                  <button
                    onClick={(e) => removeFavorite(ds.id, e)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full text-amber-400 hover:text-slate-400 dark:hover:text-slate-500 transition-colors"
                    title="Remove from dashboard"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  </button>

                  <div className="mb-3 pr-6">
                    {color && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1.5 ${color.bg} ${color.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {ds.category}
                      </span>
                    )}
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {ds.title}
                    </h3>
                  </div>

                  <div style={{ height: '48px' }} className="mb-3 -mx-1">
                    {loading && !spark ? (
                      <div className="h-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    ) : spark && spark.values.length > 0 ? (
                      <SvgSparkline values={spark.values} color={sparkColor} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500">No data</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {spark ? (
                      <>
                        <div>
                          <span className="text-[14px] font-semibold text-slate-900 dark:text-white tabular-nums">{formatValue(spark.latest)}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">{spark.latestYear}</span>
                        </div>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50'}`}>
                          {isPositive ? '+' : ''}{spark.change.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
