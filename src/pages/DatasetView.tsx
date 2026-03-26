import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFavorites } from '../hooks/useFavorites';
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

const HeatmapGrid = ({ data, mainKey, unit, isDark }: { data: any[]; mainKey: string; unit: string; isDark: boolean }) => {
  const values = data.map(d => d[mainKey]).filter((v): v is number => v != null && !isNaN(v));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const [hovered, setHovered] = useState<{ year: string; value: number } | null>(null);

  const getColor = (value: number | null) => {
    if (value == null || isNaN(value)) return isDark ? '#1e293b' : '#f1f5f9';
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    if (isDark) {
      const r = Math.round(30 + ratio * (37 - 30));
      const g = Math.round(41 + ratio * (99 - 41));
      const b = Math.round(59 + ratio * (235 - 59));
      return `rgb(${r},${g},${b})`;
    }
    const r = Math.round(219 + ratio * (37 - 219));
    const g = Math.round(234 + ratio * (99 - 234));
    const b = Math.round(254 + ratio * (235 - 254));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500">
        <span>Color intensity by value — lighter = lower, darker = higher</span>
        {hovered ? (
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {hovered.year}: {hovered.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{unit}
          </span>
        ) : (
          <span>Hover a cell for details</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {data.map(d => {
          const val = d[mainKey];
          return (
            <div
              key={d.label}
              style={{ backgroundColor: getColor(val), width: '30px', height: '30px' }}
              className="rounded-sm cursor-default transition-all hover:scale-110 hover:z-10 relative flex items-end justify-center"
              onMouseEnter={() => val != null && !isNaN(val) && setHovered({ year: String(d.label), value: val })}
              onMouseLeave={() => setHovered(null)}
              title={`${d.label}: ${val != null ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}${unit}`}
            >
              <span className="text-[8px] font-medium text-white/70 mb-0.5 select-none">
                {String(d.label).slice(-2)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500">Low</span>
        <div className="h-2 w-32 rounded-full" style={{
          background: isDark
            ? 'linear-gradient(to right, rgb(30,41,59), rgb(37,99,235))'
            : 'linear-gradient(to right, rgb(219,234,254), rgb(37,99,235))',
        }} />
        <span className="text-xs text-slate-400 dark:text-slate-500">High</span>
      </div>
    </div>
  );
};

export default function DatasetView() {
  const { id } = useParams();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const chartRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite: isFavById, toggle: toggleFavorite } = useFavorites();
  const numId = parseInt(id || '0');
  const isFavorite = isFavById(numId);
  const [showYoY, setShowYoY] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [tableSortKey, setTableSortKey] = useState<'year' | 'value' | 'change'>('year');
  const [tableSortAsc, setTableSortAsc] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const tableData = useMemo(() => {
    const actual = data.filter(d => !String(d.label).includes('Proj'));
    if (actual.length === 0) return [];
    const mainKey = Object.keys(actual[0]).find(k => k !== 'label') || 'Total';
    return actual.map((d, i) => {
      const year = parseInt(String(d.label), 10);
      const value = d[mainKey] as number | null;
      const prev5Row = i >= 5 ? actual[i - 5] : null;
      const prev5Val = prev5Row ? (prev5Row[mainKey] as number | null) : null;
      const change5 =
        value != null && prev5Val != null && prev5Val !== 0
          ? ((value - prev5Val) / Math.abs(prev5Val)) * 100
          : null;
      return { year, value, change5, mainKey };
    });
  }, [data]);

  const sortedTableData = useMemo(() => {
    const sorted = [...tableData].sort((a, b) => {
      if (tableSortKey === 'year') return tableSortAsc ? a.year - b.year : b.year - a.year;
      if (tableSortKey === 'value') {
        const av = a.value ?? -Infinity;
        const bv = b.value ?? -Infinity;
        return tableSortAsc ? av - bv : bv - av;
      }
      const ac = a.change5 ?? -Infinity;
      const bc = b.change5 ?? -Infinity;
      return tableSortAsc ? ac - bc : bc - ac;
    });
    return sorted;
  }, [tableData, tableSortKey, tableSortAsc]);

  const handleTableSort = (key: 'year' | 'value' | 'change') => {
    if (tableSortKey === key) {
      setTableSortAsc(v => !v);
    } else {
      setTableSortKey(key);
      setTableSortAsc(true);
    }
  };

  const downloadCSV = () => {
    const unit = metadata.unit;
    const rows = [['Year', `${metadata.title} (${unit || 'Value'})`, '5-yr Change %']];
    tableData.forEach(d => {
      rows.push([
        String(d.year),
        d.value != null ? String(d.value) : '',
        d.change5 != null ? `${d.change5.toFixed(1)}` : '',
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '-').toLowerCase()}-jordan.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded', 'success');
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setExportingPdf(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(chartRef.current, { cacheBust: true });

      const actual = data.filter(d => !String(d.label).includes('Proj'));
      const projRows = data.filter(d => String(d.label).includes('Proj'));
      const mainKey = actual.length > 0 ? (Object.keys(actual[0]).find(k => k !== 'label') || 'Total') : 'Total';
      const latestRow = actual[actual.length - 1];
      const latestValue = latestRow ? latestRow[mainKey] : null;
      const proj2030 = projRows.find(d => String(d.label).startsWith('2030'));
      const proj2030Value = proj2030 ? proj2030[mainKey] : null;

      const win = window.open('', '_blank');
      if (!win) {
        showToast('Popup blocked — please allow popups for PDF export', 'error');
        setExportingPdf(false);
        return;
      }

      win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${metadata.title} — JODE</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui,-apple-system,sans-serif; padding: 40px; color: #1e293b; background: #fff; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; color: #0f172a; }
  .subtitle { font-size: 13px; color: #64748b; margin-bottom: 8px; }
  .desc { font-size: 13px; color: #475569; margin-bottom: 24px; line-height: 1.6; max-width: 700px; }
  .chart-img { width: 100%; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 24px; display: block; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; min-width: 160px; }
  .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }
  .stat-unit { font-size: 13px; font-weight: 400; color: #64748b; }
  .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 8px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>${metadata.title}</h1>
<p class="subtitle">Jordan · Source: Our World in Data</p>
<p class="desc">${configDesc || ''}</p>
<img src="${dataUrl}" class="chart-img" alt="${metadata.title} chart" />
<div class="stats">
  ${latestValue != null ? `<div class="stat"><div class="stat-label">Latest Value</div><div class="stat-value">${Number(latestValue).toLocaleString(undefined,{maximumFractionDigits:2})}<span class="stat-unit"> ${metadata.unit}</span></div></div>` : ''}
  ${proj2030Value != null ? `<div class="stat"><div class="stat-label">2030 Projection</div><div class="stat-value">${Number(proj2030Value).toLocaleString(undefined,{maximumFractionDigits:2})}<span class="stat-unit"> ${metadata.unit}</span></div></div>` : ''}
  ${actual.length > 0 ? `<div class="stat"><div class="stat-label">Data Span</div><div class="stat-value" style="font-size:18px">${actual[0].label}–${actual[actual.length-1].label}</div></div>` : ''}
</div>
<div class="footer">Generated by JODE (Jordan Data Explorer) &mdash; ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
<script>window.onload = () => { setTimeout(() => window.print(), 600); }<\/script>
</body>
</html>`);
      win.document.close();
    } catch {
      showToast('Failed to generate PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

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
                  onClick={() => { toggleFavorite(numId); showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success'); }}
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
                <Link
                  to={`/compare?ids=${id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Add to Compare
                </Link>
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
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  title="Print / Save as PDF — opens a print-ready summary in a new tab"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingPdf ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  )}
                  PDF
                </button>
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

      {/* Heatmap Panel */}
      {!loading && data.length > 0 && (() => {
        const actual = data.filter(d => !String(d.label).includes('Proj'));
        if (actual.length === 0) return null;
        const mainKey = Object.keys(actual[0]).find(k => k !== 'label') || 'Total';
        return (
          <div className="max-w-5xl mx-auto px-5 pb-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowHeatmap(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                  </svg>
                  Heatmap Calendar
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{actual.length} years</span>
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showHeatmap ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showHeatmap && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="pt-4">
                    <HeatmapGrid data={actual} mainKey={mainKey} unit={metadata.unit} isDark={isDark} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Data Table Panel */}
      {!loading && sortedTableData.length > 0 && (
        <div className="max-w-5xl mx-auto px-5 pb-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5">
              <button
                onClick={() => setShowDataTable(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-1.5 0H3.375" />
                </svg>
                Data Table
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{sortedTableData.length} rows</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDataTable ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-semibold transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download CSV
              </button>
            </div>

            {showDataTable && (
              <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      {(['year', 'value', 'change'] as const).map(col => (
                        <th
                          key={col}
                          onClick={() => handleTableSort(col)}
                          className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            {col === 'year' ? 'Year' : col === 'value' ? `Value (${metadata.unit || '—'})` : '5-yr Change'}
                            <span className="text-slate-300 dark:text-slate-600">
                              {tableSortKey === col ? (tableSortAsc ? ' ↑' : ' ↓') : ' ↕'}
                            </span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedTableData.map(row => (
                      <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-2.5 font-mono text-xs font-medium text-slate-700 dark:text-slate-200 tabular-nums">{row.year}</td>
                        <td className="px-5 py-2.5 font-mono text-xs text-slate-900 dark:text-white tabular-nums">
                          {row.value != null ? row.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs tabular-nums">
                          {row.change5 != null ? (
                            <span className={row.change5 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                              {row.change5 >= 0 ? '+' : ''}{row.change5.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <SourceDrawer datasetId={id || '4'} />

      {!loading && data.length > 0 && (
        <InsightsPanel data={data} title={pageTitle} unit={metadata.unit} />
      )}

      <RelatedDatasets currentId={id || '4'} />
    </div>
  );
}