import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-5 py-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <img src="/jode-logo.svg" className="w-9 h-9" alt="JODE" />
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Jordan Open Data Explorer</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-4">
              Jordan Open Data Explorer — an open-source platform for visualizing
              Jordan's macroeconomic and demographic data. Built with transparency
              and reproducibility in mind.
            </p>
            <a
              href="https://github.com/i-love-c00kies/jordan-data-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View on GitHub
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Navigation</p>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/datasets" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Data Catalog</Link>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Data Sources</p>
            <ul className="space-y-2">
              {[
                ['https://ourworldindata.org', 'Our World in Data'],
                ['https://data.worldbank.org', 'World Bank'],
                ['https://data.un.org', 'United Nations'],
                ['https://www.imf.org/en/Data', 'IMF'],
                ['https://www.who.int/data', 'WHO'],
                ['https://ilostat.ilo.org/', 'ILOSTAT'],
                ['https://www.fao.org/faostat/', 'FAOSTAT'],
                ['https://ember-climate.org/', 'Ember'],
                ['https://www.itu.int', 'ITU'],
                ['https://childmortality.org', 'UNIGME'],
                ['https://www.trc.gov.jo', 'TRC Jordan'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} JODE — Jordan Open Data Explorer · MIT License
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Built with React, Recharts & Tailwind
          </p>
        </div>
      </div>
    </footer>
  );
}