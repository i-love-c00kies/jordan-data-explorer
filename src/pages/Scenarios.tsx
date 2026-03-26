import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts';
import Papa from 'papaparse';
import { OWID_CONFIG, CATALOG_DATA } from '../constants/datasets';
import { linearRegression } from '../utils/statistics';
import { holtLinear, PROJECTION_PRESETS } from '../utils/projectionEngine';
import { useTheme } from '../context/ThemeContext';

type Tab = 'regression' | 'projection';

const BASELINE_IDX = 1;

function formatVal(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(2)}k`;
  return v.toFixed(3);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function fetchOwidDataset(id: string, cb: (d: { year: number; value: number }[]) => void, onErr: () => void) {
  const config = OWID_CONFIG[id];
  if (!config) { onErr(); return; }
  Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
    download: true, header: true,
    complete: (results) => {
      const rows = results.data.filter((row: any) => row['Entity'] === 'Jordan');
      const keys = rows.length > 0 ? Object.keys(rows[0] as object) : [];
      const valKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
      const out: { year: number; value: number }[] = [];
      rows.forEach((row: any) => {
        const y = parseInt(row['Year']);
        const v = parseFloat(row[valKey || '']);
        if (!isNaN(y) && !isNaN(v) && y >= 1900) out.push({ year: y, value: v });
      });
      cb(out.sort((a, b) => a.year - b.year));
    },
    error: () => onErr(),
  });
}

export default function Scenarios() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<Tab>('regression');

  const [datasetX, setDatasetX] = useState('5');
  const [datasetY, setDatasetY] = useState('3');
  const [xData, setXData] = useState<Record<number, number>>({});
  const [yData, setYData] = useState<Record<number, number>>({});
  const [loadingX, setLoadingX] = useState(true);
  const [loadingY, setLoadingY] = useState(true);
  const [scenarioShift, setScenarioShift] = useState(0);

  const [projDatasetId, setProjDatasetId] = useState('3');
  const [projSeries, setProjSeries] = useState<{ year: number; value: number }[]>([]);
  const [projLoading, setProjLoading] = useState(false);

  const [alpha, setAlpha] = useState(0.45);
  const [beta, setBeta] = useState(0.20);
  const [activePreset, setActivePreset] = useState<number | null>(BASELINE_IDX);

  const fetchRegDataset = (id: string, setter: (d: Record<number, number>) => void, setLoad: (l: boolean) => void) => {
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

  useEffect(() => { fetchRegDataset(datasetX, setXData, setLoadingX); }, [datasetX]);
  useEffect(() => { fetchRegDataset(datasetY, setYData, setLoadingY); }, [datasetY]);

  useEffect(() => {
    setProjLoading(true);
    fetchOwidDataset(
      projDatasetId,
      (d) => { setProjSeries(d); setProjLoading(false); },
      () => { setProjSeries([]); setProjLoading(false); }
    );
  }, [projDatasetId]);

  const regression = useMemo(() => {
    const commonYears = Object.keys(xData).filter(y => yData[parseInt(y)] !== undefined).map(Number).sort();
    if (commonYears.length < 5) return null;
    const xVals = commonYears.map(y => xData[y]);
    const yVals = commonYears.map(y => yData[y]);
    const reg = linearRegression(xVals, yVals);
    const scatterData = commonYears.map(y => ({
      year: y, x: xData[y], y: yData[y],
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

  const customProjection = useMemo(() => {
    if (projSeries.length < 2) return null;
    return holtLinear(projSeries, alpha, beta, 2030);
  }, [projSeries, alpha, beta]);

  const presetProjections = useMemo(() => {
    if (projSeries.length < 2) return [];
    return PROJECTION_PRESETS.map(p => holtLinear(projSeries, p.alpha, p.beta, 2030));
  }, [projSeries]);

  const projChartData = useMemo(() => {
    if (!customProjection || projSeries.length === 0) return [];
    const historicalByYear = new Map(projSeries.map(d => [d.year, d.value]));
    const customFcByYear = new Map(customProjection.forecast.map(d => [d.year, d.value]));
    const presetFcByYear = presetProjections.map(pp =>
      new Map(pp.forecast.map(d => [d.year, d.value]))
    );
    const lastHistYear = projSeries[projSeries.length - 1].year;
    const allYears = Array.from(new Set([
      ...projSeries.map(d => d.year),
      ...customProjection.forecast.map(d => d.year),
    ])).sort((a, b) => a - b);
    return allYears.map(year => {
      const row: Record<string, number | undefined> = { year };
      if (historicalByYear.has(year)) row.historical = historicalByYear.get(year);
      if (year >= lastHistYear) {
        row.custom = customFcByYear.get(year) ?? (year === lastHistYear ? historicalByYear.get(year) : undefined);
        PROJECTION_PRESETS.forEach((p, i) => {
          row[p.label] = presetFcByYear[i].get(year) ?? (year === lastHistYear ? historicalByYear.get(year) : undefined);
        });
      }
      return row;
    });
  }, [customProjection, presetProjections, projSeries]);

  const baseline2030 = useMemo(() => {
    if (!presetProjections[BASELINE_IDX]) return null;
    const fc = presetProjections[BASELINE_IDX].forecast;
    return fc.find(d => d.year === 2030)?.value ?? null;
  }, [presetProjections]);

  const custom2030 = useMemo(() => {
    if (!customProjection) return null;
    return customProjection.forecast.find(d => d.year === 2030)?.value ?? null;
  }, [customProjection]);

  const diffFromBaseline = useMemo(() => {
    if (baseline2030 === null || custom2030 === null || baseline2030 === 0) return null;
    return ((custom2030 - baseline2030) / Math.abs(baseline2030)) * 100;
  }, [baseline2030, custom2030]);

  const projTitle = CATALOG_DATA.find(d => d.id === parseInt(projDatasetId))?.title || 'Dataset';
  const xTitle = CATALOG_DATA.find(d => d.id === parseInt(datasetX))?.title || 'Dataset X';
  const yTitle = CATALOG_DATA.find(d => d.id === parseInt(datasetY))?.title || 'Dataset Y';
  const isLoading = loadingX || loadingY;

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8, fontSize: 12,
  };

  const handleSlider = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseFloat(e.target.value));
    setActivePreset(null);
  };

  const applyPreset = (idx: number) => {
    setAlpha(PROJECTION_PRESETS[idx].alpha);
    setBeta(PROJECTION_PRESETS[idx].beta);
    setActivePreset(idx);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-5 pt-8 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Scenario Modeler</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Model correlations or explore projection sensitivity with Holt-Linear smoothing.</p>
        </div>

        <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
          {([['regression', 'Regression Modeler'], ['projection', 'Projection Explorer']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'regression' && (
          <>
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
                  {[
                    { label: 'R-squared', value: regression.r2.toFixed(4), sub: regression.r2 > 0.7 ? 'Strong fit' : regression.r2 > 0.4 ? 'Moderate fit' : 'Weak fit' },
                    { label: 'Slope', value: regression.slope.toFixed(4), sub: regression.slope > 0 ? 'Positive relationship' : 'Negative relationship' },
                    { label: 'Data points', value: String(regression.commonYears.length), sub: 'Common years' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-4">
                      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{sub}</div>
                    </div>
                  ))}
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
                        <Tooltip contentStyle={tooltipStyle} />
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
                  <input type="range" min={-50} max={50} step={1} value={scenarioShift}
                    onChange={e => setScenarioShift(parseInt(e.target.value))}
                    className="w-full mb-4 accent-violet-600" />
                  <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                    <span>-50%</span><span>0%</span><span>+50%</span>
                  </div>
                  {scenarioData && (
                    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-[13px] text-slate-600 dark:text-slate-300">Predicted impact on <strong>{yTitle}</strong>:</div>
                      <div className={`text-2xl font-bold mt-1 ${scenarioData.yChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {scenarioData.yChange >= 0 ? '+' : ''}{scenarioData.yChange.toFixed(2)}%
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Based on linear regression (R² = {regression.r2.toFixed(3)})</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-sm text-slate-500 dark:text-slate-400">Not enough overlapping data points for these datasets. Try a different combination.</div>
            )}
          </>
        )}

        {tab === 'projection' && (
          <>
            <div className="mb-6">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Dataset</label>
              <select
                value={projDatasetId}
                onChange={e => setProjDatasetId(e.target.value)}
                className="w-full md:w-80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              >
                {CATALOG_DATA.map(d => <option key={d.id} value={String(d.id)}>{d.title}</option>)}
              </select>
            </div>

            {projLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
              </div>
            ) : projSeries.length < 2 ? (
              <div className="text-center py-20 text-sm text-slate-500 dark:text-slate-400">Not enough data to project. Try another dataset.</div>
            ) : (
              <>
                <div className="grid lg:grid-cols-3 gap-4 mb-6">
                  <div className="lg:col-span-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{projTitle} — projection to 2030</div>
                      <div className="flex items-center gap-4 text-[11px] flex-wrap">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="inline-block w-5 h-[2px] bg-blue-500" />Historical
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                          <span className="inline-block w-5 h-[2px] bg-blue-500 opacity-70" style={{ borderTop: '2px dashed' }} />Custom
                        </span>
                        {PROJECTION_PRESETS.map(p => (
                          <span key={p.label} className="flex items-center gap-1.5" style={{ color: p.color }}>
                            <span className="inline-block w-4 h-[2px]" style={{ borderTop: `2px dashed ${p.color}` }} />{p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                          <XAxis dataKey="year" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={55} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => (typeof v === 'number' ? formatVal(v) : String(v))} />
                          <ReferenceLine x={projSeries[projSeries.length - 1].year} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="2 2" />
                          <Line type="monotone" dataKey="historical" name="Historical" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls={false} />
                          <Line type="monotone" dataKey="custom" name="Custom" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 3" dot={false} connectNulls={false} />
                          {PROJECTION_PRESETS.map(p => (
                            <Line key={p.label} type="monotone" dataKey={p.label} name={p.label} stroke={p.color} strokeWidth={1.5} strokeDasharray={p.dashArray} dot={false} connectNulls={false} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-5 flex flex-col gap-5">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Presets</div>
                      <div className="flex flex-col gap-2">
                        {PROJECTION_PRESETS.map((p, i) => (
                          <button
                            key={p.label}
                            onClick={() => applyPreset(i)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${activePreset === i ? 'border-current shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            style={activePreset === i ? { borderColor: p.color, color: p.color, backgroundColor: `${p.color}12` } : {}}
                          >
                            <div className="flex items-center justify-between">
                              <span>{p.label}</span>
                              {activePreset === i && <span className="text-[10px] font-bold">ACTIVE</span>}
                            </div>
                            <div className="text-[11px] font-normal mt-0.5 opacity-70">{p.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Parameters</div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[12px] text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Alpha <span className="text-slate-400 dark:text-slate-500">(level)</span></span>
                            <span className="font-mono font-medium tabular-nums">{alpha.toFixed(2)}</span>
                          </div>
                          <input
                            type="range" min={0.05} max={0.95} step={0.01}
                            value={alpha} onChange={handleSlider(v => setAlpha(clamp(v, 0.05, 0.95)))}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <span>0.05 slow</span><span>0.95 fast</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[12px] text-slate-700 dark:text-slate-300 mb-1.5">
                            <span>Beta <span className="text-slate-400 dark:text-slate-500">(trend)</span></span>
                            <span className="font-mono font-medium tabular-nums">{beta.toFixed(2)}</span>
                          </div>
                          <input
                            type="range" min={0.05} max={0.95} step={0.01}
                            value={beta} onChange={handleSlider(v => setBeta(clamp(v, 0.05, 0.95)))}
                            className="w-full accent-blue-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <span>0.05 minimal</span><span>0.95 strong</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {custom2030 !== null && (
                  <div className="grid md:grid-cols-3 gap-3 mb-2">
                    <div className="md:col-span-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/20 p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-2">Custom Projection — 2030 Estimate</div>
                      <div className="flex items-end gap-3 flex-wrap">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{formatVal(custom2030)}</div>
                        {diffFromBaseline !== null && (
                          <div className={`text-sm font-semibold mb-0.5 ${diffFromBaseline > 0 ? 'text-emerald-600 dark:text-emerald-400' : diffFromBaseline < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>
                            {diffFromBaseline > 0 ? '+' : ''}{diffFromBaseline.toFixed(1)}% vs baseline
                          </div>
                        )}
                      </div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-2">
                        {diffFromBaseline === null
                          ? 'Using custom α/β parameters.'
                          : Math.abs(diffFromBaseline) < 2
                            ? 'Very close to the baseline projection — smoothing parameters have minimal impact here.'
                            : diffFromBaseline > 10
                              ? 'Significantly above baseline — your high alpha/beta settings amplify recent growth trends.'
                              : diffFromBaseline < -10
                                ? 'Significantly below baseline — conservative smoothing dampens the trend.'
                                : diffFromBaseline > 0
                                  ? 'Slightly above baseline — current settings favor recent momentum.'
                                  : 'Slightly below baseline — current settings apply more historical context.'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-5 flex flex-col gap-3">
                      {PROJECTION_PRESETS.map((p, i) => {
                        const val2030 = presetProjections[i]?.forecast.find(d => d.year === 2030)?.value;
                        return val2030 !== undefined ? (
                          <div key={p.label}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold" style={{ color: p.color }}>{p.label}</span>
                              <span className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">{formatVal(val2030)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">α={p.alpha} β={p.beta}</div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
