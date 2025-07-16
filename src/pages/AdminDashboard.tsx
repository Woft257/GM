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
  Edit3
} from 'lucide-react';
import Layout from '../components/Layout';
import { useUsers } from '../hooks/useUsers';
import { useGameStatus } from '../hooks/useGameStatus';
import { booths } from '../data/booths';

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
      <Layout title="Admin Dashboard">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white/70">Đang tải dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Quản lý sự kiện GM Vietnam
          </p>
        </div>

        {/* Game Status - Mobile Optimized */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Trạng thái sự kiện</h2>
            <div className={`px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-center ${
              gameStatus === 'active'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {gameStatus === 'active' ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
            </div>
          </div>
        </div>

        {/* Stats Overview - Mobile First */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-white/60 text-xs sm:text-sm">Người chơi</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{topScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm cao nhất</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{avgScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm TB</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{booths.length}</div>
            <p className="text-white/60 text-xs sm:text-sm">Booth</p>
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/20">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Quản lý nhanh</h2>

          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
            {/* QR Management */}
            <button
              onClick={() => navigate('/admin/booth-qr')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 touch-manipulation active:scale-95"
            >
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm lg:text-base font-semibold">QR Codes</div>
                <div className="text-xs text-white/80 truncate">Quản lý booth QR</div>
              </div>
            </button>

            {/* Game Control */}
            <button
              onClick={() => navigate('/admin/end')}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:from-red-800 active:to-orange-800 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 touch-manipulation active:scale-95"
            >
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm lg:text-base font-semibold">Kết thúc</div>
                <div className="text-xs text-white/80 truncate">Quản lý sự kiện</div>
              </div>
            </button>

            {/* Score Management */}
            <button
              onClick={() => navigate('/admin/scores')}
              className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 active:from-yellow-800 active:to-amber-800 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 touch-manipulation active:scale-95"
            >
              <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm lg:text-base font-semibold">Điểm số</div>
                <div className="text-xs text-white/80 truncate">Chỉnh sửa điểm</div>
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
          </div>
        </div>

        {/* Booth Management - Mobile Optimized */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/20">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Quản lý Booth</h2>

          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {booths.map((booth) => (
              <button
                key={booth.id}
                onClick={() => navigate(`/admin/${booth.id}`)}
                className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-200 text-left touch-manipulation active:scale-95"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">{booth.id.slice(-1)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm lg:text-base truncate">{booth.name}</div>
                    <div className="text-xs text-white/60">Max: {booth.maxScore} điểm</div>
                  </div>
                </div>
                <p className="text-white/70 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                  {booth.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Back to Home - Mobile Optimized */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white active:text-white/90 transition-colors text-sm sm:text-base touch-manipulation py-2 px-4"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
