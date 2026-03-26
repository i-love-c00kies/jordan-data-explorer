import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(CATALOG_DATA.map(d => d.category)))];

function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('jode-favorites') || '[]'); } catch { return []; }
  });
  const toggle = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('jode-favorites', JSON.stringify(next));
      window.dispatchEvent(new Event('jode-favorites-changed'));
      return next;
    });
  };
  return { favorites, toggle, isFavorite: (id: number) => favorites.includes(id) };
}

export default function Datasets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('cat') || 'All';
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggle, isFavorite } = useFavorites();

  const setActive = (cat: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat === 'All') next.delete('cat');
      else next.set('cat', cat);
      return next;
    });
    setShowFavoritesOnly(false);
  };

  const compareIds = useMemo(() => {
    const param = searchParams.get('ids');
    return param ? param.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const fuse = useMemo(() => new Fuse(CATALOG_DATA, { keys: ['title', 'category', 'description'], threshold: 0.3 }), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: CATALOG_DATA.length };
    CATALOG_DATA.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let data = active === 'All' ? CATALOG_DATA : CATALOG_DATA.filter(d => d.category === active);
    if (showFavoritesOnly) data = data.filter(d => favorites.includes(d.id));
    if (searchQuery) {
      const searchResults = fuse.search(searchQuery).map(r => r.item.id);
      data = data.filter(d => searchResults.includes(d.id));
    }
    return data;
  }, [active, searchQuery, fuse, showFavoritesOnly, favorites]);

  const toggleCompare = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchParams(prevParams => {
      const newParams = new URLSearchParams(prevParams);
      const idStr = id.toString();
      const current = newParams.get('ids')?.split(',').filter(Boolean) || [];
      const nextIds = current.includes(idStr) ? current.filter(i => i !== idStr) : [...current, idStr];
      if (nextIds.length > 0) newParams.set('ids', nextIds.join(','));
      else newParams.delete('ids');
      return newParams;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Datasets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{CATALOG_DATA.length} indicators with Holt-Linear projections to 2030</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => { setShowFavoritesOnly(f => !f); setActive('All'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${showFavoritesOnly ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <svg className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-500' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              Favorites {favorites.length > 0 && <span className="text-[10px]">({favorites.length})</span>}
            </button>
            <Link to="/quality" className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Quality</Link>
            <Link to="/anomalies" className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Anomalies</Link>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-4 bg-white dark:bg-slate-950">
          {ALL_CATEGORIES.map(cat => {
            const isActive = active === cat && !showFavoritesOnly;
            const color = cat !== 'All' ? CATEGORY_COLORS[cat] : null;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {color && <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />}
                {cat}
                <span className="opacity-50 text-[11px]">({categoryCounts[cat] ?? 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(ds => {
            const color = CATEGORY_COLORS[ds.category] ?? CATEGORY_COLORS['Technology'];
            const isSelected = compareIds.includes(ds.id.toString());
            const isFav = isFavorite(ds.id);

            return (
              <div
                key={ds.id}
                onClick={() => navigate(`/datasets/${ds.id}`)}
                className={`cursor-pointer group rounded-xl border transition-all overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10'
                    : 'border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="p-4 flex flex-col grow">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${color.bg} ${color.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {ds.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => toggle(ds.id, e)}
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => toggleCompare(e, ds.id)}
                        className={`relative z-10 shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-500 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          {isSelected ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{ds.title}</h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed grow mb-3">{ds.description}</p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[60%]">{ds.source}</span>
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Explore
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-sm text-slate-400 dark:text-slate-500">
            {showFavoritesOnly && favorites.length === 0 ? 'No favorites yet. Star a dataset to save it here.' : 'No datasets found.'}
          </div>
        )}
      </div>

      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 z-50 border border-slate-700 dark:border-slate-200 max-w-[calc(100vw-2rem)]">
          <span className="font-medium text-sm">{compareIds.length} selected</span>
          <div className="w-px h-4 bg-slate-700 dark:bg-slate-300" />
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5"
            onClick={() => navigate('/compare?ids=' + compareIds.join(','))}
          >
            Compare
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
