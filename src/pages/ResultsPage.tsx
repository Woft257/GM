import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Crown, Medal, Award, ArrowLeft } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { useGameStatus } from '../hooks/useGameStatus';
import { getLuckyWinners, LuckyWinner } from '../lib/gameControl'; // Import lucky winner functions and type

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading: usersLoading } = useUsers();
  const { username } = useAuth();
  const { gameStatus, loading } = useGameStatus();
  const [isLuckyWinner, setIsLuckyWinner] = useState(false);

  useEffect(() => {
    const checkLuckyWinner = async () => {
      if (gameStatus === 'ended' && username) {
        const winnersData = await getLuckyWinners();
        if (winnersData && winnersData.winners) {
          const found = winnersData.winners.some(winner => winner.telegram === username);
          setIsLuckyWinner(found);
        }
      }
    };
    checkLuckyWinner();
  }, [gameStatus, username]);

  // Game ended state derived from gameStatus
  const gameEnded = gameStatus === 'ended';

  // Sort users by score for final ranking
  const sortedUsers = [...users].sort((a, b) => b.totalScore - a.totalScore);
  const currentUser = sortedUsers.find(u => u.telegram === username);
  const currentUserRank = currentUser ? sortedUsers.findIndex(u => u.telegram === username) + 1 : null;
  const winners = sortedUsers.slice(0, 5); // Top 5

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return null;
    }
  };


  if (loading || usersLoading) {
    return (
      <div className="min-h-screen bg-black">
        {/* MEXC-style Header */}
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                {/* MEXC x GM Vietnam Collaboration Logo */}
                <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-6"></div>
            <p className="text-gray-300 text-lg">Đang tải kết quả...</p>
          </div>
        </div>
      </div>
    );
  }

  // Block access if game is still active
  if (!gameEnded) {
    return (
      <div className="min-h-screen bg-black">
        {/* MEXC-style Header */}
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                {/* MEXC x GM Vietnam Collaboration Logo */}
                <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Sự kiện đang diễn ra</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Kết quả sẽ được công bố sau khi sự kiện kết thúc. Hãy tiếp tục tham gia để tích lũy điểm!
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center mx-auto space-x-3 text-lg shadow-lg shadow-blue-500/25"
              >
                <ArrowLeft className="h-6 w-6" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {/* MEXC x GM Vietnam Collaboration Logo */}
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Kết quả sự kiện</h1>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 px-4 py-3 rounded-xl border border-gray-600/50"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Về trang chủ</span>
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-600/50 px-4 py-2 rounded-xl border border-gray-600/50"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Về trang chủ</span>
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Kết quả sự kiện</h1>
              </div>

              <div className="w-24"></div> {/* Spacer for flex layout */}
            </div>
          </div>
        </div>

        {/* Current User Result */}
        {currentUser && currentUserRank && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Kết quả của bạn</h2>

                {gameEnded && isLuckyWinner ? (
                  <div className="mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
                      🎉 Chúc mừng! 🎉
                    </div>
                    <p className="text-green-300 font-semibold text-lg">
                      Bạn đã nằm trong top may mắn vui lòng liên hệ admin tại các booth để nhận quà
                    </p>
                  </div>
                ) : currentUserRank && currentUserRank <= 5 ? (
                  <div className="mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                      #{currentUserRank}
                    </div>
                    <p className="text-yellow-300 font-semibold text-lg">🎉 Chúc mừng! Bạn nằm trong Top 5! 🎉</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">#{currentUserRank}</div>
                    <p className="text-gray-300 text-lg">Cảm ơn bạn đã tham gia!</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-md mx-auto">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {currentUser.totalScore}
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Tổng điểm</p>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {Object.keys(currentUser.scores || {}).filter(key => currentUser.scores![key] > 0).length}
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Minigame hoàn thành</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 5 Winners */}
        {gameEnded && (
          <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">🏆 Top 5 xuất sắc nhất</h2>
              <p className="text-gray-300 text-sm sm:text-base">Những người chơi có thành tích cao nhất</p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {winners.map((user, index) => (
                <div
                  key={user.telegram}
                  className={`relative p-3 sm:p-4 rounded-2xl border text-center transition-all duration-200 hover:scale-105 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/40' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-slate-400/20 border-gray-400/40' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600/20 to-orange-500/20 border-amber-600/40' :
                    'bg-gray-800/50 border-gray-700/50'
                  } ${
                    user.telegram === username ? 'ring-2 ring-cyan-400' : ''
                  }`}
                >
                  <div className="flex justify-center mb-2 sm:mb-3">
                    {index < 3 ? getRankIcon(index + 1) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 font-bold text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                    )}
                  </div>
                  {index < 3 && (
                    <h3 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                    </h3>
                  )}
                  <p className="text-white font-semibold mb-2 sm:mb-3 text-xs sm:text-sm truncate">{user.telegram}</p>
                  <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                    {user.totalScore}
                  </div>
                  <p className="text-gray-400 text-xs">điểm</p>
                  {user.telegram === username && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
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
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Bảng xếp hạng đầy đủ</h2>
            <div className="flex items-center text-gray-300 bg-gray-800/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-gray-700/50 text-sm">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="font-semibold">{users.length} người chơi</span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {sortedUsers.map((user, index) => (
              <div
                key={user.telegram}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:bg-gray-700/30 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/40' :
                  index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/40' :
                  'bg-gray-800/30 border-gray-700/50'
                } ${
                  user.telegram === username ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {index < 3 ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400">
                        {getRankIcon(index + 1)}
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 font-bold text-sm">#{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-white">{user.telegram}</p>
                      {user.telegram === username && (
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {Object.keys(user.scores || {}).filter(key => user.scores![key] > 0).length} minigame hoàn thành
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {user.totalScore}
                  </div>
                  <p className="text-gray-400 text-sm">điểm</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Status Info */}
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold border ${
            gameEnded
              ? 'bg-red-500/20 text-red-400 border-red-500/40'
              : 'bg-green-500/20 text-green-400 border-green-500/40'
          }`}>
            {gameEnded ? '🔴 Sự kiện đã kết thúc' : '🟢 Sự kiện đang diễn ra'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
