import { useState } from 'react';
import { OWID_CONFIG } from '../constants/datasets';

const SOURCE_DETAILS: Record<string, { url: string; methodology: string; gaps: string; lastUpdated: string }> = {
  '1':  { url: 'https://ourworldindata.org/internet', methodology: 'ITU estimates combined with local TRC administrative data for Jordan-specific accuracy.', gaps: 'Pre-2000 data sparse; TRC data begins 2010.', lastUpdated: '2024' },
  '2':  { url: 'https://ourworldindata.org/life-expectancy', methodology: 'UN Population Division life tables with period estimates.', gaps: 'Pre-1950 estimates are interpolated from census records.', lastUpdated: '2024' },
  '3':  { url: 'https://ourworldindata.org/co2-emissions', methodology: 'Global Carbon Project production-based accounting. Sector splits are estimates.', gaps: 'Sector breakdown available from 1990 only.', lastUpdated: '2024' },
  '4':  { url: 'https://ourworldindata.org/population-growth', methodology: 'UN World Population Prospects (medium variant).', gaps: 'Historical estimates before 1950 carry wider uncertainty bands.', lastUpdated: '2024' },
  '5':  { url: 'https://ourworldindata.org/economic-growth', methodology: 'World Bank WDI — GDP per capita in constant 2015 USD.', gaps: 'Limited data before 1960.', lastUpdated: '2024' },
  '6':  { url: 'https://ourworldindata.org/energy-access', methodology: 'World Bank SE4ALL global tracking framework.', gaps: 'Near 100% since 1990s; pre-1990 data sparse.', lastUpdated: '2024' },
  '7':  { url: 'https://ourworldindata.org/fertility-rate', methodology: 'UN Population Division estimates (births per woman, total fertility rate).', gaps: 'Pre-1950 estimates carry higher uncertainty.', lastUpdated: '2024' },
  '8':  { url: 'https://ourworldindata.org/urbanization', methodology: 'UN World Urbanization Prospects.', gaps: 'Definition of "urban" varies across census years.', lastUpdated: '2024' },
  '9':  { url: 'https://ourworldindata.org/renewable-energy', methodology: 'Ember annual electricity review — share from renewables.', gaps: 'Data begins around 2000 for most countries.', lastUpdated: '2024' },
  '10': { url: 'https://ourworldindata.org/child-mortality', methodology: 'UN Inter-agency Group for Child Mortality Estimation (UNIGME).', gaps: 'Earlier estimates modeled from survey data.', lastUpdated: '2024' },
  '11': { url: 'https://ourworldindata.org/literacy', methodology: 'World Bank WDI — Population aged 15+ who can read/write.', gaps: 'Survey-based; not available for all years.', lastUpdated: '2024' },
  '12': { url: 'https://ourworldindata.org/technology-adoption', methodology: 'ITU World Telecommunication/ICT Indicators database.', gaps: 'Can exceed 100% due to multi-SIM usage.', lastUpdated: '2024' },
  '13': { url: 'https://ourworldindata.org/water-use-stress', methodology: 'FAO AQUASTAT — freshwater withdrawal vs. internal renewable resources.', gaps: 'Can exceed 100% when external resources supplement internal.', lastUpdated: '2024' },
  '14': { url: 'https://ourworldindata.org/employment', methodology: 'ILO modeled estimates — share of labor force seeking employment.', gaps: 'Does not capture informal sector fully.', lastUpdated: '2024' },
  '15': { url: 'https://data.worldbank.org/', methodology: 'World Bank — Consumer Price Index (2010 = 100 baseline).', gaps: 'Basket composition changes across periods.', lastUpdated: '2024' },
  '16': { url: 'https://ourworldindata.org/human-development-index', methodology: 'UNDP composite of health, education, and income indices.', gaps: 'Methodology updated in 2010; not directly comparable pre/post.', lastUpdated: '2024' },
  '17': { url: 'https://ourworldindata.org/infant-mortality', methodology: 'UNIGME — deaths per 1,000 live births within first year.', gaps: 'Earlier estimates model-based from survey data.', lastUpdated: '2024' },
  '18': { url: 'https://ourworldindata.org/government-spending', methodology: 'IMF Government Finance Statistics / WDI.', gaps: 'Definition of "government" may vary (central vs. general).', lastUpdated: '2024' },
  '19': { url: 'https://ourworldindata.org/financing-healthcare', methodology: 'WHO Global Health Expenditure Database.', gaps: 'Currency conversion introduces uncertainty in some years.', lastUpdated: '2024' },
  '20': { url: 'https://ourworldindata.org/female-labor-supply', methodology: 'ILO modeled estimates — women aged 15+ in labor force.', gaps: 'Survey timing and definitions vary.', lastUpdated: '2024' },
  '21': { url: 'https://ourworldindata.org/diet-compositions', methodology: 'FAO Food Balance Sheets — protein supply per capita per day.', gaps: 'Supply-side data; does not reflect actual consumption.', lastUpdated: '2024' },
  '22': { url: 'https://ourworldindata.org/remittances', methodology: 'World Bank — personal remittances received as % of GDP.', gaps: 'Informal channels may be underreported.', lastUpdated: '2024' },
  '23': { url: 'https://ourworldindata.org/electricity-mix', methodology: 'Ember Climate — total generation in terawatt-hours.', gaps: 'Historical data before 2000 from BP Statistical Review.', lastUpdated: '2024' },
  '24': { url: 'https://ourworldindata.org/land-use', methodology: 'FAO — share of land classified as agricultural.', gaps: 'Classification criteria may shift across census years.', lastUpdated: '2024' },
};

export default function SourceDrawer({ datasetId }: { datasetId: string }) {
  const [open, setOpen] = useState(false);
  const config = OWID_CONFIG[datasetId];
  const details = SOURCE_DETAILS[datasetId];
  if (!config || !details) return null;

  return (
    <div className="max-w-5xl mx-auto px-5 pb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        Data Source & Methodology
      </button>

      {open && (
        <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Source</p>
              <p className="text-slate-500 dark:text-slate-400">{config.source}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Updated</p>
              <p className="text-slate-500 dark:text-slate-400">{details.lastUpdated}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Methodology</p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{details.methodology}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Known Gaps</p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{details.gaps}</p>
            </div>
          </div>
          <a
            href={details.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            View original source
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
