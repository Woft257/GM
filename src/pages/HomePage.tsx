import React, { useState } from 'react';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import Leaderboard from '../components/Leaderboard';
import UserProgress from '../components/UserProgress';
import QRScanner from '../components/QRScanner';
import { useAuth } from '../hooks/useAuth';
import { useUsers, useUser } from '../hooks/useUsers';
import { parseQRData, validateQRData } from '../lib/qrcode';
import { useQRToken } from '../lib/database';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';

const HomePage: React.FC = () => {
  const { username, login, isLoading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { user, loading: userLoading } = useUser(username || '');

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
  } | null>(null);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Đang tải...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleQRScan = async (qrText: string) => {
    if (!username) {
      setScanResult({
        success: false,
        message: 'Vui lòng đăng nhập trước khi quét QR code'
      });
      return;
    }

    try {
      // Parse QR data
      const qrData = parseQRData(qrText);

      if (!qrData) {
        setScanResult({
          success: false,
          message: 'QR code không hợp lệ hoặc không phải QR code của GM Vietnam'
        });
        return;
      }

      // Validate QR data
      if (!validateQRData(qrData)) {
        setScanResult({
          success: false,
          message: 'QR code đã hết hạn hoặc không hợp lệ'
        });
        return;
      }

      // Use QR token
      const points = await useQRToken(qrData.tokenId, username);

      setScanResult({
        success: true,
        message: `Chúc mừng! Bạn đã nhận được ${points} điểm từ ${qrData.boothId}`,
        points
      });

    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi xử lý QR code'
      });
    }
  };

  const handleCloseScanResult = () => {
    setScanResult(null);
  };

  if (!username) {
    return (
      <Layout title="Chào mừng đến GM Vietnam!">
        <LoginForm onLogin={login} />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* QR Scan Button */}
      <div className="text-center mb-8">
        <button
          onClick={() => setShowQRScanner(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 flex items-center mx-auto"
        >
          <QrCode className="h-6 w-6 mr-3" />
          Quét QR Code
        </button>
        <p className="text-white/60 text-sm mt-2">
          Quét QR code tại các booth để nhận điểm
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Leaderboard users={users} currentUser={user} loading={usersLoading} />
        </div>
        <div>
          {user && !userLoading && <UserProgress user={user} />}
          {userLoading && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Đang tải tiến trình...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScan}
      />

      {/* Scan Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-md p-6">
            <div className="text-center">
              {scanResult.success ? (
                <>
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Thành công!</h3>
                  {scanResult.points && (
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">+{scanResult.points}</span>
                      <span className="text-white/70 ml-2">điểm</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">Có lỗi xảy ra</h3>
                </>
              )}

              <p className="text-white/70 mb-6">{scanResult.message}</p>

              <button
                onClick={handleCloseScanResult}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;