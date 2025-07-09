import React from 'react';
import { User, CheckCircle, Circle, Star } from 'lucide-react';
import { User as UserType } from '../types';

interface UserProgressProps {
  user: UserType;
}

const booths = [
  { id: 'booth1', name: 'Coding Challenge', description: 'Giải thuật và lập trình', maxScore: 50 },
  { id: 'booth2', name: 'Gaming Arena', description: 'Thi đấu game mobile', maxScore: 40 },
  { id: 'booth3', name: 'Tech Quiz', description: 'Kiến thức công nghệ', maxScore: 30 },
  { id: 'booth4', name: 'Design Battle', description: 'Thiết kế sáng tạo', maxScore: 45 },
  { id: 'booth5', name: 'Startup Pitch', description: 'Thuyết trình ý tưởng', maxScore: 35 }
];

const UserProgress: React.FC<UserProgressProps> = ({ user }) => {
  const completedBooths = Object.keys(user.playedBooths).filter(boothId => user.playedBooths[boothId]);
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
            <p className="text-white/70 text-sm sm:text-base">Tiến trình cá nhân</p>
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
          const isCompleted = user.playedBooths[booth.id];
          
          return (
            <div
              key={booth.id}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : 'bg-white/20'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/50" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${isCompleted ? 'text-white' : 'text-white/90'}`}>
                    {booth.name}
                  </p>
                  <p className="text-white/60 text-sm">{booth.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Tối đa {booth.maxScore} điểm</p>
                {isCompleted && (
                  <p className="text-green-400 font-semibold text-sm">✓ Đã hoàn thành</p>
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