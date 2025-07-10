import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminBoothPage from './pages/AdminBoothPage';
import BoothQRPage from './pages/BoothQRPage';
import EndPage from './pages/EndPage';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuth from './components/AdminAuth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminAuth><AdminDashboard /></AdminAuth>} />
        <Route path="/admin/:boothId" element={<AdminAuth><AdminBoothPage /></AdminAuth>} />
        <Route path="/admin/booth-qr" element={<AdminAuth><BoothQRPage /></AdminAuth>} />
        <Route path="/admin/end" element={<AdminAuth><EndPage /></AdminAuth>} />
        <Route path="/results" element={<ResultsPage />} />

        {/* Legacy routes - redirect to new admin routes */}
        <Route path="/booth-qr" element={<AdminAuth><BoothQRPage /></AdminAuth>} />
        <Route path="/end" element={<AdminAuth><EndPage /></AdminAuth>} />
      </Routes>
    </Router>
  );
}

export default App;