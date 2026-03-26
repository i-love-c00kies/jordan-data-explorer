import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG_DATA, CATEGORY_COLORS } from '../constants/datasets';

const PAGES = [
  { title: 'Overview',      path: '/overview',     desc: 'All indicators at a glance' },
  { title: 'Datasets',      path: '/datasets',     desc: 'Browse all 100 datasets' },
  { title: 'Dashboard',     path: '/dashboard',    desc: 'Your starred datasets' },
  { title: 'Correlations',  path: '/correlations', desc: 'Correlation matrix' },
  { title: 'Compare',       path: '/compare',      desc: 'Side-by-side dataset comparison' },
  { title: 'Stories',       path: '/stories',      desc: 'Data narratives' },
  { title: 'Quality',       path: '/quality',      desc: 'Data quality scores' },
  { title: 'Anomalies',     path: '/anomalies',    desc: 'Statistical anomalies' },
];

const SUGGESTED_QUERIES = [
  'GDP trends', 'Health', 'Environment', 'Education',
  'Inequality', 'Water', 'Governance', 'Demographics', 'Trade',
];

const SYNONYMS: Record<string, string[]> = {
  school:      ['education', 'literacy', 'enrollment', 'learning'],
  college:     ['education', 'literacy', 'enrollment'],
  hospital:    ['health', 'medical', 'mortality'],
  doctor:      ['health', 'mortality', 'life expectancy'],
  disease:     ['health', 'mortality', 'life expectancy'],
  sick:        ['health', 'mortality'],
  pollution:   ['environment', 'co2', 'emissions', 'carbon'],
  emission:    ['environment', 'co2', 'carbon', 'climate'],
  carbon:      ['co2', 'environment', 'emissions', 'climate'],
  climate:     ['environment', 'temperature', 'co2', 'emissions'],
  warming:     ['environment', 'co2', 'temperature'],
  job:         ['unemployment', 'labor', 'employment', 'work'],
  jobs:        ['unemployment', 'labor', 'employment'],
  employment:  ['unemployment', 'labor', 'productivity'],
  work:        ['unemployment', 'labor', 'productivity'],
  poor:        ['poverty', 'inequality', 'gini', 'income'],
  poverty:     ['gini', 'inequality', 'income'],
  inequality:  ['gini', 'income', 'poverty'],
  rich:        ['gdp', 'income', 'wealth'],
  money:       ['gdp', 'economy', 'income'],
  grow:        ['gdp', 'economy', 'development'],
  growth:      ['gdp', 'economy', 'development'],
  rising:      ['growth', 'increase', 'trend'],
  improving:   ['growth', 'development', 'increase'],
  power:       ['energy', 'electricity', 'infrastructure'],
  energy:      ['electricity', 'renewable', 'solar'],
  clean:       ['renewable', 'solar', 'environment'],
  rural:       ['urban', 'population', 'demographics'],
  city:        ['urban', 'population'],
  baby:        ['fertility', 'birth', 'children'],
  birth:       ['fertility', 'children'],
  child:       ['fertility', 'children', 'mortality'],
  death:       ['mortality', 'life expectancy'],
  die:         ['mortality', 'life expectancy'],
  age:         ['life expectancy', 'population'],
  food:        ['nutrition', 'undernourishment', 'hunger'],
  hunger:      ['undernourishment', 'food'],
  water:       ['freshwater', 'scarcity', 'environment'],
  refugee:     ['asylum', 'migration', 'demographics'],
  military:    ['defense', 'spending', 'governance'],
  army:        ['military', 'defense', 'governance'],
  government:  ['governance', 'public', 'debt'],
  debt:        ['government', 'fiscal', 'economy'],
  internet:    ['digital', 'technology', 'connectivity'],
  digital:     ['internet', 'technology'],
  phone:       ['mobile', 'technology'],
  mobile:      ['phone', 'subscriptions', 'technology'],
  population:  ['demographics', 'people', 'urban'],
  forest:      ['environment', 'land'],
  gender:      ['equality', 'women', 'education'],
  women:       ['gender', 'equality'],
  literacy:    ['education', 'school'],
  gdp:         ['economy', 'income', 'growth'],
  inflation:   ['prices', 'economy', 'cost'],
  trade:       ['exports', 'imports', 'openness'],
  export:      ['trade', 'openness'],
  import:      ['trade', 'openness'],
  agriculture: ['farming', 'food', 'land'],
  farm:        ['agriculture', 'food'],
};

type MatchField = 'Title' | 'Category' | 'Description' | 'Related';

interface SearchResult {
  type: 'dataset' | 'page' | 'compare';
  title: string;
  desc: string;
  path: string;
  score: number;
  matchedField?: MatchField;
  category?: string;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
}

function expandQuery(words: string[]): string[] {
  const expanded = new Set<string>();
  for (const w of words) {
    const synonyms = SYNONYMS[w];
    if (synonyms) synonyms.forEach(s => tokenize(s).forEach(t => expanded.add(t)));
  }
  return Array.from(expanded);
}

