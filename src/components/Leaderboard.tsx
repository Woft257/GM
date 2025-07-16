import React from 'react';
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
      case 1:
        return <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-white/70 text-xs sm:text-sm">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />
        <h3 className="text-lg sm:text-xl font-bold text-white">Bảng Xếp Hạng</h3>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {users.slice(0, 10).map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUser?.telegram === user.telegram;

          return (
            <div
              key={user.telegram}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 active:scale-98 ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                  : 'bg-white/5 active:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center flex-shrink-0`}>
                  {getRankIcon(rank)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm sm:text-base truncate ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
                    {user.telegram}
                    {isCurrentUser && <span className="ml-2 text-purple-300 text-xs">(Bạn)</span>}
                  </p>
                  <p className="text-white/60 text-xs">
                    {Object.keys(user.playedBooths).length} booth đã chơi
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg sm:text-xl font-bold text-white">{user.totalScore}</p>
                <p className="text-white/60 text-xs">điểm</p>
              </div>
            </div>
          );
        })}
      </div>

      {users.length > 10 && (
        <div className="text-center mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            Hiển thị top 10 / {users.length} người chơi
          </p>
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/70">Chưa có người chơi nào</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;