import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';

interface SparkData {
  id: number;
  title: string;
  category: string;
  values: number[];
  latest: number;
  change: number;
  latestYear: number;
  loading: boolean;
}

function SvgSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 32;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 2) + 1}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const formatValue = (val: number) => {
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
  return val.toFixed(1);
};

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [datasets, setDatasets] = useState<SparkData[]>(
    CATALOG_DATA.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      values: [],
      latest: 0,
      change: 0,
      latestYear: 0,
      loading: true,
    }))
  );
  const [progress, setProgress] = useState(0);
  const { isFavorite: isFav, toggle: toggleFav } = useFavorites();

  useEffect(() => {
    const ids = CATALOG_DATA.map(d => d.id);
    dataService.fetchAll(ids, (done, total) => {
      setProgress(Math.round((done / total) * 100));
    }).then(allData => {
      setDatasets(CATALOG_DATA.map(d => {
        const series = allData.get(d.id) || [];
        if (series.length < 2) return {
          id: d.id, title: d.title, category: d.category,
          values: [], latest: 0, change: 0, latestYear: 0, loading: false,
        };
        const recent = series.slice(-20);
        const latest = recent[recent.length - 1].value;
        const latestYear = recent[recent.length - 1].year;
        const fiveAgo = series.find(v => v.year === recent[recent.length - 1].year - 5);
        const change = fiveAgo ? ((latest - fiveAgo.value) / Math.abs(fiveAgo.value)) * 100 : 0;
        return {
          id: d.id, title: d.title, category: d.category,
          values: recent.map(v => v.value), latest, change, latestYear, loading: false,
        };
      }));
    });
  }, []);

  const categories = useMemo(() => Array.from(new Set(CATALOG_DATA.map(d => d.category))), []);
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = activeCategory === 'All' ? datasets : datasets.filter(d => d.category === activeCategory);
  const loadedCount = datasets.filter(d => !d.loading).length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Overview</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">All 100 indicators at a glance with 5-year change trends.</p>
          </div>
          {loadedCount < CATALOG_DATA.length && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span>{loadedCount} / {CATALOG_DATA.length}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-6 pb-1">
          <button
            onClick={() => setActiveCategory('All')}
            className={`shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${activeCategory === 'All' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            All <span className="opacity-60">({CATALOG_DATA.length})</span>
          </button>
          {categories.map(cat => {
            const color = CATEGORY_COLORS[cat];
            const count = CATALOG_DATA.filter(d => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {color && <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />}
                {cat} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(ds => {
            const color = CATEGORY_COLORS[ds.category];
            const isPositive = ds.change >= 0;
            const sparkColor = isPositive ? (isDark ? '#34d399' : '#10b981') : (isDark ? '#f87171' : '#ef4444');

            return (
              <Link
                key={ds.id}
                to={`/datasets/${ds.id}`}
                className="group rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {color && <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{ds.category}</span>
                    </div>
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ds.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => toggleFav(ds.id, e)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isFav(ds.id) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                      title={isFav(ds.id) ? 'Remove from dashboard' : 'Add to dashboard'}
                    >
                      <svg className={`w-3.5 h-3.5 ${isFav(ds.id) ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    </button>
                    {!ds.loading && ds.values.length > 0 && (
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50'}`}>
                        {isPositive ? '+' : ''}{ds.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ height: '40px' }} className="mb-2">
                  {ds.loading ? (
                    <div className="h-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : ds.values.length > 0 ? (
                    <SvgSparkline values={ds.values} color={sparkColor} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500">No data</div>
                  )}
                </div>

                {!ds.loading && ds.values.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white tabular-nums">{formatValue(ds.latest)}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{ds.latestYear}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
