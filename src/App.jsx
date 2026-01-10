import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DiffPage from './DiffPage';
import ChartHistory from './ChartHistory';
import ChartHistoryList from './ChartHistoryList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charts/diff" element={<DiffPage />} />
        <Route path="/charts/:chartDate" element={<ChartHistory />} />
        <Route path="/history" element={<ChartHistoryList />} />
      </Routes>
    </Router>
  );
}

export default App;
