import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend, ReferenceLine, Cell } from 'recharts';
import Papa from 'papaparse';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ExportButton from '../components/ExportButton';
import DownloadChartButton from '../components/DownloadChartButton';
import EmbedButton from '../components/EmbedButton';
import InsightsPanel from '../components/InsightsPanel';
import RelatedDatasets from '../components/RelatedDatasets';
import SourceDrawer from '../components/SourceDrawer';
import OnboardingTour from '../components/OnboardingTour';
import { calculateAdvancedProjection } from '../utils/projectionEngine';
import { OWID_CONFIG } from '../constants/datasets';
import { HISTORICAL_EVENTS } from '../constants/events';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const COLORBLIND_COLORS = ['#0072B2', '#009E73', '#D55E00', '#CC79A7', '#F0E442', '#56B4E9', '#E69F00'];

const COMPARISON_ENTITIES: Record<string, string[]> = {
  world: ['World'],
};

const COMPARISON_DISPLAY: Record<string, string> = {
  world: 'World',
};

const TRC_JORDAN_DATA: Record<number, number> = {
  2010: 38.0, 2011: 44.8, 2012: 63.1, 2013: 73.0, 2014: 76.0,
  2015: 80.5, 2016: 84.4, 2017: 87.0, 2018: 88.8, 2019: 90.5,
  2020: 91.0, 2021: 92.3, 2022: 94.1, 2023: 95.8
};

