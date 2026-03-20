import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Jordan Data Explorer
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            An open-source initiative providing high-fidelity macroeconomic, demographic, and environmental data for the Hashemite Kingdom of Jordan.
          </p>
        </div>
        
        <div>
          <h4 className="text-slate-50 font-semibold mb-4">Data Sources</h4>
          {/* Replaced static text with functional external links */}
          <ul className="space-y-3 text-sm flex flex-col">
            <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> World Bank Open Data
            </a>
            <a href="https://ourworldindata.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> Our World in Data (OWID)
            </a>
            <a href="https://trc.gov.jo/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> Telecom Regulatory Commission (TRC)
            </a>
            <a href="https://population.un.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> UN Population Division
            </a>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-50 font-semibold mb-4">Navigation</h4>
          <ul className="space-y-3 text-sm flex flex-col">
            <Link to="/" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> Home
            </Link>
            <Link to="/datasets" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> Data Catalog
            </Link>
            <a href="https://github.com/i-love-c00kies/jordan-data-explorer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors w-fit flex items-center gap-2">
              <span className="text-slate-600">&rarr;</span> Contribute
            </a>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} JODE. All data subject to respective source licenses.</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational</span>
        </div>
      </div>
    </footer>
  );
}