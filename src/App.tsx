import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ScorePage from './pages/ScorePage';
import AdminBoothPage from './pages/AdminBoothPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/score/:tokenId" element={<ScorePage />} />
        <Route path="/admin/:boothId" element={<AdminBoothPage />} />
      </Routes>
    </Router>
  );
}

export default App;