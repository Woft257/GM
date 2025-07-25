import React from 'react';
import { User, CheckCircle, Circle, Star, Clock } from 'lucide-react';
import { User as UserType } from '../types';
import { usePendingScores } from '../hooks/usePendingScores';
import { booths } from '../data/booths';

interface UserProgressProps {
  user: UserType;
  userRank?: number;
  totalUsers?: number;
}

const UserProgress: React.FC<UserProgressProps> = ({ user, userRank, totalUsers }) => {
  const { pendingScores } = usePendingScores(user.telegram);

  const completedMinigames = Object.keys(user.scores || {}).filter(key => user.scores![key] > 0);
  const pendingBooths = pendingScores.map(ps => ps.boothId);
  const completionRate = (completedMinigames.length / booths.length) * 100;

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mr-3 sm:mr-4">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{user.telegram}</h3>
            {user.mexcUID && (
              <p className="text-gray-400 text-sm mt-1">MEXC UID: {user.mexcUID}</p>
            )}
            <div className="flex items-center space-x-2">
              <p className="text-gray-300 text-base">Tiến trình cá nhân</p>
              {userRank && totalUsers && (
                <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm px-2 py-1 rounded-full font-semibold">
                  #{userRank}/{totalUsers}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-1" />
            <span className="text-xl sm:text-2xl font-bold text-white">{user.totalScore}</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">điểm</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Hoàn thành</span>
          <span className="text-gray-300 text-sm">{completedMinigames.length}/{booths.length} minigame</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white mb-4">Danh sách các Minigame</h4>
        {booths.map((booth) => {
          const isCompleted = user.scores && user.scores[booth.id] > 0;
          const isPending = pendingBooths.includes(booth.id);
          const userScore = user.scores?.[booth.id] || 0;

          let bgClass, iconBg, icon, statusText, statusColor;

          if (isCompleted) {
            bgClass = 'bg-green-500/20 border border-green-500/30';
            iconBg = 'bg-green-500';
            icon = <CheckCircle className="h-5 w-5 text-white" />;
            statusText = '✓ Đã hoàn thành';
            statusColor = 'text-green-400';
          } else if (isPending) {
            bgClass = 'bg-yellow-500/20 border border-yellow-500/30';
            iconBg = 'bg-yellow-500';
            icon = <Clock className="h-5 w-5 text-white" />;
            statusText = '⏳ Chờ phân bổ điểm';
            statusColor = 'text-yellow-400';
          } else {
            bgClass = 'bg-gray-800/30 hover:bg-gray-800/50';
            iconBg = 'bg-gray-600/50';
            icon = <Circle className="h-5 w-5 text-gray-400" />;
            statusText = '';
            statusColor = '';
          }

          return (
            <div
              key={booth.id}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${bgClass}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
                  {icon}
                </div>
                <div>
                  <p className={`font-semibold text-base ${isCompleted || isPending ? 'text-white' : 'text-gray-200'}`}>
                    {booth.name}
                  </p>
                  <p className="text-gray-400 text-sm">{booth.description}</p>
                </div>
              </div>
              <div className="text-right">
                {isCompleted ? (
                  <p className="text-white font-semibold">
                    {userScore}{booth.maxScore !== 999999 ? `/${booth.maxScore}` : ''} điểm
                  </p>
                ) : (
                  booth.maxScore !== 999999 ? (
                    <p className="text-gray-300 text-sm">Tối đa {booth.maxScore} điểm</p>
                  ) : (
                    <p className="text-gray-300 text-sm">Không giới hạn</p>
                  )
                )}
                {statusText && (
                  <p className={`font-semibold text-sm ${statusColor}`}>{statusText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserProgress;
