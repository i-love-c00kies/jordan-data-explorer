import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { pearsonCorrelation } from '../utils/statistics';
import { useTheme } from '../context/ThemeContext';

interface DatasetTimeSeries {
  id: number;
  title: string;
  data: Record<number, number>;
}

export default function Correlations() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [seriesData, setSeriesData] = useState<DatasetTimeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null);

  const TOP_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16];

  useEffect(() => {
    const fetchAll = async () => {
      const results: DatasetTimeSeries[] = [];

      for (const id of TOP_IDS) {
        const config = OWID_CONFIG[String(id)];
        if (!config) continue;

        const cacheKey = `jode-corr-${id}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          results.push(JSON.parse(cached));
          continue;
        }

        try {
          const res: any = await new Promise((resolve, reject) => {
            Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
              download: true, header: true, complete: resolve, error: reject,
            });
          });

          const jordanData = res.data.filter((row: any) => row['Entity'] === 'Jordan');
          const keys = jordanData.length > 0 ? Object.keys(jordanData[0]) : [];
          const valueKey = keys.find((k: string) => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');

          const data: Record<number, number> = {};
          jordanData.forEach((row: any) => {
            const year = parseInt(row['Year']);
            const val = parseFloat(row[valueKey || '']);
            if (!isNaN(year) && !isNaN(val) && year >= 1960) data[year] = val;
          });

          const entry = { id, title: CATALOG_DATA.find(d => d.id === id)?.title || config.title, data };
          sessionStorage.setItem(cacheKey, JSON.stringify(entry));
          results.push(entry);
        } catch {
          continue;
        }
      }

      setSeriesData(results);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const matrix = useMemo(() => {
    if (seriesData.length < 2) return [];

    return seriesData.map((a) =>
      seriesData.map((b) => {
        if (a.id === b.id) return 1;
        const commonYears = Object.keys(a.data).filter(y => b.data[parseInt(y)] !== undefined).map(Number).sort();
        if (commonYears.length < 5) return 0;
        const xVals = commonYears.map(y => a.data[y]);
        const yVals = commonYears.map(y => b.data[y]);
        return pearsonCorrelation(xVals, yVals);
      })
    );
  }, [seriesData]);

  const getCellColor = (val: number) => {
    if (val === 1) return isDark ? 'bg-slate-800' : 'bg-slate-100';
    if (val > 0.7) return isDark ? 'bg-blue-900/80 text-blue-200' : 'bg-blue-500 text-white';
    if (val > 0.4) return isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-300 text-blue-900';
    if (val > 0.1) return isDark ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-100 text-blue-800';
    if (val > -0.1) return isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500';
    if (val > -0.4) return isDark ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-800';
    if (val > -0.7) return isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-300 text-red-900';
    return isDark ? 'bg-red-900/80 text-red-200' : 'bg-red-500 text-white';
  };

  const selectedCorr = selectedCell && matrix.length > 0 ? matrix[selectedCell.i][selectedCell.j] : null;
  const selectedPair = selectedCell ? { a: seriesData[selectedCell.i], b: seriesData[selectedCell.j] } : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Correlation Matrix</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pearson correlations between Jordan's key indicators. Click any cell to see details.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
            <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Loading datasets...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 overflow-x-auto">
              <div className="inline-block">
                <div className="flex">
                  <div className="w-32 shrink-0" />
                  {seriesData.map(d => (
                    <div key={d.id} className="w-14 shrink-0 px-0.5">
                      <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate -rotate-45 origin-bottom-left translate-y-1 h-16 flex items-end">{d.title}</div>
                    </div>
                  ))}
                </div>
                {matrix.map((row, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-32 shrink-0 pr-2">
                      <Link to={`/datasets/${seriesData[i].id}`} className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate block hover:text-blue-600 dark:hover:text-blue-400">{seriesData[i].title}</Link>
                    </div>
                    {row.map((val, j) => (
                      <button
                        key={j}
                        onClick={() => i !== j && setSelectedCell({ i, j })}
                        className={`w-14 h-10 shrink-0 text-[10px] font-semibold tabular-nums rounded-sm m-px transition-all ${getCellColor(val)} ${i !== j ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : 'cursor-default'} ${selectedCell?.i === i && selectedCell?.j === j ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {i === j ? '--' : val.toFixed(2)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Strong negative</span>
                <div className="flex gap-0.5">
                  <div className="w-6 h-3 rounded-sm bg-red-500" />
                  <div className="w-6 h-3 rounded-sm bg-red-300 dark:bg-red-900/40" />
                  <div className="w-6 h-3 rounded-sm bg-red-100 dark:bg-red-950/40" />
                  <div className="w-6 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
                  <div className="w-6 h-3 rounded-sm bg-blue-100 dark:bg-blue-950/40" />
                  <div className="w-6 h-3 rounded-sm bg-blue-300 dark:bg-blue-900/40" />
                  <div className="w-6 h-3 rounded-sm bg-blue-500" />
                </div>
                <span>Strong positive</span>
              </div>
            </div>

            {selectedPair && selectedCorr !== null && (
              <div className="lg:w-72 shrink-0 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Correlation Detail</h3>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Dataset A:</span>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedPair.a.title}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Dataset B:</span>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedPair.b.title}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Pearson r:</span>
                    <p className={`text-2xl font-bold tabular-nums ${selectedCorr > 0.4 ? 'text-blue-600 dark:text-blue-400' : selectedCorr < -0.4 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>{selectedCorr.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Interpretation:</span>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {Math.abs(selectedCorr) > 0.7 ? 'Strong' : Math.abs(selectedCorr) > 0.4 ? 'Moderate' : Math.abs(selectedCorr) > 0.2 ? 'Weak' : 'Negligible'} {selectedCorr > 0 ? 'positive' : 'negative'} correlation
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link to={`/datasets/${selectedPair.a.id}`} className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline">View {selectedPair.a.title}</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
