import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BoothQRPage from './pages/BoothQRPage';
import BoothAllocationPage from './pages/BoothAllocationPage';
import EndPage from './pages/EndPage';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import ScoreManagement from './pages/ScoreManagement';
import RewardManagement from './pages/RewardManagement';
import RewardDetails from './pages/RewardDetails';
import AdminAuth from './components/AdminAuth';
import { subscribeToGlobalReload } from './lib/database';

const LAST_RELOAD_TRIGGER_KEY = 'last_global_reload_trigger';

function App() {
  React.useEffect(() => {
    console.log('App.tsx: Setting up global reload listener...');
    const unsubscribe = subscribeToGlobalReload((firestoreTimestamp) => {
      console.log('App.tsx: Global reload listener received update. Firestore Timestamp:', firestoreTimestamp);

      if (firestoreTimestamp) {
        const lastReloadTimestampStr = sessionStorage.getItem(LAST_RELOAD_TRIGGER_KEY);
        const lastReloadTimestamp = lastReloadTimestampStr ? new Date(lastReloadTimestampStr) : null;

        // Only reload if the Firestore timestamp is newer than the last recorded reload
        if (!lastReloadTimestamp || firestoreTimestamp.getTime() > lastReloadTimestamp.getTime()) {
          console.log('App.tsx: Global reload triggered. Reloading window...');
          sessionStorage.setItem(LAST_RELOAD_TRIGGER_KEY, firestoreTimestamp.toISOString());
          window.location.reload();
        } else {
          console.log('App.tsx: Firestore timestamp is not newer than last recorded. No reload needed.');
        }
      } else {
        console.log('App.tsx: Global reload timestamp is null.');
        // Optionally, clear the local storage key if the trigger is explicitly nullified in Firestore
        // sessionStorage.removeItem(LAST_RELOAD_TRIGGER_KEY);
      }
    });
    return () => {
      console.log('App.tsx: Cleaning up global reload listener.');
      unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminAuth><AdminDashboard /></AdminAuth>} />
        <Route path="/admin/booth-qr" element={<AdminAuth><BoothQRPage /></AdminAuth>} />
        <Route path="/admin/rewards" element={<AdminAuth><RewardManagement /></AdminAuth>} />
        <Route path="/admin/rewards/details" element={<AdminAuth><RewardDetails /></AdminAuth>} />
        <Route path="/admin/end" element={<AdminAuth><EndPage /></AdminAuth>} />
        <Route path="/admin/scores" element={<AdminAuth><ScoreManagement /></AdminAuth>} />
        <Route path="/admin/:boothId" element={<AdminAuth><BoothAllocationPage /></AdminAuth>} />
        <Route path="/results" element={<ResultsPage />} />

        {/* Legacy routes - redirect to new admin routes */}
        <Route path="/booth-qr" element={<AdminAuth><BoothQRPage /></AdminAuth>} />
        <Route path="/end" element={<AdminAuth><EndPage /></AdminAuth>} />
      </Routes>
    </Router>
  );
}

export default App;
