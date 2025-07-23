import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Users, Trophy, Star, Search, X, Calendar } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import Layout from '../components/Layout';

const RewardDetails: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');

  const rewardMilestones = [
    { id: 'reward1', name: 'Phần thưởng 1', icon: <Gift className="h-4 w-4" />, color: 'from-green-500 to-emerald-500' },
    { id: 'reward2', name: 'Phần thưởng 2', icon: <Star className="h-4 w-4" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'reward3', name: 'Phần thưởng 3', icon: <Trophy className="h-4 w-4" />, color: 'from-purple-500 to-pink-500' }
  ];

  const getCompletedMinigames = (user: any) => {
    return user.scores ? Object.keys(user.scores).filter(key => user.scores[key] > 0).length : 0;
  };

  // Get all users who have claimed any reward
  const rewardedUsers = users.filter(user => {
    const rewards = user.rewards || {};
    return Object.values(rewards).some(claimed => claimed);
  }).filter(user => 
    user.telegram.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get users by specific reward
  const getUsersByReward = (rewardId: string) => {
    return users.filter(user => user.rewards?.[rewardId] || false)
      .filter(user => user.telegram.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getUserReward = (user: any) => {
    const rewards = user.rewards || {};
    const claimedRewardId = Object.keys(rewards).find(key => rewards[key]);
    return rewardMilestones.find(r => r.id === claimedRewardId);
  };

  const totalRewardedUsers = users.filter(user => {
    const rewards = user.rewards || {};
    return Object.values(rewards).some(claimed => claimed);
  }).length;

  return (
    <Layout title="Chi tiết Phần thưởng">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => navigate('/admin/rewards')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Quản lý Phần thưởng</span>
          </button>

          <div className="flex items-center text-white/80 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg">
            <Users className="h-4 w-4 mr-2" />
            <span className="font-medium">{totalRewardedUsers} đã nhận thưởng</span>
          </div>
        </div>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người chơi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg pl-10 pr-10 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-white/70 text-sm mt-2">
              Tìm thấy {rewardedUsers.length} người đã nhận thưởng
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics by Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {rewardMilestones.map((milestone) => {
                const count = getUsersByReward(milestone.id).length;

                return (
                  <div key={milestone.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center`}>
                        {milestone.icon}
                      </div>
                      <h4 className="font-medium text-white">{milestone.name}</h4>
                    </div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-white/60 text-sm">người đã nhận</p>
                  </div>
                );
              })}
            </div>


            {/* All Rewarded Users */}
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Tất cả người đã nhận thưởng
              </h3>

              {rewardedUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewardedUsers.map((user) => {
                    const reward = getUserReward(user);
                    const completedMinigames = getCompletedMinigames(user);
                    
                    return (
                      <div key={user.telegram} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {reward && (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${reward.color} flex items-center justify-center`}>
                              {reward.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{user.telegram}</h4>
                            <p className="text-gray-400 text-sm">
                              {completedMinigames} minigame hoàn thành
                            </p>
                          </div>
                        </div>
                        
                        {reward && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                            <p className="text-green-400 text-sm font-medium">
                              ✅ {reward.name}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center text-gray-400 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {searchTerm ? 'Không tìm thấy người chơi nào' : 'Chưa có ai nhận thưởng'}
                  </p>
                </div>
              )}
            </div>


          </div>
        )}
      </div>
    </Layout>
  );
};

export default RewardDetails;
