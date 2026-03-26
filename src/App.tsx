import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import BackToTop from './components/BackToTop';
import ToastContainer from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

const Home = lazy(() => import('./pages/Home'));
const Datasets = lazy(() => import('./pages/Datasets'));
const DatasetView = lazy(() => import('./pages/DatasetView'));
const CompareView = lazy(() => import('./pages/CompareView'));
const Overview = lazy(() => import('./pages/Overview'));
const Correlations = lazy(() => import('./pages/Correlations'));
const Stories = lazy(() => import('./pages/Stories'));
const Scenarios = lazy(() => import('./pages/Scenarios'));
const Quality = lazy(() => import('./pages/Quality'));
const Anomalies = lazy(() => import('./pages/Anomalies'));

const PageLoader = () => (
  <div className="grow flex items-center justify-center min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-700 dark:border-t-blue-400" />
  </div>
);

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar onSearchOpen={handleOpenSearch} />
            <Suspense fallback={<PageLoader />}>
              <div className="grow flex flex-col">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/datasets" element={<Datasets />} />
                  <Route path="/datasets/:id" element={<DatasetView />} />
                  <Route path="/compare" element={<CompareView />} />
                  <Route path="/correlations" element={<Correlations />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/scenarios" element={<Scenarios />} />
                  <Route path="/quality" element={<Quality />} />
                  <Route path="/anomalies" element={<Anomalies />} />
                </Routes>
              </div>
            </Suspense>
            <Footer />
          </div>
          <SearchModal open={searchOpen} onClose={handleCloseSearch} />
          <BackToTop />
          <ToastContainer />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}