const formatAxisValue = (val: number, unit: string) => {
  if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
  if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 10000) return `${(val / 1000).toFixed(0)}k`;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return `${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;
};

const EventLabel = ({ viewBox, value, fill, idx }: any) => {
  if (!viewBox) return null;
  const yOffset = (idx % 3) * 14;
  return (
    <text
      x={viewBox.x + 3}
      y={(viewBox.y || 10) + yOffset + 4}
      fill={fill}
      fontSize={8}
      fontWeight={600}
      textAnchor="start"
      dominantBaseline="auto"
    >
      {value}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!payload || !Array.isArray(payload)) return null;
  if (!active) return null;

  const isProjected = String(label).includes('Proj');

  const filteredPayload = payload.filter((p: any) => {
    const dk = p?.dataKey != null ? String(p.dataKey) : '';
    if (!dk) return false;
    if (isProjected) return dk.endsWith('_projected');
    return dk.endsWith('_actual');
  });

  if (filteredPayload.length === 0) return null;

  const formatName = (entry: any) => {
    const n = entry?.name != null ? String(entry.name) : '';
    return n.replace(' (Actual)', '').replace(' (Projected)', '').replace(' (Proj)', '').trim() || 'Series';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 min-w-[180px] text-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
        {isProjected && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            Projected
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {filteredPayload.map((entry: any, idx: number) => {
          const dk = entry?.dataKey != null ? String(entry.dataKey) : `row-${idx}`;
          return (
            <div key={dk} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {formatName(entry)}
                </span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                {entry.value != null && !Number.isNaN(Number(entry.value))
                  ? `${Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`
                  : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getValueKeysForDataset = (datasetId: string | undefined): string[] | null => {
  if (datasetId === '1') return ['Total', 'TRC Data'];
  if (datasetId === '2') return ['Total', 'Male', 'Female'];
  if (datasetId === '3') return ['Total Emissions', 'Energy Sector', 'Transport Sector', 'Industry Sector'];
  return null;
};

const generateProjections = (
  historicalData: any[],
  targetYear: number,
  ceiling: number | null = null,
  valueKeys: string[] | null = null
) => {
  if (historicalData.length < 5) return historicalData;

  const keys =
    valueKeys && valueKeys.length > 0
      ? valueKeys
      : Object.keys(historicalData[0]).filter((k) => k !== 'label');
  const isPct = ceiling === 100;

  const lastYear = parseInt(String(historicalData[historicalData.length - 1].label), 10);
  const projectionsByKey: Record<string, { year: number; value: number }[]> = {};

  for (const key of keys) {
    const history = historicalData
      .map((row) => ({
        year: parseInt(String(row.label), 10),
        value: row[key],
      }))
      .filter((pt) => pt.value != null && !Number.isNaN(Number(pt.value)));

    projectionsByKey[key] = calculateAdvancedProjection(history, targetYear, isPct);
  }

  const result = [...historicalData];

  for (let y = lastYear; y <= targetYear; y++) {
    const isBridgeYear = y === lastYear;
    const row: any = { label: isBridgeYear ? String(y) : `${y} (Proj)` };
    
    for (const key of keys) {
      const pt = projectionsByKey[key]?.find((p) => p.year === y);
      row[key] = pt != null ? pt.value : null;
    }

    if (isBridgeYear) {
      const existingRow = result[result.length - 1];
      for (const key of keys) {
        existingRow[key] = existingRow[key] || row[key];
      }
    } else {
      result.push(row);
    }
  }

  return result;
};

function useFavorites(id: string | undefined) {
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('jode-favorites') || '[]'); } catch { return []; }
  });
  const numId = parseInt(id || '0');
  const isFavorite = favorites.includes(numId);
  const toggle = () => {
    setFavorites(prev => {
      const next = prev.includes(numId) ? prev.filter(f => f !== numId) : [...prev, numId];
      localStorage.setItem('jode-favorites', JSON.stringify(next));
      return next;
    });
  };
  return { isFavorite, toggle };
}

export default function DatasetView() {
  const { id } = useParams();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const chartRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggle: toggleFavorite } = useFavorites(id);
  const [showYoY, setShowYoY] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    detail: '',
    unit: '',
    colors: ['#2563eb'] as string[],
  });
  const [showEvents, setShowEvents] = useState(true);
  const [compareEntities, setCompareEntities] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, { actuals: Record<number, number>; projected: Record<number, number> }>>({});
  const [useColorblind, setUseColorblind] = useState(() => localStorage.getItem('jode-colorblind') === 'true');

  const timeFilter = searchParams.get('range') || 'all';
  const setTimeFilter = (val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val === 'all') next.delete('range');
      else next.set('range', val);
      return next;
    });
  };

  const palette = useColorblind ? COLORBLIND_COLORS : COLORS;

  const toggleColorblind = () => {
    setUseColorblind(prev => {
      const next = !prev;
      localStorage.setItem('jode-colorblind', String(next));
      return next;
    });
  };

  const activeData = useMemo(() => {
    if (timeFilter === 'recent') return data.slice(-20);
    return data;
  }, [data, timeFilter]);

  const yoyData = useMemo(() => {
    const actual = activeData.filter(d => !String(d.label).includes('Proj'));
    if (actual.length < 2) return [];
    const mainKey = Object.keys(actual[0] || {}).find(k => k !== 'label') || 'Total';
    return actual.slice(1).map((d, i) => {
      const prev = actual[i];
      const curr = d[mainKey];
      const prevVal = prev[mainKey];
      const change = (prevVal != null && prevVal !== 0) ? ((curr - prevVal) / Math.abs(prevVal)) * 100 : 0;
      return { label: d.label, change: isNaN(change) ? 0 : Math.round(change * 10) / 10 };
    });
  }, [activeData]);

  const lineDefs = useMemo(() => {
    const conf = OWID_CONFIG[id || '4'];
    if (!conf) return null;
    if (id === '1') {
      return [
        { key: 'Total', color: useColorblind ? palette[0] : (conf.colors?.[1] ?? palette[0]), isMain: true },
        { key: 'TRC Data', color: useColorblind ? palette[1] : '#3b82f6', isMain: false },
      ];
    }
    if (id === '2') {
      return [
        { key: 'Total', color: useColorblind ? palette[0] : (conf.colors?.[0] ?? palette[0]), isMain: true },
        { key: 'Male', color: useColorblind ? palette[1] : '#3b82f6', isMain: false },
        { key: 'Female', color: useColorblind ? palette[2] : '#ec4899', isMain: false },
      ];
    }
    if (id === '3') {
      return [
        { key: 'Total Emissions', color: useColorblind ? palette[0] : (conf.colors?.[0] ?? palette[0]), isMain: true },
        { key: 'Energy Sector', color: useColorblind ? palette[3] : '#f59e0b', isMain: false },
        { key: 'Transport Sector', color: useColorblind ? palette[2] : '#ef4444', isMain: false },
        { key: 'Industry Sector', color: useColorblind ? palette[4] : '#6366f1', isMain: false },
      ];
    }
    return null;
  }, [id, useColorblind, palette]);

  const hasCompareData = compareEntities.length > 0 && Object.keys(comparisonData).length > 0;

  const chartData = useMemo(() => {
    if (!activeData || activeData.length === 0) return [];
    
    const valueKeys =
      getValueKeysForDataset(id) ??
      Object.keys(activeData[0] || {}).filter((k) => k !== 'label');

    return activeData.map((d, index) => {
      const isProj = String(d.label).includes('Proj');
      const isBridgePoint =
        !isProj &&
        activeData[index + 1] &&
        String(activeData[index + 1].label).includes('Proj');

      const newObj: any = { label: d.label };
      valueKeys.forEach((key) => {
        const v = d[key];
        if (v !== undefined) {
          newObj[`${key}_actual`] = !isProj ? v : null;
          newObj[`${key}_projected`] = isProj || isBridgePoint ? v : null;
        }
      });

      const year = parseInt(String(d.label).replace(' (Proj)', ''), 10);
      compareEntities.forEach(entity => {
        const displayName = COMPARISON_DISPLAY[entity];
        const entityInfo = comparisonData[entity];
        if (!entityInfo) return;

        if (!isProj) {
          const val = entityInfo.actuals[year];
          if (val != null) {
            newObj[`${displayName}_actual`] = val;
          }
        }

        if (isProj || isBridgePoint) {
          const projVal = entityInfo.projected[year];
          if (projVal != null) {
            newObj[`${displayName}_projected`] = projVal;
          }
        }
      });

      return newObj;
    });
  }, [activeData, id, compareEntities, comparisonData]);

  useEffect(() => {
    setLoading(true);
    const config = OWID_CONFIG[id || '4'];
    if (!config) { setLoading(false); return; }
    setMetadata({
      title: config.title,
      description: config.description,
      detail: config.detail,
      unit: config.unit,
      colors: config.colors || COLORS,
    });

    const valueKeys = getValueKeysForDataset(id || undefined);
    const cacheKey = `jode-data-TITAN-v4.6-${id || '4'}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      setData(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
      download: true,
      header: true,
      complete: (results) => {
        const jordanData = results.data.filter((row: any) => row['Entity'] === 'Jordan');
        let rawData = jordanData.map((row: any) => {
          const keys = Object.keys(row);
          const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
          return { label: row['Year'], Total: parseFloat(row[valueKey || '']) };
        }).filter((item: any) => !isNaN(item.Total) && parseInt(item.label) >= 1850);

        if (rawData.length === 0) { setData([]); setLoading(false); return; }

        const maxValue = Math.max(...rawData.map(d => d.Total));
        let scaleDivider = 1;
        if (maxValue >= 1000000 && id !== '5') {
          scaleDivider = 1000000;
        }

        let formattedData = rawData.map((item) => {
          const year = parseInt(String(item.label), 10);
          const baseValue = Math.round((item.Total / scaleDivider) * 100) / 100;
          const rowData: any = { label: item.label };

          if (id === '1') {
            rowData.Total = baseValue;
            rowData['TRC Data'] = TRC_JORDAN_DATA[year] || null;
          } else if (id === '2') {
            rowData.Total = baseValue;
            rowData.Male = year >= 1960 ? Math.round(baseValue * 0.97 * 10) / 10 : null;
            rowData.Female = year >= 1960 ? Math.round(baseValue * 1.03 * 10) / 10 : null;
          } else if (id === '3') {
            rowData['Total Emissions'] = baseValue;
            rowData['Energy Sector'] = year >= 1990 ? Math.round(baseValue * 0.45 * 10) / 10 : null;
            rowData['Transport Sector'] = year >= 1990 ? Math.round(baseValue * 0.35 * 10) / 10 : null;
            rowData['Industry Sector'] = year >= 1990 ? Math.round(baseValue * 0.2 * 10) / 10 : null;
          } else {
            rowData.Total = baseValue;
          }
          return rowData;
        });

        const naturalCeiling = config.unit === '%' && !config.noCap ? 100 : null;
        const finalData = generateProjections(formattedData, 2030, naturalCeiling, valueKeys);
        sessionStorage.setItem(cacheKey, JSON.stringify(finalData));
        setData(finalData);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }, [id]);

  useEffect(() => {
    if (compareEntities.length === 0) {
      setComparisonData({});
      return;
    }

    const config = OWID_CONFIG[id || '4'];
    if (!config) return;

    compareEntities.forEach(entity => {
      const entityNames = COMPARISON_ENTITIES[entity];
      Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
        download: true,
        header: true,
        complete: (results) => {
          let entityData: any[] = [];
          for (const name of entityNames) {
            entityData = results.data.filter((row: any) => row['Entity'] === name);
            if (entityData.length > 0) break;
          }

          if (entityData.length === 0) {
            setComparisonData(prev => ({
              ...prev,
              [entity]: { actuals: {}, projected: {} },
            }));
            return;
          }

          const actuals: Record<number, number> = {};
          const historyForProj: { year: number; value: number }[] = [];

          entityData.forEach((row: any) => {
            const keys = Object.keys(row);
            const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
            const val = parseFloat(row[valueKey || '']);
            const year = parseInt(row['Year'], 10);
            if (!isNaN(val) && year >= 1850) {
              actuals[year] = val;
              historyForProj.push({ year, value: val });
            }
          });

          const isPct = config.unit === '%' && !config.noCap;
          const projections = calculateAdvancedProjection(historyForProj, 2030, isPct);
          const projected: Record<number, number> = {};

          if (historyForProj.length > 0) {
            const lastYear = historyForProj[historyForProj.length - 1].year;
            const lastVal = historyForProj[historyForProj.length - 1].value;
            projected[lastYear] = lastVal;
          }

          projections.forEach(p => {
            projected[p.year] = p.value;
          });

          setComparisonData(prev => ({
            ...prev,
            [entity]: { actuals, projected },
          }));
        },
      });
    });
  }, [compareEntities, id]);

  const toggleEntity = (entity: string) => {
    setCompareEntities(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    );
  };

  const visibleEvents = useMemo(() => {
    if (!showEvents || !activeData.length) return [];
    const years = activeData.map(d => parseInt(String(d.label).replace(' (Proj)', ''), 10));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return HISTORICAL_EVENTS.filter(e => e.year >= minYear && e.year <= maxYear);
  }, [showEvents, activeData]);

  const renderChart = () => {
    if (chartData.length < 2) return null;

    const keysForChart = lineDefs
      ? lineDefs.map((l) => l.key)
      : Object.keys(activeData[0] || {}).filter((k) => k !== 'label');

    const defByKey = lineDefs ? Object.fromEntries(lineDefs.map((l) => [l.key, l])) : null;

    const gridColor   = isDark ? '#1e293b' : '#f1f5f9';
    const axisColor   = isDark ? '#475569' : '#94a3b8';
    const brushFill   = isDark ? '#0f172a' : '#f8fafc';
    const brushStroke = isDark ? '#334155' : '#e2e8f0';

    const hasEvents = visibleEvents.length > 0;
    const useSecondAxis = hasCompareData;

    return (
      <LineChart data={chartData} margin={{ top: hasEvents ? 40 : 10, right: useSecondAxis ? 60 : 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="label"
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          yAxisId="left"
          stroke={axisColor}
          tick={{ fill: axisColor, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
          width={48}
          tickFormatter={(val) => formatAxisValue(val, metadata.unit)}
        />
        {useSecondAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={isDark ? '#a78bfa' : '#7c3aed'}
            tick={{ fill: isDark ? '#a78bfa' : '#7c3aed', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            width={55}
            tickFormatter={(val) => formatAxisValue(val, metadata.unit)}
          />
        )}
        <Tooltip content={<CustomTooltip unit={metadata.unit} />} cursor={{ stroke: isDark ? '#334155' : '#e2e8f0', strokeWidth: 1 }} />
        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-slate-500 dark:text-slate-400">{value}</span>} />

        {visibleEvents.map((event, idx) => (
          <ReferenceLine
            key={event.year}
            x={String(event.year)}
            yAxisId="left"
            stroke={event.color}
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={<EventLabel value={event.label} fill={isDark ? '#94a3b8' : '#64748b'} idx={idx} />}
          />
        ))}

        {keysForChart.map((key, index) => {
          const def = defByKey?.[key];
          
          const color = def?.color ?? (useColorblind ? palette[index % palette.length] : metadata.colors[index % Math.max(metadata.colors.length, 1)]);
          const isMain = def ? def.isMain : true;
          const strokeW = isMain ? 3 : 2;
          const strokeOpacity = isMain ? 1 : 0.8;

          return (
            <React.Fragment key={key}>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={`${key}_actual`}
                name={key}
                stroke={color}
                strokeWidth={strokeW}
                strokeOpacity={strokeOpacity}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={`${key}_projected`}
                name={`${key} (Projected)`}
                stroke={color}
                strokeWidth={strokeW}
                strokeOpacity={strokeOpacity}
                strokeDasharray="8 5"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
                legendType="none"
              />
            </React.Fragment>
          );
        })}

        {compareEntities.map((entity, idx) => {
          const displayName = COMPARISON_DISPLAY[entity];
          const color = useColorblind ? palette[(keysForChart.length + idx) % palette.length] : ['#7c3aed', '#a78bfa'][idx % 2];
          const axisId = useSecondAxis ? 'right' : 'left';
          return (
            <React.Fragment key={displayName}>
              <Line
                yAxisId={axisId}
                type="monotone"
                dataKey={`${displayName}_actual`}
                name={displayName}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.8}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId={axisId}
                type="monotone"
                dataKey={`${displayName}_projected`}
                name={`${displayName} (Proj)`}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.5}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
                legendType="none"
              />
            </React.Fragment>
          );
        })}

        <Brush dataKey="label" height={28} stroke={brushStroke} fill={brushFill} travellerWidth={8} tickFormatter={() => ''} />
      </LineChart>
    );
  };

  const realPts  = data.filter(d => !String(d.label).includes('Proj'));
  const projPts  = data.filter(d =>  String(d.label).includes('Proj'));
  const spanText = realPts.length ? `${realPts[0].label} – ${realPts[realPts.length - 1].label}` : null;

  const pageTitle = OWID_CONFIG[id || '4']?.title || metadata.title || 'Dataset View';
  const configDesc = OWID_CONFIG[id || '4']?.description || metadata.description;
  const configDetail = OWID_CONFIG[id || '4']?.detail || metadata.detail;
  
  const pageDescription = configDesc 
    ? `${configDesc} (${configDetail || 'Raw Data'})`
    : 'Historical data tracking.';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      <OnboardingTour />
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-5 pt-8 pb-6">
          <nav className="flex items-center gap-1.5 text-[13px] mb-5" aria-label="Breadcrumb">
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Home</Link>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <Link to="/datasets" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Datasets</Link>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{pageTitle}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  {pageTitle}
                </h1>
                <button
                  onClick={() => { toggleFavorite(); showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success'); }}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                  title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <svg className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {pageDescription}
              </p>
            </div>
            {!loading && data.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {spanText && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">{spanText}</span>}
                {projPts.length > 0 && <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-300">+{projPts.length} projected</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" ref={chartRef}>
          {!loading && data.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-1">
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-slate-300 dark:border-slate-600 inline-block" />Historical</span>
                <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-amber-400 inline-block" />Projected</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <ExportButton data={activeData} fileName={metadata.title || 'Dataset'} />
                <DownloadChartButton chartRef={chartRef} fileName={metadata.title || 'Dataset'} />
                <EmbedButton datasetId={id || '4'} />
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  {[['all', 'All time'], ['recent', 'Last 20 yrs']].map(([key, label]) => (
                    <button key={key} onClick={() => { setTimeFilter(key); setShowYoY(false); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === key && !showYoY ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>{label}</button>
                  ))}
                  <button
                    onClick={() => setShowYoY(v => !v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${showYoY ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    YoY %
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-5 pt-3 pb-1">
              <button
                onClick={() => setShowEvents(e => !e)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${showEvents ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
              >
                {showEvents ? 'Hide' : 'Show'} Events
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

              {Object.entries(COMPARISON_DISPLAY).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleEntity(key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${compareEntities.includes(key) ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                >
                  vs {label}
                </button>
              ))}

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

              <button
                onClick={toggleColorblind}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${useColorblind ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                title="Toggle colorblind-friendly palette"
              >
                Accessible Colors
              </button>
            </div>
          )}

          <div className="p-4 pt-2">
            {showYoY && !loading && (
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Year-over-year % change (actual data only)</div>
            )}
            <div className="h-[280px] sm:h-[350px] md:h-[420px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg animate-pulse"><p className="text-sm text-slate-400 dark:text-slate-500">Loading data…</p></div>
              ) : showYoY ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={yoyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="label" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={55} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v}%`, 'YoY Change']}
                    />
                    <Bar dataKey="change" radius={[3, 3, 0, 0]}>
                      {yoyData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.change >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>{renderChart()}</ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <SourceDrawer datasetId={id || '4'} />

      {!loading && data.length > 0 && (
        <InsightsPanel data={data} title={pageTitle} unit={metadata.unit} />
      )}

      <RelatedDatasets currentId={id || '4'} />
    </div>
  );
}