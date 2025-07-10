import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import Leaderboard from '../components/Leaderboard';
import UserProgress from '../components/UserProgress';
import QRScanner from '../components/QRScanner';
import { useAuth } from '../hooks/useAuth';
import { useUsers, useUser } from '../hooks/useUsers';
import { parseQRData, validateQRData } from '../lib/qrcode';
import { useQRToken, useQRTokenBySimpleCode, createPendingScore } from '../lib/database';
import { parseBoothQRData, validateBoothQRData } from '../lib/boothQR';
import { usePendingScores } from '../hooks/usePendingScores';
import { getBoothName } from '../data/booths';
import { QrCode, CheckCircle, XCircle, Clock, Trophy, Users, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { username, login, isLoading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { user, loading: userLoading } = useUser(username || '');
  const { pendingScores } = usePendingScores(username);

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
    isPending?: boolean;
    boothId?: string;
  } | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Monitor pending scores for real-time updates
  useEffect(() => {
    if (pendingScores.length === 0 && scanResult?.isPending) {
      // Pending score was completed, show success message
      setScanResult({
        success: true,
        message: `Chúc mừng! Bạn đã nhận được điểm từ ${getBoothName(scanResult.boothId || '')}!`,
        points: undefined // Will be updated by user data refresh
      });
    }
  }, [pendingScores, scanResult]);

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
      // Check if it's a simple code (old system)
      if (qrText.startsWith('SIMPLE_CODE:')) {
        const simpleCode = qrText.replace('SIMPLE_CODE:', '');

        // Use simple code
        const points = await useQRTokenBySimpleCode(simpleCode, username);

        setScanResult({
          success: true,
          message: `Chúc mừng! Bạn đã nhận được ${points} điểm bằng mã ${simpleCode}`,
          points
        });
        return;
      }

      // Try to parse as booth QR (new system)
      const boothQRData = parseBoothQRData(qrText);

      if (boothQRData && validateBoothQRData(boothQRData)) {
        // Create pending score entry
        const pendingId = await createPendingScore(boothQRData.boothId, username);

        // Show success message and stay on home page
        setScanResult({
          success: true,
          message: `Đã quét thành công booth ${boothQRData.boothId}! Đang chờ admin phân bổ điểm...`,
          isPending: true,
          boothId: boothQRData.boothId
        });
        return;
      }

      // Try to parse as old QR token system
      const qrData = parseQRData(qrText);

      if (qrData && validateQRData(qrData)) {
        // Use QR token (old system)
        const points = await useQRToken(qrData.tokenId, username);

        setScanResult({
          success: true,
          message: `Chúc mừng! Bạn đã nhận được ${points} điểm từ ${qrData.boothId}`,
          points
        });
        return;
      }

      // If nothing matches
      setScanResult({
        success: false,
        message: 'QR code không hợp lệ hoặc không phải QR code của GM Vietnam'
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

  const handleCloseQRScanner = () => {
    // Close scanner directly without confirmation
    // The confirmation was causing issues when camera permission was denied
    setShowQRScanner(false);
  };

  const handleConfirmReject = () => {
    setShowQRScanner(false);
    setShowRejectConfirm(false);
    setScanResult({
      success: false,
      message: 'Bạn đã từ chối quét QR code. Có thể thử lại bất cứ lúc nào!'
    });
  };

  const handleCancelReject = () => {
    setShowRejectConfirm(false);
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
      {/* Mobile QR Scan Button */}
      <div className="text-center mb-6 sm:mb-8">
        <button
          onClick={() => setShowQRScanner(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 sm:px-8 sm:py-4 rounded-2xl font-semibold active:from-purple-600 active:to-pink-600 transition-all duration-200 active:scale-95 flex items-center mx-auto shadow-lg touch-manipulation text-lg sm:text-xl"
        >
          <QrCode className="h-6 w-6 sm:h-7 sm:w-7 mr-3" />
          Quét QR Code
        </button>
        <p className="text-white/60 text-sm sm:text-base mt-3">
          Quét QR code tại các booth để nhận điểm
        </p>
      </div>

      {/* Mobile-First Layout */}
      <div className="space-y-6 sm:space-y-8">
        {/* User Progress - Mobile First */}
        <div className="sm:hidden">
          {user && !userLoading && <UserProgress user={user} />}
          {userLoading && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-white/70 text-sm">Đang tải tiến trình...</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <Leaderboard users={users} currentUser={user} loading={usersLoading} />
        </div>

        {/* User Progress - Desktop */}
        <div className="hidden sm:block">
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
        onClose={handleCloseQRScanner}
        onScanSuccess={handleQRScan}
      />

      {/* Scan Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-md p-6">
            <div className="text-center">
              {scanResult.success ? (
                <>
                  {scanResult.isPending ? (
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-4">
                    {scanResult.isPending ? 'Đang chờ phân bổ điểm!' : 'Thành công!'}
                  </h3>
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

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Đóng QR Scanner?</h3>
            <p className="text-white/70 text-center mb-6">
              Bạn có chắc chắn muốn đóng QR Scanner không?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelReject}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Tiếp tục quét
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200"
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