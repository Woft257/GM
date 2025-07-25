import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, RotateCcw, AlertTriangle, Crown, Medal, Award } from 'lucide-react';

import { useUsers } from '../hooks/useUsers';
import { useGameStatus } from '../hooks/useGameStatus';
import {
  setGameStatus,
  resetAllData
} from '../lib/gameControl';
import { triggerGlobalReload } from '../lib/database';

const EndPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const { gameStatus, loading } = useGameStatus();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleEndGame = async () => {
    try {
      setActionLoading(true);
      await setGameStatus('ended');
    } catch (error) {
      console.error('Error ending game:', error);
      alert('Có lỗi khi kết thúc game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      setActionLoading(true);
      await setGameStatus('active');
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Có lỗi khi bắt đầu game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetGame = async () => {
    try {
      setResetting(true);
      await resetAllData();
      await triggerGlobalReload(); // Trigger global reload after data reset
      await setGameStatus('active');
      setShowResetConfirm(false);

      // Clear all client-side cached data (this will be handled by the global reload listener)
      localStorage.clear();
      sessionStorage.clear();

      alert('Đã reset thành công! Tất cả trang sẽ tự động tải lại.');

      // No need to force reload here, App.tsx listener will handle it
    } catch (error) {
      console.error('Error resetting game:', error);
      alert('Có lỗi khi reset game');
      setResetting(false);
    }
  };

  // Sort users by score for final ranking
  const sortedUsers = [...users].sort((a, b) => b.totalScore - a.totalScore);
  const winners = sortedUsers.slice(0, 10); // Top 10

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30';
      default: return 'bg-white/5 border-white/10';
    }
  };

  if (loading || usersLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-white/70 hover:text-white text-sm"
              >
                ← Về Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Quản lý sự kiện</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Kết thúc sự kiện và công bố người thắng
          </p>
        </div>

        {/* Game Status - Mobile Optimized */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Trạng thái game</h2>
            <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-center ${
              gameStatus === 'active'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {gameStatus === 'active' ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {gameStatus === 'active' ? (
              <button
                onClick={handleEndGame}
                disabled={actionLoading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 touch-manipulation"
              >
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">{actionLoading ? 'Đang kết thúc...' : 'Kết thúc sự kiện'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartGame}
                disabled={actionLoading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 touch-manipulation"
              >
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">{actionLoading ? 'Đang bắt đầu...' : 'Bắt đầu lại'}</span>
              </button>
            )}

            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={actionLoading || resetting}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 touch-manipulation"
            >
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Reset toàn bộ</span>
            </button>
          </div>
        </div>

        {/* Winners Section */}
        {gameStatus === 'ended' && (
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">🎉 Chúc mừng người thắng cuộc! 🎉</h2>
              <p className="text-white/70">Top 10 người chơi xuất sắc nhất</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {winners.map((user, index) => (
                <div
                  key={user.telegram}
                  className={`p-6 rounded-xl border ${getRankBg(index + 1)} text-center`}
                >
                  <div className="flex justify-center mb-3">
                    {index < 3 ? getRankIcon(index + 1) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-white/80 font-bold text-lg">#{index + 1}</span>
                      </div>
                    )}
                  </div>
                  {index < 3 && <h3 className="text-lg font-bold text-white mb-1">#{index + 1}</h3>}
                  <p className="text-white/90 font-semibold mb-2">{user.telegram}</p>
                  {user.mexcUID && (
                    <p className="text-white/70 text-xs mb-2">MEXC UID: {user.mexcUID}</p>
                  )}
                  <div className="text-2xl font-bold text-white">{user.totalScore}</div>
                  <p className="text-white/60 text-sm">điểm</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Bảng xếp hạng Top 10</h2>
            <div className="flex items-center text-white/60">
              <Users className="h-5 w-5 mr-2" />
              <span>{users.length} người chơi</span>
            </div>
          </div>

          <div className="space-y-3">
            {sortedUsers.slice(0, 10).map((user, index) => (
              <div
                key={user.telegram}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index < 3 ? getRankBg(index + 1) : 'bg-white/5'
                } border ${index < 3 ? '' : 'border-white/10'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {index < 3 ? getRankIcon(index + 1) : (
                      <span className="text-white/60 font-bold">#{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.telegram}</p>
                    {user.mexcUID && (
                      <p className="text-white/60 text-xs mt-1">MEXC UID: {user.mexcUID}</p>
                    )}
                    <p className="text-white/60 text-sm">
                      {Object.keys(user.scores || {}).filter(key => user.scores![key] > 0).length} minigame hoàn thành
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{user.totalScore}</div>
                  <p className="text-white/60 text-sm">điểm</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/90 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Xác nhận reset</h3>
                <p className="text-white/70">
                  Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và bắt đầu lại game không?
                  <br /><br />
                  <strong className="text-red-400">Hành động này không thể hoàn tác!</strong>
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetting}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleResetGame}
                  disabled={resetting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {resetting ? 'Đang reset...' : 'Xác nhận reset'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EndPage;
