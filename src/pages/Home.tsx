import { Link } from 'react-router-dom';

// ─── Marquee sources ──────────────────────────────────────────────────────────

const SOURCES = [
  { abbr: 'World Bank', full: 'The World Bank'                         },
  { abbr: 'OWID',       full: 'Our World in Data'                      },
  { abbr: 'UN',         full: 'United Nations'                         },
  { abbr: 'IMF',        full: 'International\nMonetary Fund'           },
  { abbr: 'WHO',        full: 'World Health\nOrganization'             },
  { abbr: 'ILO',        full: 'International\nLabour Organization'     },
  { abbr: 'FAO',        full: 'Food & Agriculture\nOrganization'       },
  { abbr: 'Ember',      full: 'Ember Climate'                          },
  { abbr: 'ITU',        full: 'International\nTelecommunication Union' },
  { abbr: 'TRC',        full: 'Telecom Regulatory\nCommission Jordan'  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    title: '24+ Datasets',
    desc: 'Deep-dive into Jordan’s technology, health, environment, and economic sectors.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    title: 'Multi-Indicator Compare',
    desc: 'Overlay disparate metrics (like GDP vs. Education) on a unified timeline to discover hidden correlations.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    title: 'Titan Forecasting',
    desc: 'Forward estimates to 2030 using Holt-Linear smoothing, accounting for momentum and natural saturation.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
    title: 'Open Source',
    desc: 'Built with transparency. Contributions and dataset corrections are always welcome on GitHub.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-inner {
          display: flex;
          align-items: center;
          width: max-content;
          animation: marquee 40s linear infinite;
          will-change: transform;
        }
        .marquee-fade-l {
          background: linear-gradient(to right, white 0%, transparent 100%);
        }
        .marquee-fade-r {
          background: linear-gradient(to left, white 0%, transparent 100%);
        }
        :root.dark .marquee-fade-l {
          background: linear-gradient(to right, #020617 0%, transparent 100%);
        }
        :root.dark .marquee-fade-r {
          background: linear-gradient(to left, #020617 0%, transparent 100%);
        }
      `}</style>

      <div className="flex flex-col grow bg-white dark:bg-slate-950">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto px-5 py-10 md:py-20 lg:py-28">
            <div className="max-w-3xl">

              <a
                href="https://github.com/i-love-c00kies/jordan-data-explorer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors mb-8"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Open source on GitHub
                <span className="text-slate-400 dark:text-slate-500">→</span>
              </a>

              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  System Live: Data Synced {new Date().toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6 uppercase">
                <span className="text-slate-900 dark:text-white">Jordan Open</span>
                <br />
                <span className="text-blue-600 dark:text-blue-400">Data Explorer</span>
              </h1>

              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-xl">
                Interactive visualizations of Jordan's macroeconomic and demographic
                indicators — spanning over 175 years of historical data with
                forward projections built in.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/datasets"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Browse datasets
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="https://github.com/i-love-c00kies/jordan-data-explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Contribute
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sources Marquee ───────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 overflow-hidden">
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 mb-7 select-none">
            Verified data from
          </p>

          <div className="relative overflow-hidden">
            {/* Edge fades */}
            <div className="marquee-fade-l pointer-events-none absolute left-0 top-0 h-full w-32 z-10" />
            <div className="marquee-fade-r pointer-events-none absolute right-0 top-0 h-full w-32 z-10" />

            {/* Scrolling track — duplicated once for seamless loop */}
            <div className="marquee-inner">
              {[...SOURCES, ...SOURCES].map((s, i) => (
                <div key={i} className="flex items-center shrink-0 select-none">
                  <div className="flex flex-col justify-center px-10">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-600 leading-none mb-1.5">
                      {s.abbr}
                    </span>
                    <span className="text-base font-semibold text-slate-700 dark:text-slate-300 leading-snug whitespace-pre-line">
                      {s.full}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature grid ───────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Methodology ────────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
          <div className="max-w-6xl mx-auto px-5 py-20">

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">How it works</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
                JODE fetches live data from primary sources and processes it in-browser using our 
                unified analytical pipeline.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

              {/* Card 1: The Math (Titan Engine) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
                <div className="flex flex-col h-full">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Titan Forecasting</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 grow">
                    We use <b>Holt-Linear Smoothing</b> to project trends to 2030. It independently tracks 
                    "level" and "velocity" to handle Jordan's unique economic momentum.
                  </p>
                  <div className="rounded-lg bg-slate-900 dark:bg-black p-3 font-mono text-[9px] text-blue-400 border border-slate-800 leading-tight">
                    Level: ℓₜ = αyₜ + (1-α)(ℓₜ₋₁ + bₜ₋₁)
                    <br />
                    Trend: bₜ = β(ℓₜ - ℓₜ₋₁) + (1-β)bₜ₋₁
                  </div>
                </div>
              </div>

              {/* Card 2: THE ORIGINAL CARD (Source Layering) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
                <div className="flex flex-col h-full">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Source Layering</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 grow">
                    Some indicators blend multiple sources — combining global <b>OWID</b> baseline data 
                    with local <b>TRC Jordan</b> administrative proxies for the most accurate 
                    modern picture.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['OWID', 'World Bank', 'TRC Jordan', 'UN'].map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: New Feature (Multiple Lines) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
                <div className="flex flex-col h-full">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Relational Logic</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed grow">
                    Our <b>Multiple Line</b> comparison uses Dual-Axis scaling. This allows you 
                    to view disparate units (like USD vs. Percentages) on a single chart without 
                    data clipping or losing perspective.
                  </p>
                  <div className="mt-6 flex items-center gap-1.5">
                    <div className="h-1 flex-1 bg-blue-500 rounded-full" />
                    <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
                    <div className="h-1 flex-1 bg-amber-500 rounded-full" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
}