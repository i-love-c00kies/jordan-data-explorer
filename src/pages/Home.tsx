import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SOURCES = [
  { abbr: 'World Bank', full: 'The World Bank' },
  { abbr: 'OWID', full: 'Our World in Data' },
  { abbr: 'UN', full: 'United Nations' },
  { abbr: 'IMF', full: 'International Monetary Fund' },
  { abbr: 'WHO', full: 'World Health Organization' },
  { abbr: 'ILO', full: 'International Labour Org' },
  { abbr: 'FAO', full: 'Food & Agriculture Org' },
  { abbr: 'Ember', full: 'Ember Climate' },
  { abbr: 'ITU', full: 'Intl Telecomm Union' },
  { abbr: 'TRC', full: 'TRC Jordan' },
];

const CAPABILITIES = [
  {
    title: '100 Datasets',
    desc: 'Technology, health, environment, economy, demographics, infrastructure, education, governance, and trade.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>,
    color: 'blue',
  },
  {
    title: 'Correlation Engine',
    desc: 'Discover hidden relationships across datasets with interactive heatmaps and regression analysis.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>,
    color: 'violet',
  },
  {
    title: 'Anomaly Detection',
    desc: 'Statistical outlier detection flags unusual patterns and explains likely causes automatically.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
    color: 'amber',
  },
  {
    title: 'Titan Forecasting',
    desc: 'Holt-Linear smoothing projects trends to 2030, accounting for momentum and natural saturation.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>,
    color: 'emerald',
  },
  {
    title: 'Data Stories',
    desc: 'Pre-built interactive narratives walking through Jordan\'s transformation with animated charts.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
    color: 'rose',
  },
  {
    title: 'Open Source',
    desc: 'Fully transparent methodology. Contributions and dataset corrections welcome on GitHub.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
    color: 'slate',
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', icon: 'bg-blue-100 dark:bg-blue-900/50' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', icon: 'bg-violet-100 dark:bg-violet-900/50' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', icon: 'bg-amber-100 dark:bg-amber-900/50' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', icon: 'bg-emerald-100 dark:bg-emerald-900/50' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', icon: 'bg-rose-100 dark:bg-rose-900/50' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-600 dark:text-slate-400', icon: 'bg-slate-100 dark:bg-slate-800' },
};

export default function Home() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(heroSearch.trim() ? `/datasets?q=${encodeURIComponent(heroSearch.trim())}` : '/datasets');
  };

  return (
    <div className="flex flex-col grow">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/40 to-transparent dark:from-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Live &middot; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight leading-[1.1] mb-5 animate-fade-in-delay-1">
              <span className="text-slate-900 dark:text-white">Jordan's data,</span>
              <br />
              <span className="text-slate-900 dark:text-white">visualized.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-lg animate-fade-in-delay-2">
              100 indicators spanning 175 years of history with forward projections to 2030. Correlation analysis, anomaly detection, and interactive narratives.
            </p>

            <form onSubmit={handleHeroSearch} className="flex items-center gap-2 mb-6 max-w-md animate-fade-in-delay-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg transition-colors shrink-0">
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2.5 animate-fade-in-delay-3">
              <Link to="/overview" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                Explore overview
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
              <Link to="/datasets" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                Browse datasets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 py-6 overflow-hidden">
        <p className="text-center text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 mb-5">
          Verified data from
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-slate-50/90 dark:from-slate-900/90 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-slate-50/90 dark:from-slate-900/90 to-transparent" />
          <div className="marquee-track">
            {[...SOURCES, ...SOURCES].map((s, i) => (
              <div key={i} className="flex items-center shrink-0">
                <span className="px-6 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{s.full}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Platform capabilities</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Everything you need to understand Jordan's trajectory.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((f) => {
              const c = COLOR_MAP[f.color];
              return (
                <div key={f.title} className={`rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${c.bg}`}>
                  <div className={`w-8 h-8 rounded-lg ${c.icon} ${c.text} flex items-center justify-center mb-3`}>{f.icon}</div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">How it works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Live data from primary sources, processed in-browser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-5">
              <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Forecasting</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Titan Engine</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Holt-Linear Smoothing independently tracks level and velocity to handle Jordan's unique economic momentum.
              </p>
              <div className="rounded-lg bg-slate-900 dark:bg-black p-3 font-mono text-[10px] text-blue-400 border border-slate-800 leading-relaxed">
                Level: l_t = ay_t + (1-a)(l_t-1 + b_t-1)<br />
                Trend: b_t = B(l_t - l_t-1) + (1-B)b_t-1
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-5">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Data pipeline</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Source Layering</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Blends global OWID baseline data with local TRC Jordan administrative proxies for maximum accuracy.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['OWID', 'World Bank', 'TRC', 'UN', 'WHO', 'IMF'].map(s => (
                  <span key={s} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold tracking-wide">{s}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-5">
              <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3">Visualization</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Dual-Axis Scaling</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Compare disparate units (USD vs. %) on a single chart without data clipping or losing perspective.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1 flex-1 bg-blue-500 rounded-full" />
                <div className="h-1 flex-1 bg-violet-500 rounded-full" />
                <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
