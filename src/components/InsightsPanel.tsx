interface InsightsPanelProps {
  data: any[];
  title: string;
  unit: string;
}

export default function InsightsPanel({ data, title, unit }: InsightsPanelProps) {
  if (!data || data.length < 5) return null;

  const realData = data.filter(d => !String(d.label).includes('Proj'));
  const projData = data.filter(d => String(d.label).includes('Proj'));
  
  const valueKey = Object.keys(realData[0] || {}).find(k => k !== 'label' && typeof realData[0][k] === 'number') || 'Total';

  const values = realData.map(d => d[valueKey]).filter((v: any) => v != null && !isNaN(v));
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstYear = realData[0]?.label;
  const lastYear = realData[realData.length - 1]?.label;
  
  const totalChange = last - first;
  const pctChange = first !== 0 ? ((totalChange / Math.abs(first)) * 100) : 0;
  const direction = totalChange > 0 ? 'increased' : totalChange < 0 ? 'decreased' : 'remained stable';
  const absChange = Math.abs(pctChange);

  const recentValues = values.slice(-10);
  const recentFirst = recentValues[0];
  const recentLast = recentValues[recentValues.length - 1];
  const recentPctChange = recentFirst !== 0 ? (((recentLast - recentFirst) / Math.abs(recentFirst)) * 100) : 0;
  const recentDirection = recentPctChange > 0 ? 'accelerating' : recentPctChange < 0 ? 'decelerating' : 'stable';

  let projInsight = '';
  if (projData.length > 0) {
    const projLast = projData[projData.length - 1]?.[valueKey];
    const projYear = String(projData[projData.length - 1]?.label).replace(' (Proj)', '');
    if (projLast != null) {
      const projChange = projLast - last;
      const projDir = projChange > 0 ? 'rise' : 'decline';
      projInsight = `Projected to ${projDir} to ${Number(projLast).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit} by ${projYear}.`;
    }
  }

  const fmt = (v: number) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 });

  const insights = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      ),
      title: 'Overall Trend',
      text: `${title} ${direction} by ${fmt(absChange)}% from ${firstYear} to ${lastYear}, moving from ${fmt(first)}${unit} to ${fmt(last)}${unit}.`,
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
        </svg>
      ),
      title: 'Range',
      text: `Historical low of ${fmt(min)}${unit} and high of ${fmt(max)}${unit} across the full dataset.`,
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: 'Recent Momentum',
      text: `The recent trend (last 10 data points) is ${recentDirection} with a ${fmt(Math.abs(recentPctChange))}% shift.`,
    },
  ];

  if (projInsight) {
    insights.push({
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
      ),
      title: 'Projection',
      text: projInsight,
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pb-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
          Indicator Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div key={insight.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">{insight.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
