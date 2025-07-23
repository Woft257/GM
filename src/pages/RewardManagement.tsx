import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Users, CheckCircle, AlertCircle, Trophy, Search, X } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { updateUserReward } from '../lib/database';
import Layout from '../components/Layout';

const RewardManagement: React.FC = () => {
  const navigate = useNavigate();
  const { users, loading } = useUsers();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debug logging
  console.log('RewardManagement - users:', users);
  console.log('RewardManagement - loading:', loading);

  const rewardMilestones = [
    { id: 'reward1', name: 'Phần thưởng 1', minGames: 1, maxGames: 2 },
    { id: 'reward2', name: 'Phần thưởng 2', minGames: 3, maxGames: 4 },
    { id: 'reward3', name: 'Phần thưởng 3', minGames: 5, maxGames: 6 }
  ];

  const getCompletedMinigames = (user: any) => {
    return user.scores ? Object.keys(user.scores).filter(key => user.scores[key] > 0).length : 0;
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.telegram.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEligibleUsers = (rewardId: string) => {
    const milestone = rewardMilestones.find(m => m.id === rewardId);
    if (!milestone) return [];

    return filteredUsers.filter(user => {
      const completedMinigames = getCompletedMinigames(user);
      const hasReward = user.rewards?.[rewardId] || false;
      const hasAnyReward = Object.values(user.rewards || {}).some(claimed => claimed);

      return completedMinigames >= milestone.minGames && !hasReward && !hasAnyReward;
    });
  };

  const getClaimedUsers = (rewardId: string) => {
    return filteredUsers.filter(user => user.rewards?.[rewardId] || false);
  };

  const handleUpdateReward = async (username: string, rewardId: string, claimed: boolean) => {
    if (updatingUser) return;

    try {
      setUpdatingUser(username);

      if (claimed) {
        // When claiming a reward, clear all other rewards for this user
        const user = users.find(u => u.telegram === username);
        if (user?.rewards) {
          // Clear all existing rewards first
          for (const existingRewardId of Object.keys(user.rewards)) {
            if (existingRewardId !== rewardId && user.rewards[existingRewardId]) {
              await updateUserReward(username, existingRewardId, false);
            }
          }
        }
      }

      await updateUserReward(username, rewardId, claimed);

      setNotification({
        type: 'success',
        message: `Đã ${claimed ? 'cấp' : 'hủy'} ${rewardMilestones.find(r => r.id === rewardId)?.name} cho ${username}`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error('Error updating reward:', error);
      setNotification({ type: 'error', message: error.message || 'Có lỗi xảy ra' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingUser(null);
    }
  };

  return (
    <Layout title="Quản lý Phần thưởng">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/rewards/details')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <Trophy className="h-4 w-4" />
              <span>Chi tiết</span>
            </button>
            <div className="flex items-center text-white/80 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">{users.length} người chơi</span>
            </div>
          </div>
        </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border-green-500/40 text-green-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

        {/* Content */}
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
              Tìm thấy {filteredUsers.length} người chơi
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
            {/* Info Banner */}
            <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-1">Quy tắc phần thưởng</h4>
                  <p className="text-white/70 text-sm">
                    Mỗi người chơi chỉ được nhận <strong>1 phần thưởng duy nhất</strong>.
                    Khi cấp phần thưởng mới, các phần thưởng cũ sẽ tự động bị hủy.
                  </p>
                </div>
              </div>
            </div>



            {rewardMilestones.map((milestone) => {
              const eligibleUsers = getEligibleUsers(milestone.id);
              const claimedUsers = getClaimedUsers(milestone.id);

              return (
                <div key={milestone.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{milestone.name}</h3>
                        <p className="text-gray-400 text-sm">
                          Hoàn thành {milestone.minGames}-{milestone.maxGames} minigame
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-300 text-sm">{eligibleUsers.length} đủ điều kiện</p>
                    </div>
                  </div>

                  {/* Eligible Users */}
                  {eligibleUsers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-3">
                        Đủ điều kiện nhận thưởng:
                        <span className="text-yellow-400 text-sm ml-2">
                          (Chưa nhận quà nào)
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {eligibleUsers.map((user) => (
                          <div key={user.telegram} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">{user.telegram}</p>
                                <p className="text-yellow-400 text-sm">
                                  {getCompletedMinigames(user)} minigame hoàn thành
                                </p>
                              </div>
                              <button
                                onClick={() => handleUpdateReward(user.telegram, milestone.id, true)}
                                disabled={updatingUser === user.telegram}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {updatingUser === user.telegram ? '...' : 'Cấp thưởng'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                  {eligibleUsers.length === 0 && (
                    <div className="text-center py-4">
                      <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">Chưa có người chơi nào đủ điều kiện</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RewardManagement;
