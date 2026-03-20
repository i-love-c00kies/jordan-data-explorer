import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Datasets from './pages/Datasets';
import DatasetView from './pages/DatasetView';
import Footer from './components/Footer'; // <-- Import the new footer

export default function App() {
  return (
    <Router>
      {/* The flex-col and min-h-screen ensure the footer always sits at the very bottom */}
      <div className="flex flex-col min-h-screen bg-slate-50">
        <div className="grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/datasets/:id" element={<DatasetView />} />
          </Routes>
        </div>
        <Footer /> {/* <-- Global Footer */}
      </div>
    </Router>
  );
}