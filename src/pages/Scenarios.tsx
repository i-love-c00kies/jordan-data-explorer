import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { linearRegression } from '../utils/statistics';
import { useTheme } from '../context/ThemeContext';

export default function Scenarios() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [datasetX, setDatasetX] = useState('5');
  const [datasetY, setDatasetY] = useState('3');
  const [xData, setXData] = useState<Record<number, number>>({});
  const [yData, setYData] = useState<Record<number, number>>({});
  const [loadingX, setLoadingX] = useState(true);
  const [loadingY, setLoadingY] = useState(true);
  const [scenarioShift, setScenarioShift] = useState(0);

  const fetchDataset = (id: string, setter: (d: Record<number, number>) => void, setLoad: (l: boolean) => void) => {
    const config = OWID_CONFIG[id];
    if (!config) return;
    setLoad(true);

    Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
      download: true, header: true,
      complete: (results) => {
        const jordanData = results.data.filter((row: any) => row['Entity'] === 'Jordan');
        const keys = jordanData.length > 0 ? Object.keys(jordanData[0] as object) : [];
        const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
        const data: Record<number, number> = {};
        jordanData.forEach((row: any) => {
          const y = parseInt(row['Year']);
          const v = parseFloat(row[valueKey || '']);
          if (!isNaN(y) && !isNaN(v) && y >= 1960) data[y] = v;
        });
        setter(data);
        setLoad(false);
      },
      error: () => { setter({}); setLoad(false); },
    });
  };

  useEffect(() => { fetchDataset(datasetX, setXData, setLoadingX); }, [datasetX]);
  useEffect(() => { fetchDataset(datasetY, setYData, setLoadingY); }, [datasetY]);

  const regression = useMemo(() => {
    const commonYears = Object.keys(xData).filter(y => yData[parseInt(y)] !== undefined).map(Number).sort();
    if (commonYears.length < 5) return null;

    const xVals = commonYears.map(y => xData[y]);
    const yVals = commonYears.map(y => yData[y]);
    const reg = linearRegression(xVals, yVals);

    const scatterData = commonYears.map(y => ({
      year: y,
      x: xData[y],
      y: yData[y],
      predicted: reg.slope * xData[y] + reg.intercept,
    }));

    return { ...reg, scatterData, commonYears };
  }, [xData, yData]);

  const scenarioData = useMemo(() => {
    if (!regression || scenarioShift === 0) return null;

    const lastYear = regression.commonYears[regression.commonYears.length - 1];
    const lastX = xData[lastYear];
    const lastY = yData[lastYear];
    if (lastX === undefined || lastY === undefined) return null;

    const newX = lastX * (1 + scenarioShift / 100);
    const predictedY = regression.slope * newX + regression.intercept;
    const yChange = ((predictedY - lastY) / Math.abs(lastY)) * 100;

    return { newX, predictedY, yChange, lastX, lastY, lastYear };
  }, [regression, scenarioShift, xData, yData]);

  const xTitle = CATALOG_DATA.find(d => d.id === parseInt(datasetX))?.title || 'Dataset X';
  const yTitle = CATALOG_DATA.find(d => d.id === parseInt(datasetY))?.title || 'Dataset Y';
  const isLoading = loadingX || loadingY;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-5 pt-8 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Scenario Modeler</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Select two datasets, see their regression, and model what-if scenarios.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Independent variable (X)</label>
            <select value={datasetX} onChange={e => setDatasetX(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white">
              {CATALOG_DATA.map(d => <option key={d.id} value={String(d.id)}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Dependent variable (Y)</label>
            <select value={datasetY} onChange={e => setDatasetY(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white">
              {CATALOG_DATA.map(d => <option key={d.id} value={String(d.id)}>{d.title}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
          </div>
        ) : regression ? (
          <>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">R-squared</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{regression.r2.toFixed(4)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{regression.r2 > 0.7 ? 'Strong fit' : regression.r2 > 0.4 ? 'Moderate fit' : 'Weak fit'}</div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Slope</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{regression.slope.toFixed(4)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{regression.slope > 0 ? 'Positive relationship' : 'Negative relationship'}</div>
              </div>
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Data points</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{regression.commonYears.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Common years</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4 mb-6">
              <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-3">{xTitle} vs {yTitle} over time</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={regression.scatterData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="year" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: isDark ? '#3b82f6' : '#2563eb', fontSize: 10 }} tickLine={false} axisLine={false} width={50} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: isDark ? '#a78bfa' : '#7c3aed', fontSize: 10 }} tickLine={false} axisLine={false} width={50} />
                    <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="x" name={xTitle} stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="y" name={yTitle} stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-violet-50 dark:bg-violet-950/20 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">What-If Scenario</h3>
              <label className="text-[13px] text-slate-600 dark:text-slate-400 mb-2 block">
                If <strong>{xTitle}</strong> changes by <strong className="text-violet-600 dark:text-violet-400">{scenarioShift > 0 ? '+' : ''}{scenarioShift}%</strong>:
              </label>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={scenarioShift}
                onChange={e => setScenarioShift(parseInt(e.target.value))}
                className="w-full mb-4 accent-violet-600"
              />
              <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                <span>-50%</span><span>0%</span><span>+50%</span>
              </div>

              {scenarioData && (
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-[13px] text-slate-600 dark:text-slate-300">
                    Predicted impact on <strong>{yTitle}</strong>:
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${scenarioData.yChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {scenarioData.yChange >= 0 ? '+' : ''}{scenarioData.yChange.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Based on linear regression (R&sup2; = {regression.r2.toFixed(3)})
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-sm text-slate-500 dark:text-slate-400">Not enough overlapping data points for these datasets. Try a different combination.</div>
        )}
      </div>
    </div>
  );
}
