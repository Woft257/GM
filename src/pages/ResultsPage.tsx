import React, { useState, useEffect } from 'react';
import { Trophy, Users, Star, Crown, Medal, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { getGameStatus } from '../lib/gameControl';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const { username } = useAuth();
  const [gameEnded, setGameEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGameStatus();
  }, []);

  const checkGameStatus = async () => {
    try {
      const status = await getGameStatus();
      setGameEnded(status === 'ended');
    } catch (error) {
      console.error('Error checking game status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort users by score for final ranking
  const sortedUsers = [...users].sort((a, b) => b.totalScore - a.totalScore);
  const currentUser = sortedUsers.find(u => u.telegram === username);
  const currentUserRank = currentUser ? sortedUsers.findIndex(u => u.telegram === username) + 1 : null;
  const winners = sortedUsers.slice(0, 3); // Top 3

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
      <Layout title="Kết quả sự kiện">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-6"></div>
          <p className="text-white/70">Đang tải kết quả...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kết quả sự kiện">
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1 sm:space-x-2 text-white/70 hover:text-white transition-colors touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Về trang chủ</span>
          </button>

          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Kết quả sự kiện</h1>
          </div>

          <div className="w-16 sm:w-20"></div> {/* Spacer for flex layout */}
        </div>

        {/* Current User Result - Mobile Optimized */}
        {currentUser && currentUserRank && (
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-purple-500/30">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Kết quả của bạn</h2>

              {currentUserRank <= 10 ? (
                <div className="mb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">#{currentUserRank}</div>
                  <p className="text-yellow-300 font-semibold text-sm sm:text-base">🎉 Chúc mừng! Bạn nằm trong Top 10! 🎉</p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">#{currentUserRank}</div>
                  <p className="text-white/80 text-sm sm:text-base">Cảm ơn bạn đã tham gia!</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{currentUser.totalScore}</div>
                  <p className="text-white/60 text-sm">Tổng điểm</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">
                    {Object.keys(currentUser.playedBooths || {}).length}
                  </div>
                  <p className="text-white/60 text-sm">Booth hoàn thành</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Winners */}
        {gameEnded && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">🏆 Top 3 xuất sắc nhất</h2>
              <p className="text-white/70">Những người chơi có thành tích cao nhất</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {winners.map((user, index) => (
                <div
                  key={user.telegram}
                  className={`p-4 rounded-xl border ${getRankBg(index + 1)} text-center ${
                    user.telegram === username ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    {getRankIcon(index + 1)}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">#{index + 1}</h3>
                  <p className="text-white/90 font-semibold mb-2">{user.telegram}</p>
                  <div className="text-xl font-bold text-white">{user.totalScore}</div>
                  <p className="text-white/60 text-sm">điểm</p>
                  {user.telegram === username && (
                    <div className="mt-2">
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                        Bạn
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Bảng xếp hạng đầy đủ</h2>
            <div className="flex items-center text-white/60">
              <Users className="h-5 w-5 mr-2" />
              <span>{users.length} người chơi</span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedUsers.map((user, index) => (
              <div
                key={user.telegram}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index < 3 ? getRankBg(index + 1) : 'bg-white/5'
                } border ${index < 3 ? '' : 'border-white/10'} ${
                  user.telegram === username ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {index < 3 ? getRankIcon(index + 1) : (
                      <span className="text-white/60 font-bold">#{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-white">{user.telegram}</p>
                      {user.telegram === username && (
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      {Object.keys(user.playedBooths || {}).length} booth hoàn thành
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

        {/* Game Status Info */}
        <div className="text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
            gameEnded 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {gameEnded ? '🔴 Sự kiện đã kết thúc' : '🟢 Sự kiện đang diễn ra'}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResultsPage;
