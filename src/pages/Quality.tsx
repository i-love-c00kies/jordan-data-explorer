import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { assessDataQuality } from '../utils/statistics';
import { dataService } from '../services/dataService';
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
  const [progress, setProgress] = useState(0);
  const [sortBy, setSortBy] = useState<'overall' | 'completeness' | 'freshness' | 'coverage'>('overall');

  useEffect(() => {
    const ids = CATALOG_DATA.map(d => d.id);
    dataService.fetchAll(ids, (done, total) => {
      setProgress(Math.round((done / total) * 100));
    }).then(allData => {
      const results: DatasetQuality[] = [];
      for (const ds of CATALOG_DATA) {
        const config = OWID_CONFIG[String(ds.id)];
        if (!config) continue;
        const series = allData.get(ds.id) || [];
        if (series.length === 0) continue;
        try {
          const quality = assessDataQuality(series);
          results.push({ id: ds.id, title: ds.title, category: ds.category, quality });
        } catch {}
      }
      setDatasets(results);
      setLoading(false);
    });
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
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Assessing {progress}% of datasets...</span>
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
