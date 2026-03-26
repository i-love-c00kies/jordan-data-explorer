import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import Papa from 'papaparse';
import { OWID_CONFIG } from '../constants/datasets';
import { useTheme } from '../context/ThemeContext';

interface StorySlide {
  title: string;
  narrative: string;
  datasetIds: number[];
  highlight: string;
  yearRange: [number, number];
}

interface Story {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  slides: StorySlide[];
}

const STORIES: Story[] = [
  {
    id: 'digital',
    title: "Jordan's Digital Leap",
    subtitle: 'From 2% to 90%+ internet penetration in two decades',
    color: 'blue',
    slides: [
      { title: 'The Early Days', narrative: 'In 2000, fewer than 3% of Jordanians had internet access. The country was largely disconnected from the digital world, with mobile phones still a luxury.', datasetIds: [1], highlight: 'Internet usage was under 3%', yearRange: [1995, 2005] },
      { title: 'The Mobile Revolution', narrative: 'Between 2005-2015, mobile penetration exploded past 100%. Smartphones became the primary gateway to the internet, leapfrogging traditional infrastructure.', datasetIds: [12], highlight: 'Mobile subscriptions exceeded population', yearRange: [2005, 2015] },
      { title: 'Near-Universal Access', narrative: "By 2023, over 90% of Jordanians are online. TRC data shows consistent growth even through economic downturns, making digital access one of Jordan's success stories.", datasetIds: [1], highlight: '90%+ connected by 2023', yearRange: [2015, 2024] },
    ],
  },
  {
    id: 'health',
    title: 'The Health Transformation',
    subtitle: 'Life expectancy gains and child mortality decline',
    color: 'emerald',
    slides: [
      { title: 'A Young Nation', narrative: 'In 1960, life expectancy in Jordan was around 52 years. Child mortality was devastatingly high, with more than 1 in 10 children not surviving to age 5.', datasetIds: [2], highlight: 'Life expectancy: ~52 years', yearRange: [1960, 1980] },
      { title: 'Steady Progress', narrative: 'Decades of investment in healthcare infrastructure pushed life expectancy past 70. Infant mortality dropped dramatically as vaccination and maternal care improved.', datasetIds: [2, 10], highlight: 'Life expectancy crossed 70', yearRange: [1980, 2005] },
      { title: 'Modern Standards', narrative: 'Today Jordan leads the region with life expectancy near 75 years. Child mortality has fallen to levels comparable to upper-middle-income countries globally.', datasetIds: [2], highlight: 'Near 75 years today', yearRange: [2005, 2024] },
    ],
  },
  {
    id: 'environment',
    title: 'Environmental Crossroads',
    subtitle: 'CO2 growth, water scarcity, and renewable energy',
    color: 'amber',
    slides: [
      { title: 'Rising Emissions', narrative: "Jordan's CO2 emissions have grown steadily since 1970, driven by population growth, urbanization, and reliance on imported fossil fuels for energy generation.", datasetIds: [3], highlight: 'Emissions tripled since 1990', yearRange: [1970, 2010] },
      { title: 'Water Crisis', narrative: "Jordan is one of the most water-scarce countries on Earth. Per-capita water availability has plummeted as population grew, exacerbated by regional refugee influxes.", datasetIds: [13], highlight: "Among world's most water-scarce", yearRange: [1990, 2024] },
      { title: 'The Solar Bet', narrative: 'Jordan has pivoted aggressively to solar energy. Renewable capacity has surged, with major solar parks transforming the energy landscape and reducing fossil dependence.', datasetIds: [9], highlight: 'Rapid solar expansion', yearRange: [2010, 2024] },
    ],
  },
  {
    id: 'economy',
    title: 'Economic Transformation',
    subtitle: "Jordan's GDP journey from agrarian economy to services-led growth",
    color: 'cyan',
    slides: [
      { title: 'The Agrarian Roots', narrative: 'In the 1960s, Jordan was a small agrarian economy with a GDP per capita below $500. Agriculture and phosphate exports dominated early economic activity.', datasetIds: [5], highlight: 'GDP per capita below $500 in 1960', yearRange: [1960, 1985] },
      { title: 'Opening to Trade', narrative: "From the 1990s, Jordan embraced trade liberalization. Trade openness—the sum of exports and imports as a share of GDP—climbed steadily, reflecting Jordan's integration into the global economy.", datasetIds: [33], highlight: 'Trade openness surpassed 100% of GDP', yearRange: [1985, 2010] },
      { title: 'Remittances & FDI', narrative: "Two external lifelines sustain Jordan's economy: remittances from the diaspora and foreign direct investment. Together they represent a structural dependency and resilience that define modern Jordan.", datasetIds: [22], highlight: 'Remittances reach 10%+ of GDP', yearRange: [2000, 2024] },
      { title: 'The Services Engine', narrative: 'Today, services account for over 75% of GDP. Healthcare, education, and finance have replaced agriculture as the pillars of economic activity, supported by a growing middle class.', datasetIds: [5], highlight: 'Services dominate at 75%+ of GDP', yearRange: [2005, 2024] },
    ],
  },
  {
    id: 'refugees',
    title: 'The Refugee Burden',
    subtitle: "How hosting millions shaped Jordan's demographics and economy",
    color: 'indigo',
    slides: [
      { title: 'A Nation of Hosts', narrative: 'Jordan has been a refuge throughout modern history—Palestinian, Iraqi, Syrian, and Yemeni waves have each left their mark. By the mid-2010s, Jordan hosted one of the highest per-capita refugee populations in the world.', datasetIds: [27], highlight: 'Over 700,000 registered UNHCR refugees', yearRange: [1990, 2020] },
      { title: 'Population Under Pressure', narrative: 'The Syrian crisis after 2011 triggered a demographic shock. Population growth accelerated sharply, straining housing, schools, and water infrastructure that was already under stress.', datasetIds: [4], highlight: 'Population surged 20% in a decade', yearRange: [2010, 2024] },
      { title: 'Unemployment and Resilience', narrative: 'Labor market pressures intensified as the workforce expanded faster than job creation. Youth unemployment climbed while the government sought to balance humanitarian obligations with economic stability.', datasetIds: [14], highlight: 'Unemployment peaked above 22%', yearRange: [2011, 2024] },
    ],
  },
  {
    id: 'energy',
    title: 'Energy Independence',
    subtitle: 'From 97% energy imports to a growing renewable future',
    color: 'teal',
    slides: [
      { title: 'A Nation Dependent on Imports', narrative: 'For decades, Jordan imported over 95% of its energy needs, making it extraordinarily vulnerable to oil price shocks. The energy import bill consumed a huge share of GDP and foreign exchange.', datasetIds: [30], highlight: '97% of energy was imported', yearRange: [1990, 2010] },
      { title: 'The Solar Revolution', narrative: "Jordan's geography—abundant sunlight and open desert—made it ideal for solar power. Starting around 2015, large-scale solar parks came online, and the share of solar electricity grew rapidly.", datasetIds: [29], highlight: 'Solar share grew from 0% to 15%+', yearRange: [2012, 2024] },
      { title: 'Greening the Grid', narrative: 'Wind and solar together now provide a meaningful share of electricity. Renewable energy targets aim for 31% by 2030. CO₂ per capita, while still high, has shown signs of plateauing.', datasetIds: [9], highlight: 'Renewables now power 30%+ of electricity', yearRange: [2015, 2024] },
      { title: 'The Road to 2030', narrative: "Jordan's National Energy Strategy targets energy independence through renewables and domestic gas. The transformation from a fossil-fuel dependent state to a regional renewable energy hub is underway.", datasetIds: [79], highlight: 'CO₂ per capita stabilizing', yearRange: [2018, 2024] },
    ],
  },
  {
    id: 'youth',
    title: 'Youth & Education',
    subtitle: 'Declining fertility, rising enrollment, persistent unemployment',
    color: 'rose',
    slides: [
      { title: 'The Demographic Dividend', narrative: "Jordan's fertility rate fell from over 8 children per woman in 1960 to under 2.5 today. This transition created a young, growing workforce—a potential demographic dividend if jobs can be created.", datasetIds: [7], highlight: 'Fertility fell from 8 to 2.5 children', yearRange: [1960, 2024] },
      { title: 'Education for All', narrative: "School enrollment surged across all levels. Secondary enrollment climbed above 90%, and tertiary enrollment expanded dramatically—Jordan now has some of the highest education attainment rates in the Arab world.", datasetIds: [72], highlight: 'Secondary enrollment above 90%', yearRange: [1980, 2024] },
      { title: 'The NEET Crisis', narrative: "Despite high enrollment, youth not in employment, education, or training (NEET) remains elevated—particularly among women. The education system produces graduates, but the economy struggles to absorb them.", datasetIds: [26], highlight: 'Youth NEET rate above 30%', yearRange: [2000, 2024] },
    ],
  },
  {
    id: 'water',
    title: 'Water: The Invisible Crisis',
    subtitle: 'The second most water-scarce country on Earth',
    color: 'sky',
    slides: [
      { title: 'A Desert Nation', narrative: "Jordan receives less than 50mm of rain annually in most of the country. With renewable water resources of just 95 cubic meters per person per year, Jordan is classified as extremely water scarce by the UN.", datasetIds: [13], highlight: "2nd most water-scarce globally", yearRange: [1970, 2024] },
      { title: 'Population Multiplies the Pressure', narrative: "As population grew from 2 million in 1975 to over 11 million today—including refugees—per capita water availability collapsed. Each additional resident deepens an already acute shortage.", datasetIds: [4], highlight: 'Population grew 5x since 1975', yearRange: [1975, 2024] },
      { title: 'Agriculture vs. Cities', narrative: "Agriculture consumes around 50% of Jordan's freshwater, yet contributes less than 4% to GDP. Reforming agricultural water use is critical to sustaining cities and industry as climate change reduces available water.", datasetIds: [24], highlight: 'Agriculture uses 50% of water', yearRange: [1990, 2024] },
    ],
  },
  {
    id: 'urbanization',
    title: 'Urbanization & Infrastructure',
    subtitle: 'From a rural society to 93% urban in sixty years',
    color: 'purple',
    slides: [
      { title: 'The Urban Migration', narrative: "In 1960, just 44% of Jordanians lived in cities. Today, 93% do—one of the highest urbanization rates in the world. Amman grew from a small town to a metropolis of over 4 million people.", datasetIds: [8], highlight: 'Urban population: 44% → 93%', yearRange: [1960, 2024] },
      { title: 'Electrification of the Nation', narrative: "Universal electricity access—reaching 100%—was achieved through consistent infrastructure investment. From rural villages to border towns, the national grid expanded alongside urbanization.", datasetIds: [6], highlight: '100% electricity access achieved', yearRange: [1990, 2024] },
      { title: 'The Connected Society', narrative: "Mobile subscriptions now exceed 100 per 100 people. Combined with near-universal internet access, Jordan has become one of the most digitally connected societies in the Middle East.", datasetIds: [12], highlight: 'Mobile penetration >100%', yearRange: [2000, 2024] },
    ],
  },
];

