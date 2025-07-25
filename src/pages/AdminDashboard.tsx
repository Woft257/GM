import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  QrCode,
  Trophy,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  Edit3,
  Gift
} from 'lucide-react';

import { useUsers } from '../hooks/useUsers';
import { useGameStatus } from '../hooks/useGameStatus';
import { physicalBooths } from '../data/booths';
import { triggerGlobalReload } from '../lib/database';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const { gameStatus, loading } = useGameStatus();

  // Calculate stats
  const totalUsers = users.length;
  const totalScore = users.reduce((sum, user) => sum + user.totalScore, 0);
  const avgScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;
  const topScore = users.length > 0 ? Math.max(...users.map(u => u.totalScore)) : 0;

  if (loading || usersLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Đang tải dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header - Mobile Optimized */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* MEXC x GM Vietnam Collaboration Logo */}
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-5 sm:h-8" />
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                <span className="text-white/70 text-xs sm:text-sm hidden sm:inline">Admin Dashboard</span>
              </div>
              <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                gameStatus === 'active'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <span className="hidden sm:inline">{gameStatus === 'active' ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}</span>
                <span className="sm:hidden">{gameStatus === 'active' ? '🟢' : '🔴'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Admin Dashboard Title */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Quản lý sự kiện GM Vietnam
          </p>
        </div>

        {/* Stats Overview - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2 sm:p-4 text-center">
            <Users className="h-4 w-4 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-sm sm:text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-white/60 text-xs sm:text-sm">Người chơi</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2 sm:p-4 text-center">
            <Trophy className="h-4 w-4 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-sm sm:text-2xl font-bold text-white">{topScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm cao nhất</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2 sm:p-4 text-center">
            <BarChart3 className="h-4 w-4 sm:h-8 sm:w-8 text-green-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-sm sm:text-2xl font-bold text-white">{avgScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm TB</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2 sm:p-4 text-center">
            <Settings className="h-4 w-4 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-sm sm:text-2xl font-bold text-white">{physicalBooths.length}</div>
            <p className="text-white/60 text-xs sm:text-sm">Booth</p>
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Quản lý nhanh</h2>

          <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {/* QR Management */}
            <button
              onClick={() => navigate('/admin/booth-qr')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white p-2 sm:p-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-3 touch-manipulation active:scale-95 min-h-[60px] sm:min-h-[80px]"
            >
              <QrCode className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-base font-semibold">QR Codes</div>
                <div className="text-xs text-white/80 truncate hidden sm:block">Quản lý booth QR</div>
              </div>
            </button>

            {/* Game Control */}
            <button
              onClick={() => navigate('/admin/end')}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:from-red-800 active:to-orange-800 text-white p-2 sm:p-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-3 touch-manipulation active:scale-95 min-h-[60px] sm:min-h-[80px]"
            >
              <Trophy className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-base font-semibold">Kết thúc</div>
                <div className="text-xs text-white/80 truncate hidden sm:block">Quản lý sự kiện</div>
              </div>
            </button>

            {/* Score Management */}
            <button
              onClick={() => navigate('/admin/scores')}
              className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 active:from-yellow-800 active:to-amber-800 text-white p-2 sm:p-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-3 touch-manipulation active:scale-95 min-h-[60px] sm:min-h-[80px]"
            >
              <Edit3 className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-base font-semibold">Điểm số</div>
                <div className="text-xs text-white/80 truncate hidden sm:block">Chỉnh sửa điểm</div>
              </div>
            </button>

            {/* Reward Management */}
            <button
              onClick={() => navigate('/admin/rewards')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white p-2 sm:p-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-3 touch-manipulation active:scale-95 min-h-[60px] sm:min-h-[80px]"
            >
              <Gift className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-base font-semibold">Phần thưởng</div>
                <div className="text-xs text-white/80 truncate hidden sm:block">Quản lý thưởng</div>
              </div>
            </button>

            {/* Results */}
            <button
              onClick={() => navigate('/results')}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 active:from-green-800 active:to-teal-800 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 touch-manipulation active:scale-95"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm lg:text-base font-semibold">Kết quả</div>
                <div className="text-xs text-white/80 truncate">Xem bảng xếp hạng</div>
              </div>
            </button>

            {/* Global Reload */}
            <button
              onClick={async () => {
                if (window.confirm('Bạn có chắc chắn muốn buộc tất cả người dùng tải lại trang không? Hành động này không thể hoàn tác.')) {
                  try {
                    await triggerGlobalReload();
                    alert('Đã gửi lệnh tải lại trang cho tất cả người dùng.');
                  } catch (error) {
                    console.error('Lỗi khi gửi lệnh tải lại trang:', error);
                    alert('Không thể gửi lệnh tải lại trang. Vui lòng thử lại.');
                  }
                }
              }}
              className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 active:from-gray-800 active:to-gray-950 text-white p-2 sm:p-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-3 touch-manipulation active:scale-95 min-h-[60px] sm:min-h-[80px]"
            >
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-base font-semibold">Tải lại trang</div>
                <div className="text-xs text-white/80 truncate hidden sm:block">Buộc tất cả người dùng tải lại</div>
              </div>
            </button>
          </div>
        </div>

        {/* Booth Management - Mobile Optimized */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Phân bổ điểm Booth</h2>

          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {physicalBooths.map((booth) => (
              <button
                key={booth.id}
                onClick={() => navigate(`/admin/${booth.id}`)}
                className="bg-gradient-to-r from-blue-600/20 to-cyan-400/20 hover:from-blue-600/30 hover:to-cyan-400/30 border border-blue-500/30 hover:border-blue-400/50 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-200 text-left touch-manipulation active:scale-95"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">{booth.id.slice(-1)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm lg:text-base truncate">{booth.name}</div>
                    <div className="text-xs text-blue-300">{booth.minigames.length} minigames</div>
                  </div>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                  {booth.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
