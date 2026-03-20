import { Link } from 'react-router-dom';

const catalogData = [
  { id: 1, title: 'Internet Penetration', category: 'Technology', source: 'OWID API + TRC Proxy', type: 'Live CSV', description: 'Share of the population using the internet.' },
  { id: 2, title: 'Life Expectancy', category: 'Health', source: 'OWID API + UN Data', type: 'Live CSV', description: 'Historical life expectancy at birth in years.' },
  { id: 3, title: 'CO2 Emissions', category: 'Environment', source: 'OWID API + Sector Est.', type: 'Live CSV', description: 'Annual production-based emissions of carbon dioxide.' },
  { id: 4, title: 'Population Growth', category: 'Demographics', source: 'OWID API', type: 'Live CSV', description: 'Total population historical tracking.' },
  { id: 5, title: 'GDP per Capita', category: 'Economy', source: 'World Bank via OWID', type: 'Live CSV', description: 'Gross domestic product per person adjusted for inflation.' },
  { id: 6, title: 'Electricity Access', category: 'Infrastructure', source: 'OWID API', type: 'Live CSV', description: 'Share of the population with access to electricity.' },
  { id: 7, title: 'Fertility Rate', category: 'Demographics', source: 'UN Data via OWID', type: 'Live CSV', description: 'Average number of children born to a woman.' },
  { id: 8, title: 'Urban Population', category: 'Demographics', source: 'World Bank via OWID', type: 'Live CSV', description: 'Share of the total population living in urban areas.' },
  { id: 9, title: 'Renewable Energy', category: 'Environment', source: 'OWID API', type: 'Live CSV', description: 'Share of primary energy consumption from renewable technologies.' },
  { id: 10, title: 'Child Mortality', category: 'Health', source: 'UNIGME via OWID', type: 'Live CSV', description: 'Share of children who die before reaching the age of five.' },
  { id: 11, title: 'Literacy Rate', category: 'Education', source: 'World Bank via OWID', type: 'Live CSV', description: 'Share of the population aged 15 and older who can read and write.' },
  { id: 12, title: 'Mobile Subscriptions', category: 'Technology', source: 'ITU via OWID', type: 'Live CSV', description: 'Mobile cellular subscriptions per 100 people.' },
];

export default function Datasets() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP NAVIGATION */}
        <nav className="mb-10">
          <Link to="/" className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-2 w-fit transition-colors">
            <span>&larr;</span> Return to Homepage
          </Link>
        </nav>

        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Data Catalog</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Select a dataset to view interactive visualizations, historical trends, and linear projections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogData.map((dataset) => (
            <Link 
              to={`/datasets/${dataset.id}`} 
              key={dataset.id}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full"
            >
              {/* BADGES: Using flex-wrap so they don't squish */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg">
                  {dataset.category}
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-100 flex items-center">
                  + Projections
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {dataset.title}
              </h2>
              
              {/* Using grow instead of flex-grow */}
              <p className="text-slate-600 text-sm mb-6 grow leading-relaxed">
                {dataset.description}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  Source: {dataset.source}
                </span>
                <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap ml-2">
                  Analyze &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}