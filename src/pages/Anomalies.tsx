import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { detectAnomalies } from '../utils/statistics';
import type { Anomaly } from '../utils/statistics';
import { HISTORICAL_EVENTS } from '../constants/events';

interface DatasetAnomaly extends Anomaly {
  datasetId: number;
  datasetTitle: string;
  possibleCause?: string;
}

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<DatasetAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'extreme' | 'severe' | 'moderate'>('all');

  useEffect(() => {
    const fetchAll = async () => {
      const promises = CATALOG_DATA.map(ds => {
        const config = OWID_CONFIG[String(ds.id)];
        if (!config) return Promise.resolve([]);

        return new Promise<DatasetAnomaly[]>((resolve) => {
          Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
            download: true, header: true,
            complete: (res) => {
              try {
                const jordanData = res.data.filter((row: any) => row['Entity'] === 'Jordan');
                const keys = jordanData.length > 0 ? Object.keys(jordanData[0] as object) : [];
                const valueKey = keys.find((k: string) => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');

                const timeSeries = jordanData
                  .map((row: any) => ({ year: parseInt(row['Year']), value: parseFloat(row[valueKey || '']) }))
                  .filter((d: any) => !isNaN(d.year) && !isNaN(d.value) && d.year >= 1960)
                  .sort((a: any, b: any) => a.year - b.year);

                const detected = detectAnomalies(timeSeries, 1.8);
                resolve(detected.map(a => {
                  const nearEvent = HISTORICAL_EVENTS.find(e => Math.abs(e.year - a.year) <= 1);
                  return { ...a, datasetId: ds.id, datasetTitle: ds.title, possibleCause: nearEvent?.label };
                }));
              } catch { resolve([]); }
            },
            error: () => resolve([]),
          });
        });
      });

      const results = await Promise.all(promises);
      const allAnomalies = results.flat();

      allAnomalies.sort((a, b) => {
        const order = { extreme: 0, severe: 1, moderate: 2 };
        return order[a.magnitude] - order[b.magnitude] || b.year - a.year;
      });

      setAnomalies(allAnomalies);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = filter === 'all' ? anomalies : anomalies.filter(a => a.magnitude === filter);

  const getMagnitudeStyle = (mag: string) => {
    if (mag === 'extreme') return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    if (mag === 'severe') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-5 pt-8 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Anomaly Detection</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Statistical outliers detected across all 30 datasets using Z-score analysis.</p>
        </div>

        <div className="flex gap-1.5 mb-6">
          {(['all', 'extreme', 'severe', 'moderate'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-[13px] font-medium capitalize transition-colors ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
            <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Analyzing datasets...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4">{filtered.length} anomalies found</p>
            {filtered.map((a, i) => (
              <Link
                key={`${a.datasetId}-${a.year}-${i}`}
                to={`/datasets/${a.datasetId}`}
                className="block rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getMagnitudeStyle(a.magnitude)}`}>{a.magnitude}</span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{a.year}</span>
                    </div>
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{a.datasetTitle}</h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      {a.direction === 'spike' ? 'Unusual spike' : 'Unusual drop'} of {Math.abs(a.percentChange).toFixed(1)}% (Z-score: {a.zScore.toFixed(2)})
                      {a.possibleCause && <span className="text-slate-400 dark:text-slate-500"> &middot; Likely related to {a.possibleCause}</span>}
                    </p>
                  </div>
                  <div className={`shrink-0 text-sm font-semibold tabular-nums ${a.direction === 'spike' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {a.direction === 'spike' ? '+' : ''}{a.percentChange.toFixed(1)}%
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
