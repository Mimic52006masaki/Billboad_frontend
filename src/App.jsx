import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DiffPage from './DiffPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charts/diff" element={<DiffPage />} />
      </Routes>
    </Router>
  );
}

export default App;
