import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Users, Trophy, Star, Search, X, Calendar, Trash2 } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { updateUserReward } from '../lib/database';


const RewardDetails: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [removingReward, setRemovingReward] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ username: string; rewardName: string } | null>(null);

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

  const handleRemoveReward = async (username: string) => {
    if (!showConfirmDialog) return;

    try {
      setRemovingReward(username);

      // Find which reward the user has claimed
      const user = users.find(u => u.telegram === username);
      if (!user || !user.rewards) return;

      const claimedRewardId = Object.keys(user.rewards).find(key => user.rewards![key]);
      if (!claimedRewardId) return;

      // Remove the reward by setting it to false
      await updateUserReward(username, claimedRewardId, false);

      setShowConfirmDialog(null);
      setRemovingReward(null);

      // Show success message and option to go back
      const goBack = confirm('Đã bỏ gán thưởng thành công!\n\nBạn có muốn quay lại trang cấp thưởng không?');
      if (goBack) {
        navigate('/admin/rewards');
      }

    } catch (error) {
      console.error('Error removing reward:', error);
      alert('Có lỗi khi bỏ gán thưởng');
      setRemovingReward(null);
    }
  };

  const confirmRemoveReward = (username: string, rewardName: string) => {
    setShowConfirmDialog({ username, rewardName });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* MEXC-style Header */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/mexc-gm-collaboration-logo.png" alt="MEXC x GM Vietnam" className="h-6 sm:h-8" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/admin/rewards')}
                className="text-white/70 hover:text-white text-sm"
              >
                ← Về Quản lý Phần thưởng
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Chi tiết Phần thưởng</h1>
          <p className="text-white/70 text-sm sm:text-base">
            Xem chi tiết người chơi đã nhận phần thưởng
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center text-white/80 bg-gray-900/50 border border-gray-800 px-4 py-2 rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">{totalRewardedUsers} người đã nhận thưởng</span>
            </div>
          </div>

          {/* Info about remove function */}
          <div className="flex justify-center">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 max-w-md">
              <div className="flex items-start space-x-2">
                <Trash2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-sm">
                  Bạn có thể <strong>bỏ gán thưởng</strong> cho người chơi bằng cách nhấn nút "Bỏ gán" trên mỗi thẻ người chơi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người chơi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  <div key={milestone.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
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
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-3">
                            <p className="text-green-400 text-sm font-medium">
                              ✅ {reward.name}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-400 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>

                          {reward && (
                            <button
                              onClick={() => confirmRemoveReward(user.telegram, reward.name)}
                              disabled={removingReward === user.telegram}
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Bỏ gán thưởng"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>{removingReward === user.telegram ? 'Đang xử lý...' : 'Bỏ gán'}</span>
                            </button>
                          )}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Xác nhận bỏ gán thưởng</h3>
              <p className="text-gray-300 mb-6">
                Bạn có chắc chắn muốn bỏ gán thưởng <strong className="text-yellow-400">{showConfirmDialog.rewardName}</strong>
                {' '}của người chơi <strong className="text-cyan-400">{showConfirmDialog.username}</strong>?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRemoveReward(showConfirmDialog.username)}
                  disabled={removingReward === showConfirmDialog.username}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removingReward === showConfirmDialog.username ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardDetails;
