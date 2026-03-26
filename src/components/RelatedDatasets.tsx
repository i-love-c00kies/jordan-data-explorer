import { Link } from 'react-router-dom';
import { OWID_CONFIG, CATEGORY_COLORS } from '../constants/datasets';

const CORRELATIONS: Record<string, string[]> = {
  '1': ['12', '5', '6'],
  '2': ['10', '17', '19'],
  '3': ['9', '23', '24'],
  '4': ['8', '7', '16'],
  '5': ['14', '18', '22'],
  '6': ['23', '9', '1'],
  '7': ['4', '2', '20'],
  '8': ['4', '6', '5'],
  '9': ['23', '3', '6'],
  '10': ['17', '2', '19'],
  '11': ['16', '20', '5'],
  '12': ['1', '5', '6'],
  '13': ['24', '4', '3'],
  '14': ['5', '20', '18'],
  '15': ['5', '18', '22'],
  '16': ['2', '11', '5'],
  '17': ['10', '2', '19'],
  '18': ['5', '14', '15'],
  '19': ['2', '10', '5'],
  '20': ['14', '11', '5'],
  '21': ['2', '5', '24'],
  '22': ['5', '14', '4'],
  '23': ['6', '9', '3'],
  '24': ['13', '4', '3'],
};

export default function RelatedDatasets({ currentId }: { currentId: string }) {
  const related = CORRELATIONS[currentId] || [];
  if (related.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-5 pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          You might also compare
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {related.map(id => {
            const conf = OWID_CONFIG[id];
            if (!conf) return null;
            const color = CATEGORY_COLORS[conf.category] ?? CATEGORY_COLORS['Technology'];
            return (
              <Link
                key={id}
                to={`/datasets/${id}`}
                className="group flex flex-col p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{conf.category}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{conf.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{conf.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