function scoreDataset(
  d: typeof CATALOG_DATA[0],
  queryWords: string[],
  expandedWords: string[],
  rawQuery: string,
): { score: number; matchedField: MatchField } | null {
  const titleL = d.title.toLowerCase();
  const catL = d.category.toLowerCase();
  const descL = d.description.toLowerCase();

  let score = 0;
  let matchedField: MatchField | '' = '';

  const fullQ = rawQuery.toLowerCase();

  if (titleL === fullQ) { score += 100; matchedField = 'Title'; }
  else if (titleL.includes(fullQ)) { score += 60; matchedField = 'Title'; }

  for (const w of queryWords) {
    if (titleL.includes(w)) { score += 20; if (!matchedField) matchedField = 'Title'; }
  }

  for (const w of queryWords) {
    if (catL.includes(w)) { score += 15; if (!matchedField) matchedField = 'Category'; }
  }

  for (const w of queryWords) {
    if (w.length > 3 && descL.includes(w)) { score += 8; if (!matchedField) matchedField = 'Description'; }
  }

  for (const exp of expandedWords) {
    if (titleL.includes(exp)) { score += 25; if (!matchedField) matchedField = 'Related'; }
    else if (catL.includes(exp)) { score += 12; if (!matchedField) matchedField = 'Related'; }
    else if (exp.length > 3 && descL.includes(exp)) { score += 5; if (!matchedField) matchedField = 'Related'; }
  }

  if (!matchedField || score === 0) return null;
  return { score, matchedField: matchedField as MatchField };
}

function detectCompareQuery(q: string): [string, string] | null {
  const patterns = [
    /^compare\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+)$/i,
    /^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = q.match(re);
    if (m) return [m[1].trim(), m[2].trim()];
  }
  return null;
}

function findDataset(term: string): typeof CATALOG_DATA[0] | null {
  const t = term.toLowerCase();
  let best: typeof CATALOG_DATA[0] | null = null;
  let bestScore = 0;
  for (const d of CATALOG_DATA) {
    const titleL = d.title.toLowerCase();
    let s = 0;
    if (titleL === t) s = 100;
    else if (titleL.includes(t)) s = 60;
    else if (t.includes(titleL)) s = 40;
    else {
      const tWords = tokenize(t);
      const hits = tWords.filter(w => titleL.includes(w)).length;
      s = (hits / Math.max(tWords.length, 1)) * 30;
    }
    if (s > bestScore) { bestScore = s; best = d; }
  }
  return bestScore > 20 ? best : null;
}

const MATCH_BADGE: Record<MatchField, string> = {
  Title:       'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  Category:    'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  Description: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  Related:     'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
};

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
    if (open) { setQuery(''); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim();
    if (!q) return PAGES.map(p => ({ type: 'page', title: p.title, desc: p.desc, path: p.path, score: 0 }));

    const queryWords = tokenize(q);
    const expandedWords = expandQuery(queryWords);

    const compareRows: SearchResult[] = [];
    const compareMatch = detectCompareQuery(q);
    if (compareMatch) {
      const [termA, termB] = compareMatch;
      const dsA = findDataset(termA);
      const dsB = findDataset(termB);
      if (dsA && dsB && dsA.id !== dsB.id) {
        compareRows.push({
          type: 'compare',
          title: `Compare: ${dsA.title} vs ${dsB.title}`,
          desc: 'Open side-by-side comparison',
          path: `/compare?ids=${dsA.id},${dsB.id}`,
          score: 1000,
        });
      }
    }

    const scoredDatasets: SearchResult[] = [];
    for (const d of CATALOG_DATA) {
      const result = scoreDataset(d, queryWords, expandedWords, q);
      if (result) {
        scoredDatasets.push({
          type: 'dataset',
          title: d.title,
          desc: d.description,
          path: `/datasets/${d.id}`,
          score: result.score,
          matchedField: result.matchedField,
          category: d.category,
        });
      }
    }
    scoredDatasets.sort((a, b) => b.score - a.score);

    const matchedPages: SearchResult[] = PAGES
      .filter(p => {
        const pl = p.title.toLowerCase(); const dl = p.desc.toLowerCase();
        return queryWords.some(w => pl.includes(w) || dl.includes(w));
      })
      .map(p => ({ type: 'page', title: p.title, desc: p.desc, path: p.path, score: 50 }));

    return [...compareRows, ...matchedPages, ...scoredDatasets.slice(0, 8)];
  }, [query]);

  useEffect(() => { setActiveIdx(0); }, [results]);

  const select = (result: SearchResult) => { navigate(result.path); onClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) select(results[activeIdx]);
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  const isEmpty = query.trim() === '';

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
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
            placeholder="Search datasets, or try 'compare GDP vs life expectancy'..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {!query && <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">Esc</kbd>}
        </div>

        {isEmpty && (
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Suggested</div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUERIES.map(sq => (
                <button
                  key={sq}
                  onClick={() => setQuery(sq)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-72 overflow-y-auto">
          {!isEmpty && results.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-sm text-slate-400 mb-2">No results for "{query}"</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">Try synonyms, or "{SUGGESTED_QUERIES[0]}"</div>
            </div>
          ) : (
            <div className="py-1">
              {isEmpty && (
                <div className="px-4 pt-1 pb-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pages</div>
                </div>
              )}
              {results.map((r, i) => {
                const catColor = r.category ? CATEGORY_COLORS[r.category] : null;
                const isActive = i === activeIdx;
                return (
                  <button
                    key={`${r.type}-${r.path}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => select(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    {r.type === 'compare' ? (
                      <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/50">
                        <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                      </span>
                    ) : r.type === 'page' ? (
                      <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-bold bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">P</span>
                    ) : catColor ? (
                      <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0`}>
                        <span className={`w-2 h-2 rounded-full ${catColor.dot}`} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">D</span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</span>
                        {r.matchedField && (
                          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${MATCH_BADGE[r.matchedField]}`}>
                            {r.matchedField}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.desc}</div>
                    </div>

                    {isActive && (
                      <kbd className="ml-auto shrink-0 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 px-1 rounded">↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          {!isEmpty && <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  );
}
