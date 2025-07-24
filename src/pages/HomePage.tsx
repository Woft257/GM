import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import Leaderboard from '../components/Leaderboard';
import UserProgress from '../components/UserProgress';
import QRScanner from '../components/QRScanner';
import MexcBackground from '../components/MexcBackground';
import { useAuth } from '../hooks/useAuth';
import { useUsers, useUser } from '../hooks/useUsers';
import { parseQRData, validateQRData } from '../lib/qrcode';
import { useQRToken, useQRTokenBySimpleCode, createPendingScore } from '../lib/database';
import { parseBoothQRData, validateBoothQRData } from '../lib/boothQR';
import { usePendingScores } from '../hooks/usePendingScores';
import { getBoothName, physicalBooths, getMinigamesForBooth } from '../data/booths';
import { QrCode, CheckCircle, XCircle, Clock, Trophy, Eye, Gift } from 'lucide-react';
import { isQRScanningAllowed } from '../lib/gameControl';
import { useGameStatus } from '../hooks/useGameStatus';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { username, login, isLoading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { user, loading: userLoading } = useUser(username || '');
  const { pendingScores } = usePendingScores(username);
  const { gameStatus } = useGameStatus();

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
    isPending?: boolean;
    boothId?: string;
  } | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  // Game ended state derived from gameStatus
  const gameEnded = gameStatus === 'ended';

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
        // Check if user has already completed all minigames for this booth
        const boothMinigames = getMinigamesForBooth(boothQRData.boothId);
        const userScores = user?.scores || {};

        const completedMinigames = boothMinigames.filter(minigame =>
          userScores[minigame.id] !== undefined && userScores[minigame.id] > 0
        );

        if (completedMinigames.length === boothMinigames.length) {
          setScanResult({
            success: false,
            message: `Bạn đã hoàn thành tất cả minigame của ${boothQRData.boothId}. Không thể quét lại!`
          });
          return;
        }

        // Check if user already has pending score for this booth
        try {
          // Create pending score entry
          await createPendingScore(boothQRData.boothId, username);

          // Show success message and stay on home page
          setScanResult({
            success: true,
            message: `Đã quét thành công ${boothQRData.boothId}! Đang chờ admin phân bổ điểm...`,
            isPending: true,
            boothId: boothQRData.boothId
          });
        } catch (error: any) {
          setScanResult({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi tạo yêu cầu phân bổ điểm'
          });
        }
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
      <MexcBackground>
        {/* MEXC-style Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* MEXC x GM Vietnam Collaboration Logo */}
                <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-8" />
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
            <div className="px-4 py-8">
              {/* MEXC-style Login Hero */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl font-bold">🎯</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Tham gia MEXC Minigame
                  </h1>
                  <p className="text-gray-400 text-sm mb-6">
                    Quét QR code tại các booth để nhận điểm và tham gia bảng xếp hạng
                  </p>
                </div>

                <div className="w-full">
                  <LoginForm onLogin={async (username) => {
                    try {
                      setLoginError('');
                      await login(username);
                    } catch (error: any) {
                      setLoginError(error.message || 'Có lỗi xảy ra khi đăng nhập');
                    }
                  }} />
                  {loginError && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm text-center">{loginError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </MexcBackground>
    );
  }

  return (
    <MexcBackground>
      {/* MEXC-style Header - Mobile Optimized */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* MEXC x GM Vietnam Collaboration Logo */}
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-5 sm:h-8" />
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                gameEnded
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                <span className="hidden sm:inline">{gameEnded ? '🔴 Đã kết thúc' : '🟢 Đang diễn ra'}</span>
                <span className="sm:hidden text-xs">{gameEnded ? '🔴' : '🟢'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Hero Section - QR Scan or Game End */}
        <div className="relative">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 text-center">
            {!gameEnded ? (
          <>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white px-4 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 touch-manipulation text-base sm:text-lg w-full max-w-xs sm:max-w-none sm:w-auto min-h-[48px]"
            >
              <QrCode className="h-4 w-4 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
              <span>Quét QR Code</span>
            </button>
            <p className="text-white/60 text-sm sm:text-base mt-2 sm:mt-3">
              Quét QR code tại các booth để nhận điểm
            </p>
          </>
        ) : (
          <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>

              {userRank && userRank <= 10 ? (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    🎉 Chúc mừng! Bạn đứng thứ {userRank}! 🎉
                  </h2>
                  <p className="text-yellow-300 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                    Bạn nằm trong Top 10 xuất sắc nhất!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Sự kiện đã kết thúc!
                  </h2>
                  {userRank && (
                    <p className="text-white/80 mb-3 sm:mb-4 text-sm sm:text-base">
                      Bạn đứng thứ {userRank} với {user?.totalScore || 0} điểm
                    </p>
                  )}
                </>
              )}

              <button
                onClick={() => navigate('/results')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center mx-auto space-x-2 text-sm sm:text-base shadow-lg shadow-blue-500/25"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Xem kết quả chi tiết</span>
              </button>
            </div>
          </div>
            )}
          </div>
        </div>

        {/* Mobile-First Layout */}
        <div className="space-y-4 sm:space-y-6">
        {/* User Progress - Mobile First */}
        <div className="sm:hidden">
          {user && !userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
              <UserProgress
                user={user}
                userRank={users.findIndex(u => u.telegram === user.telegram) + 1 || undefined}
                totalUsers={users.length || undefined}
              />
            </div>
          )}
          {userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
              <div className="text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-300 text-sm">Đang tải tiến trình...</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-6">
          <Leaderboard users={users} currentUser={user} loading={usersLoading} />
        </div>

        {/* Rewards Section */}
        {user && !gameEnded && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-6">
              <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Phần thưởng</h3>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-400 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-yellow-300 text-sm font-semibold mb-1">Lưu ý quan trọng:</p>
                  <p className="text-yellow-200 text-xs sm:text-sm">
                    Mỗi người chơi chỉ được đổi <strong>1 phần quà duy nhất</strong> tại booth nhận thưởng.
                    Hãy cân nhắc kỹ trước khi chọn phần thưởng!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {/* Reward milestones */}
              {(() => {
                const completedMinigames = user?.scores ? Object.keys(user.scores).filter(key => (user.scores?.[key] || 0) > 0).length : 0;
                const hasAnyReward = user.rewards && Object.values(user.rewards).some(claimed => claimed);

                const rewards = [
                  { name: 'Phần thưởng Đồng', icon: '🥉', color: 'from-amber-600 to-yellow-500', shadow: 'shadow-amber-500/20', minGames: 1, maxGames: 2 },
                  { name: 'Phần thưởng Bạc', icon: '🥈', color: 'from-gray-400 to-gray-300', shadow: 'shadow-gray-400/20', minGames: 3, maxGames: 4 },
                  { name: 'Phần thưởng Vàng', icon: '🥇', color: 'from-yellow-400 to-amber-300', shadow: 'shadow-yellow-400/20', minGames: 5, maxGames: 6 }
                ];

                return rewards.map((reward, index) => {
                  const rewardKey = `reward${index + 1}`;
                  const isClaimed = user.rewards && user.rewards[rewardKey];
                  const isEligible = completedMinigames >= reward.minGames;

                  return (
                    <div key={index} className={`relative overflow-hidden rounded-lg sm:rounded-xl border transition-all duration-300 ${
                      isClaimed
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40 shadow-lg shadow-green-500/10'
                        : isEligible && !hasAnyReward
                          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/40 shadow-lg shadow-yellow-500/10'
                          : 'bg-gradient-to-r from-gray-800/40 to-gray-700/20 border-gray-600/20 opacity-60'
                    }`}>
                      <div className="p-3 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r ${
                              isClaimed || (isEligible && !hasAnyReward) ? reward.color : 'from-gray-600 to-gray-500'
                            } flex items-center justify-center ${
                              isClaimed || (isEligible && !hasAnyReward) ? reward.shadow : 'shadow-gray-500/10'
                            } shadow-lg flex-shrink-0`}>
                              <span className={`text-sm sm:text-2xl ${
                                isClaimed || (isEligible && !hasAnyReward) ? '' : 'grayscale opacity-60'
                              }`}>{reward.icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-sm sm:text-base font-semibold ${
                                isClaimed || (isEligible && !hasAnyReward) ? 'text-white' : 'text-gray-500'
                              } truncate`}>{reward.name}</h4>
                              <p className="text-gray-400 text-sm">
                                {reward.minGames === reward.maxGames
                                  ? `${reward.minGames} minigame`
                                  : `${reward.minGames}+ minigames`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isClaimed ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className="w-5 h-5 sm:w-7 sm:h-7 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-green-400 text-sm font-medium hidden sm:inline">Đã nhận</span>
                              </div>
                            ) : isEligible && !hasAnyReward ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className="w-5 h-5 sm:w-7 sm:h-7 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                                  <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                </div>
                                <span className="text-yellow-400 text-sm font-medium hidden sm:inline">Đủ điều kiện</span>
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gray-600 rounded-full flex items-center justify-center">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Decorative gradient overlay */}
                      {isClaimed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent pointer-events-none"></div>
                      )}
                      {isEligible && !isClaimed && !hasAnyReward && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent pointer-events-none"></div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Notice about reward limitation */}
            {(() => {
              const completedMinigames = user?.scores ? Object.keys(user.scores).filter(key => (user.scores?.[key] || 0) > 0).length : 0;
              const hasAnyReward = user.rewards && Object.values(user.rewards).some(claimed => claimed);
              const eligibleRewards = [
                { minGames: 1 },
                { minGames: 3 },
                { minGames: 5 }
              ].filter(reward => completedMinigames >= reward.minGames);

              if (eligibleRewards.length > 1 && !hasAnyReward) {
                return (
                  <div className="mt-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs sm:text-sm">!</span>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs sm:text-sm font-medium mb-1">
                          Lưu ý quan trọng
                        </p>
                        <p className="text-blue-200 text-xs sm:text-sm leading-relaxed">
                          Bạn đủ điều kiện nhận {eligibleRewards.length} phần thưởng, nhưng chỉ được chọn đổi <span className="font-semibold">1 phần thưởng duy nhất</span>.
                          Hãy cân nhắc kỹ trước khi đổi tại booth admin.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* User Progress - Desktop */}
        <div className="hidden sm:block">
          {user && !userLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <UserProgress
                user={user}
                userRank={users.findIndex(u => u.telegram === user.telegram) + 1 || undefined}
                totalUsers={users.length || undefined}
              />
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
    </MexcBackground>
  );
};

export default HomePage;