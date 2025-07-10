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
  CheckCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { useUsers } from '../hooks/useUsers';
import { getGameStatus } from '../lib/gameControl';
import { booths } from '../data/booths';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const [gameStatus, setGameStatus] = useState<'active' | 'ended'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameStatus();
  }, []);

  const loadGameStatus = async () => {
    try {
      const status = await getGameStatus();
      setGameStatus(status);
    } catch (error) {
      console.error('Error loading game status:', error);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Quản lý sự kiện GM Vietnam
          </p>
        </div>

        {/* Game Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Trạng thái sự kiện</h2>
            <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-center ${
              gameStatus === 'active' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {gameStatus === 'active' ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-white/60 text-xs sm:text-sm">Người chơi</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-white">{topScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm cao nhất</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-white">{avgScore}</div>
            <p className="text-white/60 text-xs sm:text-sm">Điểm TB</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 text-center">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-white">{booths.length}</div>
            <p className="text-white/60 text-xs sm:text-sm">Booth</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Quản lý nhanh</h2>
          
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Booth Management */}
            <button
              onClick={() => navigate('/admin/booth-qr')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 touch-manipulation"
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-left">
                <div className="text-sm sm:text-base">QR Codes</div>
                <div className="text-xs text-white/80">Quản lý booth QR</div>
              </div>
            </button>

            {/* Game Control */}
            <button
              onClick={() => navigate('/admin/end')}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white p-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 touch-manipulation"
            >
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-left">
                <div className="text-sm sm:text-base">Kết thúc</div>
                <div className="text-xs text-white/80">Quản lý sự kiện</div>
              </div>
            </button>

            {/* Results */}
            <button
              onClick={() => navigate('/results')}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white p-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 touch-manipulation"
            >
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-left">
                <div className="text-sm sm:text-base">Kết quả</div>
                <div className="text-xs text-white/80">Xem bảng xếp hạng</div>
              </div>
            </button>
          </div>
        </div>

        {/* Booth Management */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Quản lý Booth</h2>
          
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {booths.map((booth) => (
              <button
                key={booth.id}
                onClick={() => navigate(`/admin/${booth.id}`)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white p-4 rounded-xl transition-all duration-200 text-left touch-manipulation"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{booth.id.slice(-1)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{booth.name}</div>
                    <div className="text-xs text-white/60">Max: {booth.maxScore} điểm</div>
                  </div>
                </div>
                <p className="text-white/70 text-xs sm:text-sm line-clamp-2">
                  {booth.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
