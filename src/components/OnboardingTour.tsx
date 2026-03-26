import { useState, useEffect } from 'react';

const STEPS = [
  {
    title: 'Brush & Zoom',
    description: 'Use the slider at the bottom of each chart to zoom into a specific time range. Drag the handles to narrow your focus.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
      </svg>
    ),
  },
  {
    title: 'Compare Datasets',
    description: 'On the Datasets page, tap the + button on any card to select it for comparison. Select multiple datasets, then launch the Comparison Engine.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: 'Projected Data',
    description: 'Dashed lines on charts represent forward projections to 2030 using the Titan forecasting engine. These are estimates, not observed data.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
];

const STORAGE_KEY = 'jode-tour-seen';

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {step.icon}
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Tip {currentStep + 1} of {STEPS.length}</p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{step.description}</p>

        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">
            Skip tour
          </button>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
            <button onClick={next} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
              {currentStep < STEPS.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
