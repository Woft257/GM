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
import { QrCode, CheckCircle, XCircle, Clock, Trophy, Eye } from 'lucide-react';
import { isQRScanningAllowed, getGameStatus } from '../lib/gameControl';

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
  const [gameEnded, setGameEnded] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  // Check game status on load
  useEffect(() => {
    checkGameStatus();
  }, []);

  // Listen for game reset events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'game_reset_timestamp') {
        // Game was reset, logout user and reload
        // Clear user session
        localStorage.removeItem('username');
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate user ranking when users data changes
  useEffect(() => {
    if (user && users.length > 0) {
      const sortedUsers = [...users].sort((a, b) => b.totalScore - a.totalScore);
      const rank = sortedUsers.findIndex(u => u.telegram === user.telegram) + 1;
      setUserRank(rank);
    }
  }, [user, users]);

  const checkGameStatus = async () => {
    try {
      const status = await getGameStatus();
      setGameEnded(status === 'ended');
    } catch (error) {
      console.error('Error checking game status:', error);
    }
  };

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

    // Check if game is still active
    const gameActive = await isQRScanningAllowed();
    if (!gameActive) {
      setScanResult({
        success: false,
        message: 'Sự kiện đã kết thúc. Không thể quét QR code nữa.'
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
        await createPendingScore(boothQRData.boothId, username);

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
      <div className="min-h-screen bg-black">
        {/* MEXC-style Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* MEXC Logo */}
                <img src="/mexc-logo.svg" alt="MEXC" className="h-5" />

                {/* X Symbol */}
                <span className="text-white/60 text-xl font-bold">×</span>

                {/* GM Vietnam Logo */}
                <img src="/gm-vietnam-logo.svg" alt="GM Vietnam" className="h-8" />
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameEnded
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {gameEnded ? '🔴 Đã kết thúc' : '🟢 Đang diễn ra'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {gameEnded ? (
            <div className="text-center py-16">
              {/* MEXC-style Hero Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 sm:p-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Sự kiện đã kết thúc
                  </h1>
                  <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                    Cảm ơn bạn đã quan tâm! Sự kiện GM Vietnam đã kết thúc và không còn nhận đăng ký mới.
                  </p>
                  <button
                    onClick={() => navigate('/results')}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center mx-auto space-x-3 text-lg shadow-lg shadow-blue-500/25"
                  >
                    <Eye className="h-6 w-6" />
                    <span>Xem kết quả sự kiện</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              {/* MEXC-style Login Hero */}
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8 sm:p-12 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">🎯</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                      Tham gia GM Vietnam
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                      Quét QR code tại các booth để nhận điểm và tham gia bảng xếp hạng
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <LoginForm onLogin={async (username) => {
                      try {
                        setLoginError('');
                        await login(username);
                      } catch (error: any) {
                        setLoginError(error.message || 'Có lỗi xảy ra khi đăng nhập');
                      }
                    }} />
                    {loginError && (
                      <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <p className="text-red-300 text-sm text-center">{loginError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* MEXC Logo */}
              <img src="/mexc-logo.svg" alt="MEXC" className="h-5" />

              {/* X Symbol */}
              <span className="text-white/60 text-xl font-bold">×</span>

              {/* GM Vietnam Logo */}
              <img src="/gm-vietnam-logo.svg" alt="GM Vietnam" className="h-8" />
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                gameEnded
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {gameEnded ? '🔴 Đã kết thúc' : '🟢 Đang diễn ra'}
              </div>
              <div className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/50">
                <span className="text-white font-semibold">{username.startsWith('@') ? username : `@${username}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section - QR Scan or Game End */}
        <div className="relative">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 sm:p-8 text-center">
            {!gameEnded ? (
          <>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 active:scale-95 flex items-center mx-auto shadow-lg shadow-blue-500/25 touch-manipulation text-lg"
            >
              <QrCode className="h-6 w-6 sm:h-7 sm:w-7 mr-3" />
              Quét QR Code
            </button>
            <p className="text-white/60 text-sm sm:text-base mt-3">
              Quét QR code tại các booth để nhận điểm
            </p>
          </>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>

              {userRank && userRank <= 10 ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    🎉 Chúc mừng! Bạn đứng thứ {userRank}! 🎉
                  </h2>
                  <p className="text-yellow-300 font-semibold mb-4">
                    Bạn nằm trong Top 10 xuất sắc nhất!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Sự kiện đã kết thúc!
                  </h2>
                  {userRank && (
                    <p className="text-white/80 mb-4">
                      Bạn đứng thứ {userRank} với {user?.totalScore || 0} điểm
                    </p>
                  )}
                </>
              )}

              <button
                onClick={() => navigate('/results')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center mx-auto space-x-2"
              >
                <Eye className="h-5 w-5" />
                <span>Xem kết quả chi tiết</span>
              </button>
            </div>
          </div>
            )}
          </div>
        </div>

        {/* Mobile-First Layout */}
        <div className="space-y-6 sm:space-y-8">
        {/* User Progress - Mobile First */}
        <div className="sm:hidden">
          {user && !userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <UserProgress user={user} />
            </div>
          )}
          {userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-gray-300 text-sm">Đang tải tiến trình...</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <Leaderboard users={users} currentUser={user} loading={usersLoading} />
        </div>

        {/* User Progress - Desktop */}
        <div className="hidden sm:block">
          {user && !userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <UserProgress user={user} />
            </div>
          )}
          {userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Đang tải tiến trình...</p>
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
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-gray-700/50 w-full max-w-md p-6 shadow-2xl">
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
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 shadow-lg shadow-blue-500/25"
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
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Đóng QR Scanner?</h3>
            <p className="text-white/70 text-center mb-6">
              Bạn có chắc chắn muốn đóng QR Scanner không?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelReject}
                className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50"
              >
                Tiếp tục quét
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HomePage;