import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './index.css';

// ── Lazy-loaded pages ──
// Home is the main landing page with heavy dependencies (react-dropzone, react-markdown, react-icons)
// Greenhouse uses framer-motion and makes API calls
const Home = lazy(() => import('./pages/Home'));
const Greenhouse = lazy(() => import('./pages/Greenhouse'));

// ── Page Loading Fallback ──
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 font-medium">Yükleniyor...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/greenhouse" element={<Greenhouse />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
