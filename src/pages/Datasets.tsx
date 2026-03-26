import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(CATALOG_DATA.map(d => d.category)))];

export default function Datasets() {
  const navigate = useNavigate();
  const [active, setActive] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => {
    const q = searchParams.get('q');
    return q || '';
  });

  // Extract currently compared IDs directly from URL
  const compareIds = useMemo(() => {
    const param = searchParams.get('ids'); // Change from 'compare' to 'ids'
    return param ? param.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // Initialize Search Engine
  const fuse = useMemo(() => new Fuse(CATALOG_DATA, {
    keys: ['title', 'category', 'description'],
    threshold: 0.3
  }), []);

  // Filter Data Pipeline
  const filtered = useMemo(() => {
    let data = active === 'All' ? CATALOG_DATA : CATALOG_DATA.filter(d => d.category === active);
    if (searchQuery) {
      const searchResults = fuse.search(searchQuery).map(r => r.item.id);
      data = data.filter(d => searchResults.includes(d.id));
    }
    return data;
  }, [active, searchQuery, fuse]);

  // Bulletproof Comparison Toggle
  // Standardized Comparison Toggle (using 'ids' instead of 'compare')
  const toggleCompare = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    setSearchParams(prevParams => {
      const newParams = new URLSearchParams(prevParams);
      const idStr = id.toString();
      
      // 1. Look for 'ids' in the URL (e.g., ?ids=1,2,3)
      const current = newParams.get('ids') 
        ? newParams.get('ids')!.split(',').filter(Boolean) 
        : [];

      // 2. If it's already there, remove it. If not, add it.
      const nextIds = current.includes(idStr) 
        ? current.filter(i => i !== idStr) 
        : [...current, idStr];

      // 3. Update the URL with the new list
      if (nextIds.length > 0) {
        newParams.set('ids', nextIds.join(','));
      } else {
        newParams.delete('ids');
      }
      
      return newParams; 
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-0">

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Datasets</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {CATALOG_DATA.length} datasets — Unified forecasting to 2030 using Holt-Linear Smoothing
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 rounded-full self-start sm:self-auto mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live data
            </span>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Search datasets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0 -mb-px">
            {ALL_CATEGORIES.map(cat => {
              const isActive = active === cat;
              const color = cat !== 'All' ? CATEGORY_COLORS[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`
                    shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap
                    ${isActive
                      ? 'text-slate-900 dark:text-white border-blue-600 dark:border-blue-500'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {color && <span className={`w-2 h-2 rounded-full ${color.dot}`} />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Cards ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ds => {
            const color = CATEGORY_COLORS[ds.category] ?? CATEGORY_COLORS['Technology'];
            const isSelected = compareIds.includes(ds.id.toString());
            
            return (
              <div
                key={ds.id}
                onClick={() => navigate(`/datasets/${ds.id}`)}
                className={`cursor-pointer group flex flex-col bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-900/50'
                }`}
              >
                <div className="p-5 flex flex-col grow relative">
                  {/* Badges & Compare Button */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${color.bg} ${color.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {ds.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        + Projections
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => toggleCompare(e, ds.id)}
                      className={`relative z-10 shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {isSelected ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />}
                      </svg>
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {ds.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed grow mb-4">
                    {ds.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[60%]">{ds.source}</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:gap-1.5 flex items-center gap-1 transition-all">
                      Explore
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-sm text-slate-400 dark:text-slate-500">
            No datasets found.
          </div>
        )}
      </div>

      {/* Floating Dock */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 z-50 border border-slate-700 dark:border-slate-200 max-w-[calc(100vw-2rem)]">
          <span className="font-semibold text-sm whitespace-nowrap">
            <span className="hidden sm:inline">{compareIds.length} dataset{compareIds.length > 1 ? 's' : ''} selected</span>
            <span className="sm:hidden">{compareIds.length} selected</span>
          </span>
          <div className="w-px h-4 bg-slate-700 dark:bg-slate-300" />
          <button 
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-xl shadow-blue-500/20 flex items-center gap-1.5"
            onClick={() => navigate('/compare?ids=' + compareIds.join(','))}
          >
            <span className="hidden sm:inline">Launch Comparison Engine</span>
            <span className="sm:hidden">Compare</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}