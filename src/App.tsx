import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import OnboardingTour from './components/OnboardingTour';
import { ThemeProvider } from './context/ThemeContext';

const Home = lazy(() => import('./pages/Home.tsx'));
const Datasets = lazy(() => import('./pages/Datasets.tsx'));
const DatasetView = lazy(() => import('./pages/DatasetView.tsx'));
const CompareView = lazy(() => import('./pages/CompareView.tsx'));

// 2. Create a simple loading spinner for the transitions
const PageLoader = () => (
  <div className="grow flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-800 dark:border-t-blue-500"></div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Navbar />
          {/* 3. Wrap routes in Suspense */}
          <Suspense fallback={<PageLoader />}>
            <div className="grow flex flex-col">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/datasets" element={<Datasets />} />
                <Route path="/datasets/:id" element={<DatasetView />} />
                <Route path="/compare" element={<CompareView />} />
              </Routes>
            </div>
          </Suspense>
          <Footer />
          <OnboardingTour />
        </div>
      </Router>
    </ThemeProvider>
  );
}