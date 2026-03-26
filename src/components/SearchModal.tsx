import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG_DATA } from '../constants/datasets';

const PAGES = [
  { title: 'Overview', path: '/overview', desc: 'All indicators at a glance' },
  { title: 'Datasets', path: '/datasets', desc: 'Browse all 100 datasets' },
  { title: 'Dashboard', path: '/dashboard', desc: 'Your starred datasets' },
  { title: 'Correlations', path: '/correlations', desc: 'Correlation matrix' },
  { title: 'Compare', path: '/compare', desc: 'Side-by-side dataset comparison' },
  { title: 'Stories', path: '/stories', desc: 'Data narratives' },
  { title: 'Quality', path: '/quality', desc: 'Data quality scores' },
  { title: 'Anomalies', path: '/anomalies', desc: 'Statistical anomalies' },
];

interface SearchResult {
  type: 'dataset' | 'page';
  title: string;
  desc: string;
  path: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return PAGES.map(p => ({ type: 'page' as const, title: p.title, desc: p.desc, path: p.path }));
    }
    const datasets: SearchResult[] = CATALOG_DATA
      .filter(d => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .slice(0, 8)
      .map(d => ({ type: 'dataset' as const, title: d.title, desc: d.category, path: `/datasets/${d.id}` }));
    const pages: SearchResult[] = PAGES
      .filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      .map(p => ({ type: 'page' as const, title: p.title, desc: p.desc, path: p.path }));
    return [...pages, ...datasets];
  }, [query]);

  useEffect(() => { setActiveIdx(0); }, [results]);

  const select = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) { select(results[activeIdx]); }
    if (e.key === 'Escape') { onClose(); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search datasets, pages..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No results for "{query}"</div>
          ) : (
            <div className="py-1">
              {results.map((r, i) => (
                <button
                  key={r.path}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => select(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIdx ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-bold ${r.type === 'page' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                    {r.type === 'page' ? 'P' : 'D'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.desc}</div>
                  </div>
                  {i === activeIdx && (
                    <kbd className="ml-auto shrink-0 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1 rounded">↵</kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
