import React from 'react';
import { Gift, Star, Trophy, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface RewardProgressProps {
  user: User;
}

const RewardProgress: React.FC<RewardProgressProps> = ({ user }) => {
  const completedMinigames = user.scores ? Object.keys(user.scores).filter(key => user.scores![key] > 0).length : 0;
  const userRewards = user.rewards || {};

  const rewardMilestones = [
    {
      id: 'reward1',
      name: 'Phần thưởng 1',
      description: 'Hoàn thành 1-2 minigame',
      minGames: 1,
      maxGames: 2,
      icon: <Gift className="h-4 w-4" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'reward2',
      name: 'Phần thưởng 2',
      description: 'Hoàn thành 3-4 minigame',
      minGames: 3,
      maxGames: 4,
      icon: <Star className="h-4 w-4" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'reward3',
      name: 'Phần thưởng 3',
      description: 'Hoàn thành 5-6 minigame',
      minGames: 5,
      maxGames: 6,
      icon: <Trophy className="h-4 w-4" />,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  // Check if user has claimed any reward
  const hasClaimedReward = Object.values(userRewards).some(claimed => claimed);
  const claimedRewardId = Object.keys(userRewards).find(key => userRewards[key]);

  const getRewardStatus = (milestone: typeof rewardMilestones[0]) => {
    const isEligible = completedMinigames >= milestone.minGames;
    const isClaimed = userRewards[milestone.id] || false;

    if (isClaimed) return 'claimed';
    if (hasClaimedReward && !isClaimed) return 'blocked'; // Blocked because user claimed another reward
    if (isEligible) return 'eligible';
    return 'locked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'text-green-400';
      case 'eligible': return 'text-yellow-400';
      case 'blocked': return 'text-red-400';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'claimed': return 'Đã nhận';
      case 'eligible': return 'Đủ điều kiện';
      case 'blocked': return 'Đã nhận quà khác';
      default: return 'Chưa đủ điều kiện';
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mr-2" />
        <h3 className="text-lg sm:text-xl font-bold text-white">Phần Thưởng</h3>
      </div>

      {hasClaimedReward && (
        <div className="mb-6 text-center">
          <p className="text-green-400 text-sm font-medium">
            ✅ Đã nhận: {rewardMilestones.find(r => r.id === claimedRewardId)?.name}
          </p>
        </div>
      )}

      {/* Reward Cards */}
      <div className="space-y-3">
        {rewardMilestones.map((milestone, index) => {
          const status = getRewardStatus(milestone);

          return (
            <div key={milestone.id} className={`p-4 rounded-xl border transition-all duration-300 ${
              status === 'claimed'
                ? 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20'
                : status === 'eligible'
                ? 'bg-yellow-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20 animate-pulse'
                : status === 'blocked'
                ? 'bg-red-500/10 border-red-500/30 opacity-60'
                : 'bg-gray-800/30 border-gray-700/50 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center ${
                    status === 'locked' || status === 'blocked' ? 'opacity-50' : 'shadow-lg'
                  } ${status === 'eligible' ? 'animate-bounce' : ''}`}>
                    {status === 'claimed' ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white">{milestone.icon}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{milestone.name}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completedMinigames === 6 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-center">
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <h4 className="font-bold text-white mb-1">Chúc mừng!</h4>
          <p className="text-gray-300 text-sm">Bạn đã hoàn thành tất cả minigame!</p>
        </div>
      )}
    </div>
  );
};

export default RewardProgress;
