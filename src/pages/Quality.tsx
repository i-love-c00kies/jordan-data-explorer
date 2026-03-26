import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { assessDataQuality } from '../utils/statistics';
import type { DataQualityScore } from '../utils/statistics';

interface DatasetQuality {
  id: number;
  title: string;
  category: string;
  quality: DataQualityScore;
}

export default function Quality() {
  const [datasets, setDatasets] = useState<DatasetQuality[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'overall' | 'completeness' | 'freshness' | 'coverage'>('overall');

  useEffect(() => {
    const fetchAll = async () => {
      const promises = CATALOG_DATA.map(ds => {
        const config = OWID_CONFIG[String(ds.id)];
        if (!config) return Promise.resolve(null);

        return new Promise<DatasetQuality | null>((resolve) => {
          Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
            download: true, header: true,
            complete: (res) => {
              try {
                const jordanData = res.data.filter((row: any) => row['Entity'] === 'Jordan');
                const keys = jordanData.length > 0 ? Object.keys(jordanData[0] as object) : [];
                const valueKey = keys.find((k: string) => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');

                const timeSeries = jordanData
                  .map((row: any) => ({ year: parseInt(row['Year']), value: parseFloat(row[valueKey || '']) }))
                  .filter((d: any) => !isNaN(d.year) && !isNaN(d.value))
                  .sort((a: any, b: any) => a.year - b.year);

                const quality = assessDataQuality(timeSeries);
                resolve({ id: ds.id, title: ds.title, category: ds.category, quality });
              } catch { resolve(null); }
            },
            error: () => resolve(null),
          });
        });
      });

      const results = await Promise.all(promises);
      setDatasets(results.filter((r): r is DatasetQuality => r !== null));
      setLoading(false);
    };

    fetchAll();
  }, []);

  const sorted = [...datasets].sort((a, b) => b.quality[sortBy] - a.quality[sortBy]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const avgOverall = datasets.length > 0 ? Math.round(datasets.reduce((sum, d) => sum + d.quality.overall, 0) / datasets.length) : 0;
  const avgFreshness = datasets.length > 0 ? Math.round(datasets.reduce((sum, d) => sum + d.quality.freshness, 0) / datasets.length) : 0;
  const avgCompleteness = datasets.length > 0 ? Math.round(datasets.reduce((sum, d) => sum + d.quality.completeness, 0) / datasets.length) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-5 pt-8 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Data Quality Scorecard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Completeness, freshness, and coverage assessment for each dataset.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
            <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Assessing quality...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4 text-center">
                <div className={`text-3xl font-bold tabular-nums ${getScoreColor(avgOverall)}`}>{avgOverall}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Avg Overall</div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4 text-center">
                <div className={`text-3xl font-bold tabular-nums ${getScoreColor(avgCompleteness)}`}>{avgCompleteness}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Avg Completeness</div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4 text-center">
                <div className={`text-3xl font-bold tabular-nums ${getScoreColor(avgFreshness)}`}>{avgFreshness}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Avg Freshness</div>
              </div>
            </div>

            <div className="flex gap-1.5 mb-4">
              {(['overall', 'completeness', 'freshness', 'coverage'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 rounded-md text-[13px] font-medium capitalize transition-colors ${sortBy === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {sorted.map(ds => (
                <Link
                  key={ds.id}
                  to={`/datasets/${ds.id}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 px-4 py-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ds.title}</h3>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{ds.quality.totalYears} years &middot; {ds.quality.earliestYear}–{ds.quality.latestYear} &middot; {ds.quality.missingYears} gaps</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col items-center w-14">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBg(ds.quality.completeness)}`} style={{ width: `${ds.quality.completeness}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Compl</span>
                    </div>
                    <div className="hidden sm:flex flex-col items-center w-14">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBg(ds.quality.freshness)}`} style={{ width: `${ds.quality.freshness}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Fresh</span>
                    </div>
                    <div className={`text-base font-bold tabular-nums w-10 text-right ${getScoreColor(ds.quality.overall)}`}>{ds.quality.overall}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
