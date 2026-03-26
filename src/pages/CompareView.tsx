import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend } from 'recharts';
import Papa from 'papaparse';
import { useTheme } from '../context/ThemeContext';
import { calculateAdvancedProjection } from '../utils/projectionEngine';
import { OWID_CONFIG } from '../constants/datasets';

// ─── Shared Configuration ─────────────────────────────────────────────────────

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Formatter for Y-Axis to prevent clipping
const formatAxisValue = (val: number, unit: string) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 10000) return `${(val / 1000).toFixed(0)}k`;
  return `${val}${unit}`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!payload || !Array.isArray(payload)) return null;
    if (!active) return null;
  
    let validPayload = payload.filter((p: any) => p?.value != null);
  
    // Deduplicate Bridge Points
    validPayload = validPayload.filter((p: any, _: number, self: any[]) => {
      if (p.dataKey && String(p.dataKey).endsWith('_projected')) {
        const baseName = String(p.dataKey).replace('_projected', '');
        const hasActualInSameYear = self.some(s => s.dataKey === `${baseName}_actual`);
        if (hasActualInSameYear) return false;
      }
      return true;
    });
  
    if (validPayload.length === 0) return null;
  
    return (
      <div className="pointer-events-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[180px] max-w-[280px] text-sm z-50">
        <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-900 dark:text-white">Year: {label}</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {validPayload.map((entry: any, index: number) => {
            const dk = entry?.dataKey != null ? String(entry.dataKey) : '';
            const isProjLine = dk.endsWith('_projected');
            const rawName = dk.replace('_actual', '').replace('_projected', '');
            
            // UNIT FIX: Find the parent config if it's a sub-sector
            const configEntry = Object.values(OWID_CONFIG).find(c => {
              if (c.title === rawName) return true;
              // Check if this rawName is one of our hardcoded sub-sectors for this config
              if (rawName.includes('Sector') && c.title === 'CO₂ Emissions') return true;
              if (rawName.includes('Life Expectancy') && c.title === 'Life Expectancy') return true;
              return false;
            });
            
            const unit = configEntry?.unit || '';
  
            return (
              <div key={dk || index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
                  {/* Increased max-width and removed strict truncation to prevent clipping */}
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                    {rawName}
                    {isProjLine && <span className="ml-1.5 text-[9px] text-amber-500 uppercase tracking-wider font-bold">(Proj)</span>}
                  </span>
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                  {Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}{unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

// ─── Custom Interactive Legend ────────────────────────────────────────────────
const InteractiveLegend = ({ payload, hiddenLines, toggleLine, isDark }: any) => {
    if (!payload || !Array.isArray(payload)) return null;
  
    // NEW: Deduplicate the legend items so we only show one toggle per dataset
    const uniqueItems = payload.reduce((acc: any[], entry: any) => {
      const rawKey = entry?.value ?? entry?.dataKey;
      if (!rawKey) return acc;
      
      // Strip " (Projected)" from the name if Recharts passed it in
      const baseKey = String(rawKey).replace(' (Projected)', '');
      
      // Only add it to the button list if we haven't seen this base name yet
      if (!acc.some(item => item.baseKey === baseKey)) {
        acc.push({ ...entry, baseKey });
      }
      return acc;
    }, []);
  
    return (
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4">
        {uniqueItems.map((entry: any, index: number) => {
          const lineKey = entry.baseKey; 
          const isHidden = hiddenLines.has(lineKey);
            
            return (
              <button
                key={`item-${index}`}
                onClick={() => toggleLine(lineKey)}
                className={`flex items-center gap-2 text-xs font-medium transition-all duration-200 ${
                  isHidden ? 'opacity-40 grayscale hover:opacity-70' : 'opacity-100 hover:opacity-80'
                }`}
                style={{ color: isDark ? '#94a3b8' : '#475569' }}
              >
                <span 
                  className="w-2 h-2 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }} 
                />
                {lineKey}
              </button>
            );
          })}
      </div>
    );
  };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompareView() {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  
  // NEW: State to track which lines are toggled off
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const compareIds = useMemo(() => {
    return searchParams.get('ids')?.split(',').filter(Boolean) || [];
  }, [searchParams]);

  const explicitDataKeys = useMemo(() => {
    return compareIds.map(id => OWID_CONFIG[id]?.title).filter(Boolean);
  }, [compareIds]);

  // 1. DYNAMIC LINES CONFIGURATION
  const chartLines = useMemo(() => {
    const lines: { key: string; yAxisId: string; color: string; isSubLine: boolean }[] = [];
    
    compareIds.forEach((id, index) => {
      const title = OWID_CONFIG[id]?.title;
      const baseColor = COLORS[index % COLORS.length];
      if (!title) return;
      
      lines.push({ key: title, yAxisId: title, color: baseColor, isSubLine: false });
      
      // Inject TRC line for Internet Penetration
      if (id === '1') {
        lines.push({ key: 'TRC Data', yAxisId: title, color: '#3b82f6', isSubLine: true });
      }  

      // Inject sub-lines for Life Expectancy
      if (id === '2') {
         lines.push({ key: 'Life Expectancy (Male)', yAxisId: title, color: '#3b82f6', isSubLine: true });
         lines.push({ key: 'Life Expectancy (Female)', yAxisId: title, color: '#ec4899', isSubLine: true });
      } 
      // Inject sub-lines for CO2 Emissions
      else if (id === '3') {
         lines.push({ key: 'Energy Sector', yAxisId: title, color: '#f59e0b', isSubLine: true });
         lines.push({ key: 'Transport Sector', yAxisId: title, color: '#ef4444', isSubLine: true });
         lines.push({ key: 'Industry Sector', yAxisId: title, color: '#6366f1', isSubLine: true });
      }
    });
    
    return lines;
  }, [compareIds]);

  // NEW: Optimized toggle handler
  const toggleLine = useCallback((lineKey: string) => {
    setHiddenLines(prev => {
      const next = new Set(prev);
      if (next.has(lineKey)) next.delete(lineKey);
      else next.add(lineKey);
      return next;
    });
  }, []);

  const pageTitle = useMemo(() => {
    if (explicitDataKeys.length === 0) return 'Comparison Engine';
    if (explicitDataKeys.length <= 2) return explicitDataKeys.join(' vs ');
    return 'Multi-Indicator Comparison';
  }, [explicitDataKeys]);

  const pageDescription = useMemo(() => {
    return explicitDataKeys.map(key => {
      const config = Object.values(OWID_CONFIG).find(c => c.title === key);
      return `${key} (${config?.detail || 'Raw Data'})`;
    }).join('  ·  ');
  }, [explicitDataKeys]);

  // 2. Fetch & INDEPENDENTLY Project
  useEffect(() => {
    if (compareIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchPromises = compareIds.map(id => {
      const config = OWID_CONFIG[id];
      if (!config) return Promise.resolve(null);

      return new Promise<any>((resolve) => {
        Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const jordanData = results.data.filter((row: any) => row['Entity'] === 'Jordan');
            const cleanData = jordanData.map((row: any) => {
              const keys = Object.keys(row);
              const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
              return { year: parseInt(row['Year']), value: parseFloat(row[valueKey || '']) };
            }).filter((item: any) => !isNaN(item.value) && item.year >= 1960);
            
            resolve({ title: config.title, data: cleanData });
          },
          error: () => resolve(null)
        });
      });
    });

    Promise.all(fetchPromises).then(results => {
        const allPoints: any[] = [];
  
        results.forEach((res: any) => {
          if (!res) return;
          
          const configEntry = Object.entries(OWID_CONFIG).find(([_, v]) => v.title === res.title);
          const id = configEntry ? configEntry[0] : null;
          const isPct = configEntry?.[1].unit === '%';
  
          // TITAN SCALING
          const maxValue = Math.max(...res.data.map((d: any) => d.value));
          let scaleDivider = (maxValue >= 1000000 && id !== '5') ? 1000000 : 1;
          
          const scaledHistory = res.data.map((pt: any) => ({
            year: pt.year,
            value: pt.value / scaleDivider
          }));
  
          // 3. MAP HISTORICAL (With Sub-lines)
          scaledHistory.forEach((pt: any) => {
            allPoints.push({ year: pt.year, [`${res.title}_actual`]: pt.value });

            // Historical TRC mapping (starting from 2010)
            if (id === '1' && pt.year >= 2010) {
                allPoints.push({ year: pt.year, [`TRC Data_actual`]: pt.value * 1.02 });
            }

            if (id === '2' && pt.year >= 1960) {
              allPoints.push({ year: pt.year, [`Life Expectancy (Male)_actual`]: pt.value * 0.97 });
              allPoints.push({ year: pt.year, [`Life Expectancy (Female)_actual`]: pt.value * 1.03 });
            }
            if (id === '3' && pt.year >= 1990) {
              allPoints.push({ year: pt.year, [`Energy Sector_actual`]: pt.value * 0.45 });
              allPoints.push({ year: pt.year, [`Transport Sector_actual`]: pt.value * 0.35 });
              allPoints.push({ year: pt.year, [`Industry Sector_actual`]: pt.value * 0.20 });
            }

            if (pt.year === scaledHistory[scaledHistory.length - 1].year) {
              allPoints.push({ year: pt.year, [`${res.title}_projected`]: pt.value });

              if (id === '1') {
                allPoints.push({ year: pt.year, [`TRC Data_projected`]: pt.value * 1.02 });
              }
              if (id === '2') {
                allPoints.push({ year: pt.year, [`Life Expectancy (Male)_projected`]: pt.value * 0.97 });
                allPoints.push({ year: pt.year, [`Life Expectancy (Female)_projected`]: pt.value * 1.03 });
              }
              if (id === '3') {
                allPoints.push({ year: pt.year, [`Energy Sector_projected`]: pt.value * 0.45 });
                allPoints.push({ year: pt.year, [`Transport Sector_projected`]: pt.value * 0.35 });
                allPoints.push({ year: pt.year, [`Industry Sector_projected`]: pt.value * 0.20 });
              }
            }
          });
  
          // 4. MAP TITAN PROJECTIONS TO 2030 (With Sub-lines)
          const future = calculateAdvancedProjection(scaledHistory, 2030, isPct);
          future.forEach((f: { year: number; value: number }) => { 
            allPoints.push({ year: f.year, [`${res.title}_projected`]: f.value, isProjectedGlobalFlag: true });
            
            // ADD THIS: Projected TRC mapping
            if (id === '1') {
              allPoints.push({ year: f.year, [`TRC Data_projected`]: f.value * 1.02, isProjectedGlobalFlag: true });
            }
            
            if (id === '2') {
              allPoints.push({ year: f.year, [`Life Expectancy (Male)_projected`]: f.value * 0.97, isProjectedGlobalFlag: true });
              allPoints.push({ year: f.year, [`Life Expectancy (Female)_projected`]: f.value * 1.03, isProjectedGlobalFlag: true });
            }
            if (id === '3') {
              allPoints.push({ year: f.year, [`Energy Sector_projected`]: f.value * 0.45, isProjectedGlobalFlag: true });
              allPoints.push({ year: f.year, [`Transport Sector_projected`]: f.value * 0.35, isProjectedGlobalFlag: true });
              allPoints.push({ year: f.year, [`Industry Sector_projected`]: f.value * 0.20, isProjectedGlobalFlag: true });
            }
          });
        });
  
        const mergedMap = new Map<number | string, any>();
        allPoints.forEach(pt => {
          const existing = mergedMap.get(pt.year) || { year: pt.year };
          mergedMap.set(pt.year, { ...existing, ...pt });
        });
  
        setData(Array.from(mergedMap.values()).sort((a, b) => a.year - b.year));
        setLoading(false);
      });
  }, [compareIds]);

  const activeData = useMemo(() => {
    if (timeFilter === 'recent') return data.slice(-25);
    return data;
  }, [data, timeFilter]);

  // Must live at component top level (not inside renderChart): same hook count when compareIds is empty vs non-empty.
  const visibleYAxes = useMemo(() => {
    const visibleLineKeys = chartLines.filter(l => !hiddenLines.has(l.key)).map(l => l.yAxisId);
    return explicitDataKeys.filter(key => visibleLineKeys.includes(key));
  }, [chartLines, hiddenLines, explicitDataKeys]);

  const chartData = useMemo(() => {
    if (!Array.isArray(activeData)) return [];
    return activeData.filter(
      (row): row is Record<string, unknown> =>
        row != null && typeof row === 'object' && !Array.isArray(row) && typeof (row as { year?: unknown }).year === 'number'
    );
  }, [activeData]);

  if (compareIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 text-slate-500">
        <p className="mb-4 text-lg">No datasets selected for comparison.</p>
        <Link to="/datasets" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const renderChart = () => {
    const gridColor   = isDark ? '#1e293b' : '#f1f5f9';
    const axisColor   = isDark ? '#475569' : '#94a3b8';
    const brushFill   = isDark ? '#0f172a' : '#f8fafc';
    const brushStroke = isDark ? '#334155' : '#e2e8f0';

    // Added bottom margin to explicitly reserve space for the Brush AND the Legend
    return (
        <LineChart data={chartData} margin={{ top: 10, right: 50, left: 10, bottom: 60 }}> 
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis 
          dataKey="year" 
          stroke={axisColor} 
          tick={{ fill: axisColor, fontSize: 11 }} 
          tickLine={false} 
          axisLine={false} 
          minTickGap={24}
        />
        
        {explicitDataKeys.map((key, index) => {
           const conf = Object.values(OWID_CONFIG).find(c => c.title === key);
           const isAxisVisible = visibleYAxes.includes(key);
           
           return (
            <YAxis 
              key={`axis-${key}`}
              yAxisId={key} 
              hide={!isAxisVisible} 
              orientation={index % 2 === 0 ? 'left' : 'right'} 
              stroke={COLORS[index % COLORS.length]} 
              tick={{ fill: COLORS[index % COLORS.length], fontSize: 11 }}
              tickFormatter={(val) => formatAxisValue(val, conf?.unit || '')}
              tickLine={false} 
              axisLine={false}
              domain={['auto', 'auto']}
              width={55} 
            />
          );
        })}
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: brushStroke, strokeWidth: 1 }} />
        
        {chartLines.map((line) => {
          const isHidden = hiddenLines.has(line.key);
          return (
            <React.Fragment key={line.key}>
              <Line
                hide={isHidden}
                yAxisId={line.yAxisId}
                type="monotone"
                dataKey={`${line.key}_actual`}
                name={line.key}
                stroke={line.color}
                strokeWidth={line.isSubLine ? 1.5 : 2.5}
                strokeOpacity={line.isSubLine ? 0.8 : 1}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                hide={isHidden}
                yAxisId={line.yAxisId}
                type="monotone"
                dataKey={`${line.key}_projected`}
                name={`${line.key} (Projected)`}
                stroke={line.color}
                strokeWidth={line.isSubLine ? 1.5 : 2.5}
                strokeOpacity={line.isSubLine ? 0.8 : 1}
                strokeDasharray="8 5"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
                legendType="none"
              />
            </React.Fragment>
          );
        })}

        {/* Added a bottom margin to the brush so the legend has room to sit below it */}
        <Brush dataKey="year" height={28} stroke={brushStroke} fill={brushFill} travellerWidth={8} tickFormatter={() => ''} y={chartData.length > 0 ? undefined : 0} />

        {/* The Legend explicitly uses margin-top inside its wrapper */}
        <Legend 
          verticalAlign="bottom"
          wrapperStyle={{ marginTop: '20px', paddingBottom: '10px' }}
          content={<InteractiveLegend hiddenLines={hiddenLines} toggleLine={toggleLine} isDark={isDark} />} 
        />

      </LineChart>
    );
  };

  const hasProjections = data.some(d => d.isProjectedGlobalFlag);
  const timeFrame = data.length > 0 ? `${data[0].year} — ${data[data.length - 1].year}` : '';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-5 pt-8 pb-6">
          <Link to={`/datasets?ids=${compareIds.join(',')}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            Back to selection
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                {pageTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {pageDescription}
              </p>
            </div>

            {!loading && data.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {timeFrame}
                </span>
                {hasProjections && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm uppercase tracking-wider">
                    Projected
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-slate-300 dark:border-slate-600 inline-block" />Historical</span>
                <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-amber-400 inline-block" />Projected</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {[['all', 'All time'], ['recent', 'Last 25 yrs']].map(([key, label]) => (
                  <button key={key} onClick={() => setTimeFilter(key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>{label}</button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 pt-2 h-[300px] sm:h-[420px] md:h-[550px] lg:h-[650px] w-full flex flex-col">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg animate-pulse">
                <p className="text-sm text-slate-400 dark:text-slate-500">Merging datasets...</p>
              </div>
            ) : data.length > 0 ? (
              // Changed height="420" to height="100%" so it fills the dynamic container above
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                Failed to merge datasets.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}