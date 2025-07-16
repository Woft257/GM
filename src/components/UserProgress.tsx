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

  const completedBooths = Object.keys(user.playedBooths).filter(boothId => user.playedBooths[boothId]);
  const pendingBooths = pendingScores.map(ps => ps.boothId);
  const completionRate = (completedBooths.length / booths.length) * 100;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 sm:mr-4">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{user.telegram}</h3>
            <div className="flex items-center space-x-2">
              <p className="text-white/70 text-sm">Tiến trình cá nhân</p>
              {userRank && totalUsers && (
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
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
          <p className="text-white/60 text-xs sm:text-sm">điểm</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80 text-sm">Hoàn thành</span>
          <span className="text-white/80 text-sm">{completedBooths.length}/{booths.length} booth</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white mb-4">Danh sách Booth</h4>
        {booths.map((booth) => {
          const isCompleted = user.playedBooths[booth.id] || (user.scores && user.scores[booth.id] > 0);
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
            bgClass = 'bg-white/5 hover:bg-white/10';
            iconBg = 'bg-white/20';
            icon = <Circle className="h-5 w-5 text-white/50" />;
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
                  <p className={`font-semibold ${isCompleted || isPending ? 'text-white' : 'text-white/90'}`}>
                    {booth.name}
                  </p>
                  <p className="text-white/60 text-sm">{booth.description}</p>
                </div>
              </div>
              <div className="text-right">
                {isCompleted ? (
                  <p className="text-white font-semibold">{userScore}/{booth.maxScore} điểm</p>
                ) : (
                  <p className="text-white/80 text-sm">Tối đa {booth.maxScore} điểm</p>
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