export default function Stories() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const currentStory = STORIES.find(s => s.id === activeStory);
  const currentSlide = currentStory?.slides[activeSlide];

  useEffect(() => {
    if (!currentSlide) { setChartData([]); return; }
    const dsId = currentSlide.datasetIds[0];
    const config = OWID_CONFIG[String(dsId)];
    if (!config) return;
    setLoadingChart(true);
    Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
      download: true, header: true,
      complete: (results) => {
        const jordanData = results.data.filter((row: any) => row['Entity'] === 'Jordan');
        const keys = jordanData.length > 0 ? Object.keys(jordanData[0] as object) : [];
        const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
        const filtered = jordanData
          .map((row: any) => ({ year: parseInt(row['Year']), value: parseFloat(row[valueKey || '']) }))
          .filter((d: any) => !isNaN(d.year) && !isNaN(d.value) && d.year >= currentSlide.yearRange[0] && d.year <= currentSlide.yearRange[1])
          .sort((a: any, b: any) => a.year - b.year);
        setChartData(filtered);
        setLoadingChart(false);
      },
      error: () => { setChartData([]); setLoadingChart(false); },
    });
  }, [activeStory, activeSlide]);

  const storyColors: Record<string, { line: string; bg: string; badge: string }> = {
    blue:   { line: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/30',     badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
    emerald:{ line: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
    amber:  { line: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30',   badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
    cyan:   { line: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-950/30',     badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' },
    indigo: { line: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-950/30', badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
    teal:   { line: '#14b8a6', bg: 'bg-teal-50 dark:bg-teal-950/30',     badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300' },
    rose:   { line: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-950/30',     badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' },
    sky:    { line: '#0ea5e9', bg: 'bg-sky-50 dark:bg-sky-950/30',       badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' },
    purple: { line: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-950/30', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' },
  };

  if (!activeStory) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-5 pt-8 pb-12">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Data Stories</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Interactive narratives walking through Jordan's transformation, powered by real data.</p>
          </div>

          <div className="space-y-3">
            {STORIES.map(story => {
              const c = storyColors[story.color] ?? storyColors.blue;
              return (
                <button
                  key={story.id}
                  onClick={() => { setActiveStory(story.id); setActiveSlide(0); }}
                  className={`w-full text-left rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all group ${c.bg}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{story.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{story.subtitle}</p>
                      <span className={`inline-block mt-3 text-[11px] font-semibold px-2 py-0.5 rounded ${c.badge}`}>{story.slides.length} chapters</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const sc = storyColors[currentStory!.color] ?? storyColors.blue;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-5 pt-8 pb-12">
        <button onClick={() => setActiveStory(null)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          All stories
        </button>

        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{currentStory!.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{currentStory!.subtitle}</p>

        <div className="flex gap-1 mb-6">
          {currentStory!.slides.map((_, idx) => (
            <button key={idx} onClick={() => setActiveSlide(idx)} className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-8 bg-blue-600 dark:bg-blue-400' : 'w-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`} />
          ))}
        </div>

        {currentSlide && (
          <div className="animate-fade-in">
            <div className={`rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 mb-6 ${sc.bg}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Chapter {activeSlide + 1} of {currentStory!.slides.length}</div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{currentSlide.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{currentSlide.narrative}</p>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${sc.badge}`}>{currentSlide.highlight}</span>
            </div>

            <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4">
              <div className="h-64">
                {loadingChart ? (
                  <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="year" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
                      <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke={sc.line} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                disabled={activeSlide === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >Previous</button>
              <button
                onClick={() => setActiveSlide(Math.min(currentStory!.slides.length - 1, activeSlide + 1))}
                disabled={activeSlide === currentStory!.slides.length - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
