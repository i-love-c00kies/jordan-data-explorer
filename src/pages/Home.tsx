import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col grow bg-slate-50 font-sans">
      
      {/* Main Hero Container - Uncluttered and Spacious */}
      <div className="relative bg-linear-to-br from-slate-50 to-slate-200 flex flex-col items-center justify-center py-32 px-6 text-slate-900 overflow-hidden z-0 border-b border-slate-200">
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 -left-20 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-4xl text-center space-y-8 z-10">
          
          {/* Decluttered Text - Merged H2 and Paragraph for faster reading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
              Jordan Open <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-emerald-600">Data Explorer</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              The reality of Jordan, quantified. Access decades of verified macroeconomic and demographic data.
            </p>
          </div>

          {/* Scaled Up Buttons - Larger padding, larger text, larger icon */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link 
              to="/datasets" 
              className="w-full sm:w-auto px-10 py-4 text-lg rounded-xl flex items-center justify-center bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
            >
              Explore Datasets
            </Link>
            
            <a 
              href="https://github.com/i-love-c00kies/jordan-data-explorer" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto px-10 py-4 text-lg rounded-xl bg-white text-slate-700 font-bold shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Contribute
            </a>
          </div>
        </div>
      </div>

      {/* METHODOLOGY SECTION */}
      <div className="bg-white py-20 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-12 text-center">Data Methodology & Transparency</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">How Projections Work</h3>
              <p className="text-slate-600 mb-4 font-medium">
                We don't just show the past; we calculate the near future. If global data stops in 2022, we analyze the momentum of the last decade to estimate exactly where the numbers will land in 2024 and 2025.
              </p>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono leading-relaxed">
                <span className="text-blue-400 font-bold">Technical:</span> Our engine utilizes an Ordinary Least Squares (OLS) Linear Regression model. It calculates the slope of the line of best fit across a 10-year rolling historical window, dynamically extending that mathematical trajectory to generate statistically sound forward projections.
              </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Understanding Data Anomalies</h3>
              <p className="text-slate-600 mb-4 font-medium">
                If you see a sudden jump or a disconnected line, it means we upgraded the data source. Global trackers often lag behind local reality, so we combine multiple sources.
              </p>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm font-mono leading-relaxed">
                <span className="text-emerald-400 font-bold">Technical:</span> When transitioning between collection methodologies, structural breaks occur. We layer highly accurate local proxy data over deep historical global data to preserve macro-trends while delivering the truest modern picture.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}