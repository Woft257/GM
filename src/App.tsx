import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminBoothPage from './pages/AdminBoothPage';
import BoothQRPage from './pages/BoothQRPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/:boothId" element={<AdminBoothPage />} />
        <Route path="/booth-qr" element={<BoothQRPage />} />
      </Routes>
    </Router>
  );
}

export default App;