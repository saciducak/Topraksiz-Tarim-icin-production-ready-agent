import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Greenhouse from './pages/Greenhouse';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/greenhouse" element={<Greenhouse />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
