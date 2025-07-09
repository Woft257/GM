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
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-bold text-white/70">#{rank}</span>;
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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-center mb-6">
        <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-xl font-bold text-white">Bảng Xếp Hạng</h3>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUser?.telegram === user.telegram;
          
          return (
            <div
              key={user.telegram}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-102 ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center`}>
                  {getRankIcon(rank)}
                </div>
                <div>
                  <p className={`font-semibold ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
                    {user.telegram}
                    {isCurrentUser && <span className="ml-2 text-purple-300 text-sm">(Bạn)</span>}
                  </p>
                  <p className="text-white/60 text-sm">
                    {Object.keys(user.playedBooths).length} booth đã chơi
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{user.totalScore}</p>
                <p className="text-white/60 text-sm">điểm</p>
              </div>
            </div>
          );
        })}
      </div>

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