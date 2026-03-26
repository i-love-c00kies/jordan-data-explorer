import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';
import { useTheme } from '../context/ThemeContext';

interface SparkData {
  id: number;
  title: string;
  category: string;
  values: { year: number; value: number }[];
  latest: number;
  earliest: number;
  change: number;
  loading: boolean;
}

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
      earliest: 0,
      change: 0,
      loading: true,
    }))
  );

  useEffect(() => {
    CATALOG_DATA.forEach(ds => {
      const config = OWID_CONFIG[String(ds.id)];
      if (!config) return;

      const cacheKey = `jode-spark-${ds.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setDatasets(prev => prev.map(d => d.id === ds.id ? { ...d, ...parsed, loading: false } : d));
        return;
      }

      Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
        download: true,
        header: true,
        complete: (results) => {
          const jordanData = results.data.filter((row: any) => row['Entity'] === 'Jordan');
          const keys = jordanData.length > 0 ? Object.keys(jordanData[0] as object) : [];
          const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');

          const values = jordanData
            .map((row: any) => ({ year: parseInt(row['Year']), value: parseFloat(row[valueKey || '']) }))
            .filter((d: any) => !isNaN(d.value) && !isNaN(d.year) && d.year >= 1960)
            .sort((a: any, b: any) => a.year - b.year);

          if (values.length < 2) {
            setDatasets(prev => prev.map(d => d.id === ds.id ? { ...d, loading: false } : d));
            return;
          }

          const latest = values[values.length - 1].value;
          const earliest = values[0].value;
          const fiveYearsAgo = values.find((v: any) => v.year === values[values.length - 1].year - 5);
          const change = fiveYearsAgo ? ((latest - fiveYearsAgo.value) / Math.abs(fiveYearsAgo.value)) * 100 : 0;

          const sparkResult = { values: values.slice(-20), latest, earliest, change };
          sessionStorage.setItem(cacheKey, JSON.stringify(sparkResult));
          setDatasets(prev => prev.map(d => d.id === ds.id ? { ...d, ...sparkResult, loading: false } : d));
        },
        error: () => {
          setDatasets(prev => prev.map(d => d.id === ds.id ? { ...d, loading: false } : d));
        },
      });
    });
  }, []);

  const categories = useMemo(() => Array.from(new Set(CATALOG_DATA.map(d => d.category))), []);
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? datasets : datasets.filter(d => d.category === activeCategory);

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
    return val.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">All 100 indicators at a glance with 5-year change trends.</p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-6 pb-1">
          <button onClick={() => setActiveCategory('All')} className={`shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${activeCategory === 'All' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
          {categories.map(cat => {
            const color = CATEGORY_COLORS[cat];
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {color && <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />}
                {cat}
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {color && <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{ds.category}</span>
                    </div>
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ds.title}</h3>
                  </div>
                  {!ds.loading && ds.values.length > 0 && (
                    <span className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50'}`}>
                      {isPositive ? '+' : ''}{ds.change.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="h-10 mb-2">
                  {ds.loading ? (
                    <div className="h-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : ds.values.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ds.values}>
                        <Line type="monotone" dataKey="value" stroke={sparkColor} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500">No data</div>
                  )}
                </div>

                {!ds.loading && ds.values.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white tabular-nums">{formatValue(ds.latest)}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{ds.values[ds.values.length - 1]?.year}</span>
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
