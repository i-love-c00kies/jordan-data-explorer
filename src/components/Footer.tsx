import { Link } from 'react-router-dom';

const DATA_SOURCES = [
  { href: 'https://ourworldindata.org', label: 'Our World in Data' },
  { href: 'https://data.worldbank.org', label: 'World Bank' },
  { href: 'https://data.un.org', label: 'United Nations' },
  { href: 'https://www.imf.org/en/Data', label: 'IMF' },
  { href: 'https://www.who.int/data', label: 'WHO' },
  { href: 'https://ilostat.ilo.org/', label: 'ILO' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">JODE</span>
            </Link>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Open-source platform for visualizing Jordan's macroeconomic and demographic data. Built with transparency and reproducibility.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Navigate</p>
            <ul className="space-y-1.5">
              {[['/', 'Home'], ['/overview', 'Overview'], ['/datasets', 'Datasets'], ['/correlations', 'Correlations'], ['/stories', 'Stories']].map(([to, label]) => (
                <li key={to}><Link to={to} className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Sources</p>
            <ul className="space-y-1.5">
              {DATA_SOURCES.map(s => (
                <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{s.label}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[12px] text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} JODE &middot; MIT License</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-500">React &middot; Recharts &middot; Tailwind</p>
        </div>
      </div>
    </footer>
  );
}
