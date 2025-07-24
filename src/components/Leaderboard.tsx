import React, { useMemo } from 'react';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { User } from '../types';

interface LeaderboardProps {
  users: User[];
  currentUser?: User | null;
  loading?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser, loading }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />;
      default: return null;
    }
  };

  // Memoize top 10 users to avoid unnecessary re-renders
  const topUsers = useMemo(() => users.slice(0, 10), [users]);

  if (loading) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />
        <h2 className="text-lg sm:text-xl font-bold text-white">Bảng Xếp Hạng</h2>
      </div>

      <div className="space-y-3">
        {topUsers.map((user, index) => {
          const isCurrentUser = currentUser?.telegram === user.telegram;

          return (
            <div
              key={user.telegram}
              className={`flex items-center justify-between p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 hover:bg-gray-700/30 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40' :
                index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/40' :
                index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/40' :
                'bg-gray-800/30 border-gray-700/50'
              } ${
                isCurrentUser ? 'ring-1 sm:ring-2 ring-cyan-400' : ''
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  {index < 3 ? (
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400">
                      {getRankIcon(index + 1)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700/50 rounded-full flex items-center justify-center">
                      <span className="text-gray-300 font-bold text-xs sm:text-sm">#{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <p className="font-semibold text-white text-base sm:text-lg truncate">{user.telegram}</p>
                    {isCurrentUser && (
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-sm font-semibold flex-shrink-0">
                        Bạn
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {Object.keys(user.scores || {}).filter(key => user.scores![key] > 0).length} minigame đã chơi
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {user.totalScore}
                </div>
                <p className="text-gray-400 text-sm">điểm</p>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Chưa có người chơi nào</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;